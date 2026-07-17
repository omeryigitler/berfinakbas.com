import { describe, expect, it } from "vitest";

import { buildHubFinanceSummary } from "./hub-finance";

describe("buildHubFinanceSummary", () => {
  it("uses database aggregates for totals and a separate bounded recent list", () => {
    const now = new Date("2026-07-17T12:00:00+03:00");
    const summary = buildHubFinanceSummary(
      [
        {
          amountMinor: -125000n,
          client: { firstName: "Duru", lastName: "Aksu", preferredName: null },
          currency: "TRY",
          id: "entry-1",
          occurredAt: new Date("2026-07-17T10:00:00+03:00"),
          type: "PAYMENT",
        },
      ],
      {
        accruals: [
          { count: 4, currency: "TRY", totalMinor: 500000n },
          { count: 1, currency: "EUR", totalMinor: 30000n },
        ],
        payments: [
          { count: 7, currency: "TRY", totalMinor: -450000n },
          { count: 2, currency: "EUR", totalMinor: -12000n },
        ],
      },
      now,
      "Europe/Istanbul",
    );

    expect(summary.entries).toHaveLength(1);
    expect(summary.entries[0]).toMatchObject({
      clientName: "Duru Aksu",
      typeLabel: "Ödeme",
    });
    expect(summary.monthPaymentLabel).toContain("9 kayıt");
    expect(summary.monthPaymentLabel).toContain("-₺4.500,00");
    expect(summary.monthPaymentLabel).toContain("-€120,00");
    expect(summary.monthAccrualLabel).toContain("5 kayıt");
    expect(summary.monthAccrualLabel).toContain("₺5.000,00");
    expect(summary.monthAccrualLabel).toContain("€300,00");
  });
});
