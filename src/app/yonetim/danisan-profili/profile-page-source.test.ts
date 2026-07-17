import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/app/yonetim/danisan-profili/profile-page.tsx"),
  "utf8",
);
const routeSource = readFileSync(
  join(process.cwd(), "src/app/yonetim/danisan-profili/page.tsx"),
  "utf8",
);

describe("client profile Hub source contract", () => {
  it("routes the public admin path through the new focused profile page", () => {
    expect(routeSource).toContain('from "./profile-page"');
  });

  it("uses currency-safe and permission-aware summary helpers", () => {
    expect(source).toContain("buildClientProfileFinanceSummary");
    expect(source).toContain("buildClientProfileOperationStatus");
    expect(source).toContain("formatMinorCurrency");
    expect(source).not.toContain("Number(amountMinor) / 100");
    expect(source).not.toContain('financePlans[0]?.currency ?? "TRY"');
  });

  it("does not claim missing records when permission is absent", () => {
    expect(source).toContain("Randevu yetkisi gerekir");
    expect(source).toContain("Finans yetkisi gerekir");
    expect(source).toContain("canReadAppointments");
    expect(source).toContain("canReadFinance");
  });

  it("includes management notes in the visible operation flow", () => {
    expect(source).toContain("database.clientNote.findMany");
    expect(source).toContain("noteEvents");
    expect(source).toContain("Operasyon notu eklendi");
  });
});
