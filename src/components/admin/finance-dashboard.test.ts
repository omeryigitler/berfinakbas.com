import { describe, expect, it } from "vitest";

import { amountToMinor, formatMoney } from "./finance-dashboard";

describe("finance dashboard money helpers", () => {
  it("converts Turkish and dot decimal input to integer minor units", () => {
    expect(amountToMinor("125,50")).toBe("12550");
    expect(amountToMinor("125.5")).toBe("12550");
    expect(amountToMinor("0")).toBeNull();
    expect(amountToMinor("12.345")).toBeNull();
  });

  it("formats large signed minor-unit values without number precision loss", () => {
    const formatted = formatMoney("900719925474099301", "TRY");
    expect(formatted.replace(/\D/g, "")).toContain("900719925474099301");
    expect(formatMoney("-50", "TRY")).toMatch(/^-.*50/);
  });
});
