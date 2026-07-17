import { describe, expect, it } from "vitest";

import {
  formatCurrencyAggregateLabel,
  formatCurrencyAmounts,
  formatMinorCurrency,
  normalizeCurrencyAggregates,
} from "./currency-summary";

describe("currency finance summaries", () => {
  it("keeps different currencies separate", () => {
    const rows = [
      { count: 2, currency: "TRY", totalMinor: 150000n },
      { count: 1, currency: "EUR", totalMinor: 50000n },
    ];

    const label = formatCurrencyAggregateLabel(rows);
    expect(label).toContain("3 kayıt");
    expect(label).toContain("₺1.500,00");
    expect(label).toContain("€500,00");
    expect(label).toContain(" + ");
  });

  it("combines duplicate rows only inside the same currency", () => {
    expect(
      normalizeCurrencyAggregates([
        { count: 1, currency: "try", totalMinor: 10000n },
        { count: 2, currency: "TRY", totalMinor: 25000n },
        { count: 1, currency: "EUR", totalMinor: 5000n },
      ]),
    ).toEqual([
      { count: 1, currency: "EUR", totalMinor: 5000n },
      { count: 3, currency: "TRY", totalMinor: 35000n },
    ]);
  });

  it("formats large BigInt amounts without converting the total to Number", () => {
    expect(formatMinorCurrency(9_007_199_254_740_993_00n, "TRY")).toContain(
      "9.007.199.254.740.993,00",
    );
  });

  it("returns an explicit empty state instead of inventing a default currency", () => {
    expect(formatCurrencyAmounts([])).toBe("Kayıt yok");
    expect(formatCurrencyAggregateLabel([])).toBe("0 kayıt");
  });
});
