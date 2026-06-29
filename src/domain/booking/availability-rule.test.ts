import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  applyAvailabilityExceptions,
  AvailabilityResolutionConflictError,
  availabilityExceptionSchema,
  availabilityRuleSchema,
} from "./availability-rule";

const practitionerId = "00000000-0000-4000-8000-000000000001";
const migrationPath = fileURLToPath(
  new URL(
    "../../../prisma/migrations/20260629043000_availability_rules/migration.sql",
    import.meta.url,
  ),
);

describe("availabilityRuleSchema", () => {
  it("accepts local weekly windows with a configurable slot increment", () => {
    expect(
      availabilityRuleSchema.parse({
        localEndTime: "17:30",
        localStartTime: "09:15",
        practitionerId,
        slotIncrementMinutes: 15,
        validFrom: "2026-07-01",
        validUntil: null,
        weekday: 1,
      }),
    ).toMatchObject({ status: "ACTIVE", validFrom: "2026-07-01" });
  });

  it("rejects invalid clocks, reversed intervals, dates and weekdays", () => {
    const base = {
      localEndTime: "17:00",
      localStartTime: "09:00",
      practitionerId,
      slotIncrementMinutes: 15,
      validFrom: null,
      validUntil: null,
      weekday: 1,
    };

    expect(() => availabilityRuleSchema.parse({ ...base, localStartTime: "24:00" })).toThrow();
    expect(() =>
      availabilityRuleSchema.parse({ ...base, localEndTime: "09:00", localStartTime: "10:00" }),
    ).toThrow("bitişi başlangıçtan sonra");
    expect(() => availabilityRuleSchema.parse({ ...base, validFrom: "2026-02-30" })).toThrow();
    expect(() => availabilityRuleSchema.parse({ ...base, weekday: 7 })).toThrow();
  });
});

describe("availabilityExceptionSchema", () => {
  it("requires a closed day to have no clock range", () => {
    expect(
      availabilityExceptionSchema.parse({
        localDate: "2026-07-15",
        practitionerId,
        reasonCode: "OFFICE_CLOSED",
        type: "CLOSED",
      }),
    ).toMatchObject({ localEndTime: null, localStartTime: null, type: "CLOSED" });

    expect(() =>
      availabilityExceptionSchema.parse({
        localDate: "2026-07-15",
        localEndTime: "12:00",
        localStartTime: "09:00",
        practitionerId,
        reasonCode: "OFFICE_CLOSED",
        type: "CLOSED",
      }),
    ).toThrow();
  });

  it("requires ordered clock ranges for custom hours and blocked periods", () => {
    expect(
      availabilityExceptionSchema.parse({
        localDate: "2026-07-15",
        localEndTime: "15:00",
        localStartTime: "13:00",
        practitionerId,
        reasonCode: "ADMIN_BLOCK",
        type: "BLOCKED",
      }),
    ).toMatchObject({ type: "BLOCKED" });

    expect(() =>
      availabilityExceptionSchema.parse({
        localDate: "2026-07-15",
        localEndTime: "13:00",
        localStartTime: "15:00",
        practitionerId,
        reasonCode: "CUSTOM_DAY",
        type: "CUSTOM_HOURS",
      }),
    ).toThrow("bitişi başlangıçtan sonra");
  });
});

describe("availability migration guards", () => {
  it("duplicates critical time and shape validation at the database boundary", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain('CONSTRAINT "availability_rules_weekday_range"');
    expect(migration).toContain('CONSTRAINT "availability_rules_time_order"');
    expect(migration).toContain('CONSTRAINT "availability_exceptions_shape"');
    expect(migration).toContain("\"type\" IN ('CUSTOM_HOURS', 'BLOCKED')");
  });
});

describe("applyAvailabilityExceptions", () => {
  const baseWindows = [{ endTime: "17:00", startTime: "09:00" }];

  it("splits weekly windows around active blocked periods", () => {
    expect(
      applyAvailabilityExceptions("2026-07-15", baseWindows, [
        availabilityExceptionSchema.parse({
          localDate: "2026-07-15",
          localEndTime: "13:00",
          localStartTime: "12:00",
          practitionerId,
          reasonCode: "ADMIN_BLOCK",
          type: "BLOCKED",
        }),
      ]),
    ).toEqual([
      { endTime: "12:00", startTime: "09:00" },
      { endTime: "17:00", startTime: "13:00" },
    ]);
  });

  it("replaces weekly windows with custom hours and closes a closed day", () => {
    const custom = availabilityExceptionSchema.parse({
      localDate: "2026-07-15",
      localEndTime: "16:00",
      localStartTime: "11:00",
      practitionerId,
      reasonCode: "CUSTOM_DAY",
      type: "CUSTOM_HOURS",
    });
    const closed = availabilityExceptionSchema.parse({
      localDate: "2026-07-15",
      practitionerId,
      reasonCode: "OFFICE_CLOSED",
      type: "CLOSED",
    });

    expect(applyAvailabilityExceptions("2026-07-15", baseWindows, [custom])).toEqual([
      { endTime: "16:00", startTime: "11:00" },
    ]);
    expect(applyAvailabilityExceptions("2026-07-15", baseWindows, [closed])).toEqual([]);
  });

  it("requires admin review instead of guessing mixed exception precedence", () => {
    const closed = availabilityExceptionSchema.parse({
      localDate: "2026-07-15",
      practitionerId,
      reasonCode: "OFFICE_CLOSED",
      type: "CLOSED",
    });
    const blocked = availabilityExceptionSchema.parse({
      localDate: "2026-07-15",
      localEndTime: "13:00",
      localStartTime: "12:00",
      practitionerId,
      reasonCode: "ADMIN_BLOCK",
      type: "BLOCKED",
    });

    expect(() => applyAvailabilityExceptions("2026-07-15", baseWindows, [closed, blocked])).toThrow(
      AvailabilityResolutionConflictError,
    );
  });

  it("does not apply an exception belonging to another local date", () => {
    const otherDay = availabilityExceptionSchema.parse({
      localDate: "2026-07-16",
      practitionerId,
      reasonCode: "OFFICE_CLOSED",
      type: "CLOSED",
    });

    expect(applyAvailabilityExceptions("2026-07-15", baseWindows, [otherDay])).toEqual(baseWindows);
  });
});
