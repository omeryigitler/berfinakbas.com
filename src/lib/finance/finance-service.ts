import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { isRetryableTransactionError } from "@/lib/booking/appointment-hold-service";
import {
  calculateInstallmentPaidAmount,
  calculateLedgerBalance,
  createClientPlanPayloadSchema,
  createPaymentMethodPayloadSchema,
  dateFromIsoDay,
  financeOperationPayloadSchema,
  financeOverviewQuerySchema,
  getInstallmentState,
  recordPaymentPayloadSchema,
  reversePaymentPayloadSchema,
  startOfUtcDay,
  updateInvoiceStatusPayloadSchema,
} from "@/domain/finance/finance-operations";
import { getDatabase } from "@/lib/db";

const MAX_TRANSACTION_ATTEMPTS = 3;

function isRetryableFinanceWriteError(error: unknown): boolean {
  return (
    isRetryableTransactionError(error) ||
    (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")
  );
}

const financeContextSchema = z.object({
  actorUserId: z.uuid(),
  correlationId: z.string().trim().min(1).max(80),
  now: z.date().optional(),
});

export type FinanceMutationContext = Readonly<{
  actorUserId: string;
  correlationId: string;
  now?: Date;
}>;

export class FinanceResourceNotFoundError extends Error {
  readonly code = "FINANCE_RESOURCE_NOT_FOUND";
  constructor() {
    super("Finans işlemi için gerekli kayıt bulunamadı.");
    this.name = "FinanceResourceNotFoundError";
  }
}

export class FinancePolicyViolationError extends Error {
  readonly code = "FINANCE_POLICY_VIOLATION";
  constructor(message = "Finans işlemi tanımlı kurallarla uyuşmuyor.") {
    super(message);
    this.name = "FinancePolicyViolationError";
  }
}

export class FinanceConflictError extends Error {
  readonly code = "FINANCE_CONFLICT";
  constructor() {
    super("Finans işlemi başka bir işlemle çakıştı. Lütfen durumu yenileyin.");
    this.name = "FinanceConflictError";
  }
}

function serializeLedgerEntry(entry: {
  amountMinor: bigint;
  clientId: string;
  currency: string;
  id: string;
  installmentId: string | null;
  occurredAt: Date;
  planId: string | null;
  type: string;
}) {
  return Object.freeze({
    amountMinor: entry.amountMinor.toString(),
    clientId: entry.clientId,
    currency: entry.currency,
    id: entry.id,
    installmentId: entry.installmentId,
    occurredAt: entry.occurredAt.toISOString(),
    planId: entry.planId,
    type: entry.type,
  });
}

function serializeClientPlan(plan: {
  clientId: string;
  currency: string;
  id: string;
  invoiceReference: string | null;
  invoiceStatus: string;
  name: string;
  sessionCount: number;
  sessionDurationMinutes: number;
  source: string;
  status: string;
  totalAmountMinor: bigint;
  validFrom: Date;
  validUntil: Date | null;
}) {
  return Object.freeze({
    clientId: plan.clientId,
    currency: plan.currency,
    id: plan.id,
    invoiceReference: plan.invoiceReference,
    invoiceStatus: plan.invoiceStatus,
    name: plan.name,
    sessionCount: plan.sessionCount,
    sessionDurationMinutes: plan.sessionDurationMinutes,
    source: plan.source,
    status: plan.status,
    totalAmountMinor: plan.totalAmountMinor.toString(),
    validFrom: plan.validFrom.toISOString().slice(0, 10),
    validUntil: plan.validUntil?.toISOString().slice(0, 10) ?? null,
  });
}

function isSamePayment(
  entry: {
    amountMinor: bigint;
    clientId: string;
    currency: string;
    externalReference: string | null;
    installmentId: string | null;
    note: string | null;
    occurredAt: Date;
    paymentMethodId: string | null;
    planId: string | null;
  },
  command: z.infer<typeof recordPaymentPayloadSchema>,
) {
  return (
    entry.amountMinor === -command.amountMinor &&
    entry.clientId === command.clientId &&
    entry.currency === command.currency &&
    entry.externalReference === command.externalReference &&
    entry.installmentId === command.installmentId &&
    entry.note === command.note &&
    entry.occurredAt.getTime() === command.occurredAt.getTime() &&
    entry.paymentMethodId === command.paymentMethodId &&
    entry.planId === command.planId
  );
}

async function withSerializableRetry<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const database = getDatabase();
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await database.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      if (isRetryableFinanceWriteError(error)) {
        if (attempt < MAX_TRANSACTION_ATTEMPTS) continue;
        throw new FinanceConflictError();
      }
      throw error;
    }
  }
  throw new FinanceConflictError();
}

