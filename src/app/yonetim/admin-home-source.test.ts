import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "src/app/yonetim/page.tsx"), "utf8");

describe("admin home Hub contract", () => {
  it("uses business-zone day, week and month boundaries", () => {
    expect(source).toContain("getZonedDayRange");
    expect(source).toContain("getZonedWeekRange");
    expect(source).toContain("getZonedMonthRange");
    expect(source).toContain("const timeZone = environment.BUSINESS_TIME_ZONE");
  });

  it("groups monthly payment totals by currency", () => {
    expect(source).toContain("financeLedgerEntry.groupBy");
    expect(source).toContain('by: ["currency"]');
    expect(source).toContain("formatCurrencyAmounts");
  });

  it("uses the Turkish Hub terminology instead of retired dashboard copy", () => {
    expect(source).toContain('title="Genel bakış"');
    expect(source).toContain("Danışan yönetimi");
    expect(source).toContain("Site iletişim ayarları");
    expect(source).not.toContain('title="Dashboard"');
    expect(source).not.toContain("BO işlemleri");
    expect(source).not.toContain("Public iletişim ayarları");
    expect(source).not.toContain("Danışan notu");
  });

  it("routes detailed availability work to the dedicated Hub workspace", () => {
    expect(source).toContain('href="/yonetim/musaitlik"');
    expect(source).not.toContain("createAvailabilityRule");
  });
});
