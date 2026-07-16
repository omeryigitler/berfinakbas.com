import { describe, expect, it } from "vitest";

import {
  calculateInstallmentPaidAmount,
  calculateLedgerBalance,
  createClientPlanPayloadSchema,
  financeOperationPayloadSchema,
  getInstallmentState,
  recordPaymentPayloadSchema,
  updateInvoiceStatusPayloadSchema,
} from "./finance-operations";

const validPlan = {
  action: "CREATE_PLAN",
  clientId: "11111111-1111-4111-8111-111111111111",
  currency: "TRY",
  idempotencyKey: "plan-create-test-1",
  installments: [
    { amountMinor: "60000", dueDate: "2031-07-01", sequence: 1 },
    { amountMinor: "40000", dueDate: "2031-08-01", sequence: 2 },
  ],
  name: "Sentetik 10 seans planı",
  reason: "Sentetik danışan planı oluşturuluyor.",
  sessionCount: 10,
  sessionDurationMinutes: 50,
  source: "CUSTOM",
  totalAmountMinor: "100000",
  validFrom: "2031-07-01",
  validUntil: "2031-12-31",
};

describe("finance operation schemas", () => {
  it("accepts a balanced plan and converts minor units to bigint", () => {
    const result = createClientPlanPayloadSchema.parse(validPlan);
    expect(result.totalAmountMinor).toBe(100_000n);
    expect(result.installments.map((installment) => installment.amountMinor)).toEqual([
      60_000n,
      40_000n,
    ]);
  });

  it("rejects installment mismatch, sequence gaps, and invalid validity", () => {
    for (const input of [
      { ...validPlan, totalAmountMinor: "100001" },
      {
        ...validPlan,
        installments: [{ amountMinor: "100000", dueDate: "2031-07-01", sequence: 2 }],
      },
      { ...validPlan, validUntil: "2031-06-30" },
    ]) {
      expect(createClientPlanPayloadSchema.safeParse(input).success).toBe(false);
    }
  });

  it("rejects unknown finance action fields", () => {
    expect(
      financeOperationPayloadSchema.safeParse({ ...validPlan, diagnosis: "not accepted" }).success,
    ).toBe(false);
  });

  it("requires a plan for payments and strictly validates invoice status updates", () => {
    expect(
      recordPaymentPayloadSchema.safeParse({
        action: "RECORD_PAYMENT",
        amountMinor: "1000",
        clientId: validPlan.clientId,
        currency: "TRY",
        idempotencyKey: "payment-test-1",
        occurredAt: "2031-07-01T10:00:00.000Z",
        paymentMethodId: "22222222-2222-4222-8222-222222222222",
        planId: "33333333-3333-4333-8333-333333333333",
        reason: "Sentetik ödeme kaydı.",
      }).success,
    ).toBe(false);
    expect(
      updateInvoiceStatusPayloadSchema.safeParse({
        action: "UPDATE_INVOICE_STATUS",
        invoiceReference: "DOC-2031-001",
        invoiceStatus: "ISSUED",
        planId: "33333333-3333-4333-8333-333333333333",
        reason: "Belge düzenlendi olarak işaretleniyor.",
      }).success,
    ).toBe(true);
  });
});

describe("finance calculations", () => {
  it("derives balance and installment payment from append-only signed entries", () => {
    expect(calculateLedgerBalance([{ amountMinor: 100_000n }, { amountMinor: -30_000n }])).toBe(
      70_000n,
    );
    expect(
      calculateInstallmentPaidAmount([{ amountMinor: -30_000n }, { amountMinor: 5_000n }]),
    ).toBe(25_000n);
  });

  it("derives paid, overdue, partial, and due states without mutating installments", () => {
    const now = new Date("2031-07-10T12:00:00.000Z");
    expect(
      getInstallmentState({
        amountDueMinor: 100n,
        dueDate: new Date("2031-07-01"),
        now,
        paidAmountMinor: 100n,
      }),
    ).toBe("PAID");
    expect(
      getInstallmentState({
        amountDueMinor: 100n,
        dueDate: new Date("2031-07-01"),
        now,
        paidAmountMinor: 0n,
      }),
    ).toBe("OVERDUE");
    expect(
      getInstallmentState({
        amountDueMinor: 100n,
        dueDate: new Date("2031-07-12"),
        now,
        paidAmountMinor: 25n,
      }),
    ).toBe("PARTIALLY_PAID");
    expect(
      getInstallmentState({
        amountDueMinor: 100n,
        dueDate: new Date("2031-07-12"),
        now,
        paidAmountMinor: 0n,
      }),
    ).toBe("DUE");
  });
});