export async function createPaymentMethod(input: unknown, contextInput: FinanceMutationContext) {
  const command = createPaymentMethodPayloadSchema.parse(input);
  const context = financeContextSchema.parse(contextInput);

  return withSerializableRetry(async (transaction) => {
    const existing = await transaction.paymentMethod.findUnique({ where: { key: command.key } });
    if (existing) {
      if (
        existing.name !== command.name ||
        existing.sortOrder !== command.sortOrder ||
        existing.status !== "ACTIVE"
      ) {
        throw new FinanceConflictError();
      }
      return existing;
    }
    const method = await transaction.paymentMethod.create({
      data: {
        createdByUserId: context.actorUserId,
        key: command.key,
        name: command.name,
        sortOrder: command.sortOrder,
        status: "ACTIVE",
      },
    });
    await transaction.auditLog.create({
      data: {
        action: "payment_method.created",
        actorType: "USER",
        actorUserId: context.actorUserId,
        afterSummary: { key: method.key, status: method.status },
        correlationId: context.correlationId,
        entityId: method.id,
        entityType: "PAYMENT_METHOD",
        reason: command.reason,
      },
    });
    return method;
  });
}

export async function createClientPlan(input: unknown, contextInput: FinanceMutationContext) {
  const command = createClientPlanPayloadSchema.parse(input);
  const context = financeContextSchema.parse(contextInput);
  const now = context.now ?? new Date();

  const plan = await withSerializableRetry(async (transaction) => {
    const existing = await transaction.financeLedgerEntry.findUnique({
      include: { plan: { include: { installments: { orderBy: { sequence: "asc" } } } } },
      where: { idempotencyKey: command.idempotencyKey },
    });
    if (existing?.type === "ACCRUAL" && existing.plan) {
      const expectedInstallments = [...command.installments].sort(
        (left, right) => left.sequence - right.sequence,
      );
      const matches =
        existing.plan.clientId === command.clientId &&
        existing.plan.currency === command.currency &&
        existing.plan.invoiceStatus === command.invoiceStatus &&
        existing.plan.name === command.name &&
        existing.plan.sessionCount === command.sessionCount &&
        existing.plan.sessionDurationMinutes === command.sessionDurationMinutes &&
        existing.plan.source === command.source &&
        existing.plan.totalAmountMinor === command.totalAmountMinor &&
        existing.plan.validFrom.toISOString().slice(0, 10) === command.validFrom &&
        (existing.plan.validUntil?.toISOString().slice(0, 10) ?? null) === command.validUntil &&
        existing.plan.installments.length === expectedInstallments.length &&
        existing.plan.installments.every((installment, index) => {
          const expected = expectedInstallments[index];
          return (
            installment.amountDueMinor === expected.amountMinor &&
            installment.dueDate.toISOString().slice(0, 10) === expected.dueDate &&
            installment.sequence === expected.sequence
          );
        });
      if (!matches) throw new FinanceConflictError();
      return existing.plan;
    }
    if (existing) throw new FinanceConflictError();

    const client = await transaction.client.findUnique({
      select: { id: true, status: true },
      where: { id: command.clientId },
    });
    if (!client || client.status === "INACTIVE") throw new FinanceResourceNotFoundError();

    const plan = await transaction.clientPlan.create({
      data: {
        clientId: client.id,
        createdByUserId: context.actorUserId,
        currency: command.currency,
        invoiceStatus: command.invoiceStatus,
        name: command.name,
        sessionCount: command.sessionCount,
        sessionDurationMinutes: command.sessionDurationMinutes,
        source: command.source,
        status: "ACTIVE",
        totalAmountMinor: command.totalAmountMinor,
        validFrom: dateFromIsoDay(command.validFrom),
        validUntil: command.validUntil ? dateFromIsoDay(command.validUntil) : null,
      },
    });
    await transaction.planInstallment.createMany({
      data: command.installments.map((installment) => ({
        amountDueMinor: installment.amountMinor,
        dueDate: dateFromIsoDay(installment.dueDate),
        planId: plan.id,
        sequence: installment.sequence,
      })),
    });
    await transaction.financeLedgerEntry.create({
      data: {
        actorUserId: context.actorUserId,
        amountMinor: command.totalAmountMinor,
        clientId: client.id,
        currency: command.currency,
        idempotencyKey: command.idempotencyKey,
        occurredAt: now,
        planId: plan.id,
        type: "ACCRUAL",
      },
    });
    await transaction.sessionCreditEntry.create({
      data: {
        actorUserId: context.actorUserId,
        idempotencyKey: command.idempotencyKey,
        planId: plan.id,
        quantityDelta: command.sessionCount,
        reasonCode: "PLAN_CREATED",
        type: "GRANT",
      },
    });
    await transaction.auditLog.create({
      data: {
        action: "client_plan.created",
        actorType: "USER",
        actorUserId: context.actorUserId,
        afterSummary: {
          currency: plan.currency,
          sessionCount: plan.sessionCount,
          source: plan.source,
          status: plan.status,
        },
        correlationId: context.correlationId,
        entityId: plan.id,
        entityType: "CLIENT_PLAN",
        reason: command.reason,
      },
    });
    return plan;
  });

  return serializeClientPlan(plan);
}

