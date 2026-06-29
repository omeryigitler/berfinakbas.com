import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createAppointmentHold, isAllocationConflictError } from "./appointment-hold-service";

const migrationPath = fileURLToPath(
  new URL(
    "../../../prisma/migrations/20260629030000_booking_hold_core/migration.sql",
    import.meta.url,
  ),
);

describe("booking allocation database guard", () => {
  it("rejects invalid boundary identifiers before opening a database transaction", async () => {
    await expect(
      createAppointmentHold({
        correlationId: "sentetik-correlation",
        holdDurationMinutes: 8,
        practitionerId: "not-a-uuid",
        serviceId: "also-not-a-uuid",
        startsAt: new Date("2026-07-01T09:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ name: "ZodError" });
  });

  it("maps the PostgreSQL overlap constraint to a safe slot conflict", () => {
    expect(
      isAllocationConflictError({
        code: "P2004",
        meta: { database_error: "booking_allocations_no_active_overlap (SQLSTATE 23P01)" },
      }),
    ).toBe(true);
    expect(isAllocationConflictError(new Error("unrelated database error"))).toBe(false);
  });

  it("keeps hold and appointment allocations behind one active range exclusion", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain('CONSTRAINT "booking_allocations_exactly_one_owner"');
    expect(migration).toContain('CONSTRAINT "booking_allocations_no_active_overlap"');
    expect(migration).toContain("EXCLUDE USING gist");
    expect(migration).toContain('tstzrange("busy_starts_at", "busy_ends_at", \'[)\') WITH &&');
    expect(migration).toContain("WHERE (\"status\" = 'ACTIVE')");
  });
});
