import { z } from "zod";

const currencySchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/);
const invoiceStatusSchema = z.enum([
  "NOT_REQUIRED",
  "PENDING",
  "ISSUED",
  "SENT_TO_ACCOUNTING",
  "CANCELLED",
]);
const positiveMinorAmountSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{0,17}$/)
  .transform((value) => BigInt(value));
const idempotencyKeySchema = z.string().trim().min(8).max(120);
const optionalTrimmedString = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .nullable()
    .optional()
    .transform((value) => value || null);

const installmentSchema = z
  .object({
    amountMinor: positiveMinorAmountSchema,
    dueDate: z.iso.date(),
    sequence: z.number().int().min(1).max(120),
  })
  .strict();

export const createClientPlanPayloadSchema = z
  .object({
    action: z.literal("CREATE_PLAN"),
    clientId: z.uuid(),
    currency: currencySchema,
    idempotencyKey: idempotencyKeySchema,
    installments: z.array(installmentSchema).min(1).max(120),
    invoiceStatus: invoiceStatusSchema.default("NOT_REQUIRED"),
    name: z.string().trim().min(2).max(160),
    reason: z.string().trim().min(8).max(500),
    sessionCount: z.number().int().min(1).max(1_000),
    sessionDurationMinutes: z.number().int().min(5).max(480),
    source: z.enum(["CUSTOM", "TEMPLATE"]).default("CUSTOM"),
    totalAmountMinor: positiveMinorAmountSchema,
    validFrom: z.iso.date(),
    validUntil: z.iso.date().nullable().optional().default(null),
  })
  .strict()
  .superRefine((input, context) => {
    const sequences = input.installments.map((installment) => installment.sequence);
    if (new Set(sequences).size !== sequences.length) {
      context.addIssue({
        code: "custom",
        message: "Taksit sıraları tekil olmalıdır.",
        path: ["installments"],
      });
    }
    const ordered = [...sequences].sort((left, right) => left - right);
    if (ordered.some((sequence, index) => sequence !== index + 1)) {
      context.addIssue({
        code: "custom",
        message: "Taksit sırası 1’den başlayıp kesintisiz ilerlemelidir.",
        path: ["installments"],
      });
    }
    const installmentTotal = input.installments.reduce(
      (total, installment) => total + installment.amountMinor,
      0n,
    );
    if (installmentTotal !== input.totalAmountMinor) {
      context.addIssue({
        code: "custom",
        message: "Taksit toplamı plan toplamına eşit olmalıdır.",
        path: ["installments"],
      });
    }
    if (input.validUntil && input.validUntil < input.validFrom) {
      context.addIssue({
        code: "custom",
        message: "Plan bitişi başlangıçtan önce olamaz.",
        path: ["validUntil"],
      });
    }
  });

export const createPaymentMethodPayloadSchema = z
  .object({
    action: z.literal("CREATE_PAYMENT_METHOD"),
    key: z
      .string()
      .trim()
      .regex(/^[A-Z][A-Z0-9_]{1,79}$/),
    name: z.string().trim().min(2).max(120),
    reason: z.string().trim().min(8).max(500),
    sortOrder: z.number().int().min(0).max(10_000).default(0),
  })
  .strict();

export const recordPaymentPayloadSchema = z
  .object({
    action: z.literal("RECORD_PAYMENT"),
    amountMinor: positiveMinorAmountSchema,
    clientId: z.uuid(),
    currency: currencySchema,
    externalReference: optionalTrimmedString(160),
    idempotencyKey: idempotencyKeySchema,
    installmentId: z.uuid(),
    note: optionalTrimmedString(500),
    occurredAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    paymentMethodId: z.uuid(),
    planId: z.uuid(),
    reason: z.string().trim().min(8).max(500),
  })
  .strict();

export const updateInvoiceStatusPayloadSchema = z
  .object({
    action: z.literal("UPDATE_INVOICE_STATUS"),
    invoiceReference: optionalTrimmedString(160),
    invoiceStatus: invoiceStatusSchema,
    planId: z.uuid(),
    reason: z.string().trim().min(8).max(500),
  })
  .strict();

export const reversePaymentPayloadSchema = z
  .object({
    action: z.literal("REVERSE_PAYMENT"),
    entryId: z.uuid(),
    idempotencyKey: idempotencyKeySchema,
    reason: z.string().trim().min(8).max(500),
  })
  .strict();

export const financeOperationPayloadSchema = z.discriminatedUnion("action", [
  createClientPlanPayloadSchema,
  createPaymentMethodPayloadSchema,
  recordPaymentPayloadSchema,
  reversePaymentPayloadSchema,
  updateInvoiceStatusPayloadSchema,
]);

export const financeOverviewQuerySchema = z
  .object({
    status: z.enum(["ALL", "DUE_7_DAYS", "OVERDUE"]).default("ALL"),
  })
  .strict();

export type LedgerAmount = Readonly<{ amountMinor: bigint }>;
export type InstallmentState = "DUE" | "OVERDUE" | "PAID" | "PARTIALLY_PAID";

export function calculateLedgerBalance(entries: readonly LedgerAmount[]): bigint {
  return entries.reduce((total, entry) => total + entry.amountMinor, 0n);
}

export function calculateInstallmentPaidAmount(entries: readonly LedgerAmount[]): bigint {
  const net = calculateLedgerBalance(entries);
  return net < 0n ? -net : 0n;
}

export function getInstallmentState(input: {
  amountDueMinor: bigint;
  dueDate: Date;
  now: Date;
  paidAmountMinor: bigint;
}): InstallmentState {
  if (input.paidAmountMinor >= input.amountDueMinor) return "PAID";
  if (input.dueDate < startOfUtcDay(input.now)) return "OVERDUE";
  if (input.paidAmountMinor > 0n) return "PARTIALLY_PAID";
  return "DUE";
}

export function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function dateFromIsoDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