export async function recordPayment(input: unknown, contextInput: FinanceMutationContext) {
  const command = recordPaymentPayloadSchema.parse(input);
  const context = financeContextSchema.parse(contextInput);

  const entry = await withSerializableRetry(async (transaction) => {
    const existing = await transaction.financeLedgerEntry.findUnique({
      where: { idempotencyKey: command.idempotencyKey },
    });
    if (existing?.type === "PAYMENT") {
      if (!isSamePayment(existing, command)) throw new FinanceConflictError();
      return existing;
    }
    if (existing) throw new FinanceConflictError();

    const [client, paymentMethod] = await Promise.all([
      transaction.client.findUnique({ select: { status: true }, where: { id: command.clientId } }),
      transaction.paymentMethod.findUnique({
        select: { status: true },
        where: { id: command.paymentMethodId },
      }),
    ]);
    if (!client || client.status === "INACTIVE" || paymentMethod?.status !== "ACTIVE") {
      throw new FinanceResourceNotFoundError();
    }

    const plan = await transaction.clientPlan.findUnique({ where: { id: command.planId } });
    if (
      !plan ||
      plan.clientId !== command.clientId ||
      plan.currency !== command.currency ||
      plan.status !== "ACTIVE"
    ) {
      throw new FinancePolicyViolationError();
    }
    const installment = await transaction.planInstallment.findUnique({
      select: { amountDueMinor: true, planId: true },
      where: { id: command.installmentId },
    });
    if (installment?.planId !== plan.id) throw new FinancePolicyViolationError();
    const installmentLedger = await transaction.financeLedgerEntry.aggregate({
      _sum: { amountMinor: true },
      where: { installmentId: command.installmentId },
    });
    const installmentOutstanding =
      installment.amountDueMinor + (installmentLedger._sum.amountMinor ?? 0n);
    if (installmentOutstanding <= 0n || command.amountMinor > installmentOutstanding) {
      throw new FinancePolicyViolationError("Ödeme tutarı seçilen taksidin kalan tutarını aşamaz.");
    }

    const balance = await transaction.financeLedgerEntry.aggregate({
      _sum: { amountMinor: true },
      where: {
        clientId: command.clientId,
        currency: command.currency,
        planId: command.planId,
      },
    });
    const outstanding = balance._sum.amountMinor ?? 0n;
    if (outstanding <= 0n || command.amountMinor > outstanding) {
      throw new FinancePolicyViolationError(
        "Fazla ödeme kaydı açık ürün kararı olmadan kabul edilmez.",
      );
    }

    const created = await transaction.financeLedgerEntry.create({
      data: {
        actorUserId: context.actorUserId,
        amountMinor: -command.amountMinor,
        clientId: command.clientId,
        currency: command.currency,
        externalReference: command.externalReference,
        idempotencyKey: command.idempotencyKey,
        installmentId: command.installmentId,
        note: command.note,
        occurredAt: command.occurredAt,
        paymentMethodId: command.paymentMethodId,
        planId: command.planId,
        type: "PAYMENT",
      },
    });
    await transaction.auditLog.create({
      data: {
        action: "payment.recorded",
        actorType: "USER",
        actorUserId: context.actorUserId,
        afterSummary: { currency: created.currency, planId: created.planId, type: created.type },
        correlationId: context.correlationId,
        entityId: created.id,
        entityType: "FINANCE_LEDGER_ENTRY",
        reason: command.reason,
      },
    });
    return created;
  });

  return serializeLedgerEntry(entry);
}

