import { z } from "zod";

import { isRetryableTransactionError } from "@/lib/booking/appointment-hold-service";
import { getDatabase } from "@/lib/db";
import {
  FinanceConflictError,
  FinancePolicyViolationError,
  FinanceResourceNotFoundError,
} from "@/lib/finance/finance-service";

const MAX_TRANSACTION_ATTEMPTS = 3;

export const simplePlanPaymentSchema = z
  .object({
    amountMinor: z.string().trim().regex(/^[1-9]\d{0,17}$/).transform((value) => BigInt(value)),
    clientId: z.uuid(),
    idempotencyKey: z.string().trim().min(8).max(120),
    note: z.string().trim().max(500).nullable().optional().transform((value) => value || null),
    occurredOn: z.iso.date(),
    planId: z.uuid(),
  })
  .strict();

const contextSchema = z.object({
  actorUserId: z.uuid(),
  correlationId: z.string().trim().min(1).max(80),
});

export type SimplePlanPaymentContext = Readonly<{
  actorUserId: string;
  correlationId: string;
}>;

function paymentDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

function samePayment(
  entry: {
    amountMinor: bigint;
    clientId: string;
    note: string | null;
    occurredAt: Date;
    planId: string | null;
    type: string;
  },
  command: z.infer<typeof simplePlanPaymentSchema>,
): boolean {
  return (
    entry.type === "PAYMENT" &&
    entry.amountMinor === -command.amountMinor &&
    entry.clientId === command.clientId &&
    entry.planId === command.planId &&
    entry.note === command.note &&
    entry.occurredAt.getTime() === paymentDate(command.occurredOn).getTime()
  );
}

function retryable(error: unknown): boolean {
  return (
    isRetryableTransactionError(error) ||
    (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")
  );
}

export async function recordSimplePlanPayment(
  input: unknown,
  contextInput: SimplePlanPaymentContext,
) {
  const command = simplePlanPaymentSchema.parse(input);
  const context = contextSchema.parse(contextInput);
  const database = getDatabase();

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await database.$transaction(
        async (transaction) => {
          const existing = await transaction.financeLedgerEntry.findUnique({
            select: {
              amountMinor: true,
              clientId: true,
              currency: true,
              id: true,
              note: true,
              occurredAt: true,
              planId: true,
              type: true,
            },
            where: { idempotencyKey: command.idempotencyKey },
          });
          if (existing) {
            if (!samePayment(existing, command)) throw new FinanceConflictError();
            return {
              amountMinor: (-existing.amountMinor).toString(),
              currency: existing.currency,
              id: existing.id,
              occurredAt: existing.occurredAt.toISOString(),
              planId: existing.planId,
            };
          }

          const [client, plan] = await Promise.all([
            transaction.client.findUnique({
              select: { status: true },
              where: { id: command.clientId },
            }),
            transaction.clientPlan.findUnique({
              select: { clientId: true, currency: true, id: true, name: true, status: true },
              where: { id: command.planId },
            }),
          ]);

          if (!client || client.status === "INACTIVE") throw new FinanceResourceNotFoundError();
          if (!plan || plan.clientId !== command.clientId || plan.status === "CANCELLED") {
            throw new FinancePolicyViolationError("Seçilen plan bu danışan için ödeme kabul etmiyor.");
          }

          const balance = await transaction.financeLedgerEntry.aggregate({
            _sum: { amountMinor: true },
            where: { clientId: command.clientId, planId: command.planId },
          });
          const outstanding = balance._sum.amountMinor ?? 0n;
          if (outstanding <= 0n) {
            throw new FinancePolicyViolationError("Bu planın kalan ödemesi yok.");
          }
          if (command.amountMinor > outstanding) {
            throw new FinancePolicyViolationError("Ödeme tutarı planın kalan borcunu aşamaz.");
          }

          const occurredAt = paymentDate(command.occurredOn);
          const created = await transaction.financeLedgerEntry.create({
            data: {
              actorUserId: context.actorUserId,
              amountMinor: -command.amountMinor,
              clientId: command.clientId,
              currency: plan.currency,
              idempotencyKey: command.idempotencyKey,
              installmentId: null,
              note: command.note,
              occurredAt,
              paymentMethodId: null,
              planId: plan.id,
              type: "PAYMENT",
            },
            select: {
              amountMinor: true,
              currency: true,
              id: true,
              occurredAt: true,
              planId: true,
            },
          });

          await transaction.auditLog.create({
            data: {
              action: "payment.recorded",
              actorType: "USER",
              actorUserId: context.actorUserId,
              afterSummary: {
                amountMinor: command.amountMinor.toString(),
                currency: plan.currency,
                planId: plan.id,
                planName: plan.name,
              },
              correlationId: context.correlationId,
              entityId: created.id,
              entityType: "FINANCE_LEDGER_ENTRY",
              reason: "SIMPLE_PLAN_PAYMENT",
            },
          });

          return {
            amountMinor: (-created.amountMinor).toString(),
            currency: created.currency,
            id: created.id,
            occurredAt: created.occurredAt.toISOString(),
            planId: created.planId,
            planName: plan.name,
            remainingMinor: (outstanding - command.amountMinor).toString(),
          };
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (retryable(error) && attempt < MAX_TRANSACTION_ATTEMPTS) continue;
      if (retryable(error)) throw new FinanceConflictError();
      throw error;
    }
  }

  throw new FinanceConflictError();
}