export async function reversePayment(input: unknown, contextInput: FinanceMutationContext) {
  const command = reversePaymentPayloadSchema.parse(input);
  const context = financeContextSchema.parse(contextInput);
  const now = context.now ?? new Date();

  const entry = await withSerializableRetry(async (transaction) => {
    const existing = await transaction.financeLedgerEntry.findUnique({
      where: { idempotencyKey: command.idempotencyKey },
    });
    if (existing?.type === "REVERSAL") {
      if (existing.reversesEntryId !== command.entryId) throw new FinanceConflictError();
      return existing;
    }
    if (existing) throw new FinanceConflictError();

    const original = await transaction.financeLedgerEntry.findUnique({
      include: { reversedBy: { select: { id: true } } },
      where: { id: command.entryId },
    });
    if (!original || original.type !== "PAYMENT") throw new FinanceResourceNotFoundError();
    if (original.reversedBy) throw new FinanceConflictError();

    const reversal = await transaction.financeLedgerEntry.create({
      data: {
        actorUserId: context.actorUserId,
        amountMinor: -original.amountMinor,
        appointmentId: original.appointmentId,
        clientId: original.clientId,
        currency: original.currency,
        idempotencyKey: command.idempotencyKey,
        installmentId: original.installmentId,
        occurredAt: now,
        planId: original.planId,
        reversesEntryId: original.id,
        type: "REVERSAL",
      },
    });
    await transaction.auditLog.create({
      data: {
        action: "payment.reversed",
        actorType: "USER",
        actorUserId: context.actorUserId,
        afterSummary: { originalEntryId: original.id, type: reversal.type },
        correlationId: context.correlationId,
        entityId: reversal.id,
        entityType: "FINANCE_LEDGER_ENTRY",
        reason: command.reason,
      },
    });
    return reversal;
  });

  return serializeLedgerEntry(entry);
}

export async function updateInvoiceStatus(input: unknown, contextInput: FinanceMutationContext) {
  const command = updateInvoiceStatusPayloadSchema.parse(input);
  const context = financeContextSchema.parse(contextInput);

  const plan = await withSerializableRetry(async (transaction) => {
    const existing = await transaction.clientPlan.findUnique({ where: { id: command.planId } });
    if (!existing) throw new FinanceResourceNotFoundError();
    if (
      existing.invoiceStatus === command.invoiceStatus &&
      existing.invoiceReference === command.invoiceReference
    ) {
      return existing;
    }

    const updated = await transaction.clientPlan.update({
      data: {
        invoiceReference: command.invoiceReference,
        invoiceStatus: command.invoiceStatus,
      },
      where: { id: existing.id },
    });
    await transaction.auditLog.create({
      data: {
        action: "client_plan.invoice_status_changed",
        actorType: "USER",
        actorUserId: context.actorUserId,
        afterSummary: {
          invoiceReference: updated.invoiceReference,
          invoiceStatus: updated.invoiceStatus,
        },
        beforeSummary: {
          invoiceReference: existing.invoiceReference,
          invoiceStatus: existing.invoiceStatus,
        },
        correlationId: context.correlationId,
        entityId: updated.id,
        entityType: "CLIENT_PLAN",
        reason: command.reason,
      },
    });
    return updated;
  });

  return serializeClientPlan(plan);
}

export async function executeFinanceOperation(input: unknown, context: FinanceMutationContext) {
  const command = financeOperationPayloadSchema.parse(input);
  switch (command.action) {
    case "CREATE_PAYMENT_METHOD":
      return createPaymentMethod(command, context);
    case "CREATE_PLAN":
      return createClientPlan(command, context);
    case "RECORD_PAYMENT":
      return recordPayment(command, context);
    case "REVERSE_PAYMENT":
      return reversePayment(command, context);
    case "UPDATE_INVOICE_STATUS":
      return updateInvoiceStatus(command, context);
  }
}

export async function getFinanceOverview(input: unknown, now = new Date()) {
  const query = financeOverviewQuerySchema.parse(input);
  const currentTime = z.date().parse(now);
  const today = startOfUtcDay(currentTime);
  const dueSoon = new Date(today.getTime() + 7 * 86_400_000);
  const database = getDatabase();
  const [clients, paymentMethods, plans] = await Promise.all([
    database.client.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
      select: { firstName: true, id: true, lastName: true, status: true },
      take: 200,
      where: { status: { in: ["PROSPECTIVE", "ACTIVE"] } },
    }),
    database.paymentMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      select: { id: true, key: true, name: true, status: true },
      where: { status: "ACTIVE" },
    }),
    database.clientPlan.findMany({
      include: {
        client: { select: { firstName: true, lastName: true } },
        installments: {
          include: { ledgerEntries: { select: { amountMinor: true } } },
          orderBy: { sequence: "asc" },
        },
        ledgerEntries: {
          orderBy: { occurredAt: "desc" },
          select: {
            amountMinor: true,
            createdAt: true,
            id: true,
            occurredAt: true,
            reversesEntryId: true,
            type: true,
          },
        },
        sessionCreditEntries: { select: { quantityDelta: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const summaries = plans.map((plan) => {
    const installments = plan.installments.map((installment) => {
      const paidAmountMinor = calculateInstallmentPaidAmount(installment.ledgerEntries);
      const state = getInstallmentState({
        amountDueMinor: installment.amountDueMinor,
        dueDate: installment.dueDate,
        now: currentTime,
        paidAmountMinor,
      });
      return {
        amountDueMinor: installment.amountDueMinor.toString(),
        dueDate: installment.dueDate.toISOString().slice(0, 10),
        id: installment.id,
        paidAmountMinor: paidAmountMinor.toString(),
        sequence: installment.sequence,
        state,
      };
    });
    return {
      balanceMinor: calculateLedgerBalance(plan.ledgerEntries).toString(),
      client: plan.client,
      clientId: plan.clientId,
      currency: plan.currency,
      id: plan.id,
      installments,
      invoiceReference: plan.invoiceReference,
      invoiceStatus: plan.invoiceStatus,
      ledgerEntries: plan.ledgerEntries.map((entry) => ({
        amountMinor: entry.amountMinor.toString(),
        id: entry.id,
        occurredAt: entry.occurredAt.toISOString(),
        reversesEntryId: entry.reversesEntryId,
        type: entry.type,
      })),
      name: plan.name,
      remainingSessions: plan.sessionCreditEntries
        .reduce((total, entry) => total + entry.quantityDelta, 0)
        .toString(),
      status: plan.status,
      totalAmountMinor: plan.totalAmountMinor.toString(),
    };
  });
  const filteredPlans = summaries.filter((plan) => {
    if (query.status === "ALL") return true;
    return plan.installments.some((installment) => {
      const dueDate = dateFromIsoDay(installment.dueDate);
      if (query.status === "OVERDUE") return installment.state === "OVERDUE";
      return installment.state !== "PAID" && dueDate >= today && dueDate <= dueSoon;
    });
  });

  return Object.freeze({ clients, paymentMethods, plans: filteredPlans });
}
