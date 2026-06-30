import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock, getServerEnvironmentMock } = vi.hoisted(() => ({
  getDatabaseMock: vi.fn(),
  getServerEnvironmentMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import { SlotConflictError } from "@/domain/booking/appointment-hold";

import {
  createAppointmentHold,
  isAllocationConflictError,
  isRetryableTransactionError,
} from "./appointment-hold-service";

const migrationPath = fileURLToPath(
  new URL(
    "../../../prisma/migrations/20260629030000_booking_hold_core/migration.sql",
    import.meta.url,
  ),
);

beforeEach(() => {
  getDatabaseMock.mockReset();
  getServerEnvironmentMock.mockReset();
  getServerEnvironmentMock.mockReturnValue({ BOOKING_HOLD_DURATION_MINUTES: 8 });
});

describe("booking allocation database guard", () => {
  it("rejects invalid boundary identifiers before opening a database transaction", async () => {
    await expect(
      createAppointmentHold({
        correlationId: "sentetik-correlation",
        practitionerId: "not-a-uuid",
        serviceId: "also-not-a-uuid",
        startsAt: new Date("2026-07-01T09:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it("fails closed before database access when hold duration is not configured", async () => {
    getServerEnvironmentMock.mockReturnValue({ BOOKING_HOLD_DURATION_MINUTES: undefined });

    await expect(
      createAppointmentHold({
        correlationId: "sentetik-eksik-hold-suresi",
        practitionerId: "11111111-1111-4111-8111-111111111111",
        serviceId: "22222222-2222-4222-8222-222222222222",
        startsAt: new Date("2031-07-01T09:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "BOOKING_RESOURCE_UNAVAILABLE" });
    expect(getDatabaseMock).not.toHaveBeenCalled();
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

  it("recognizes PostgreSQL deadlock and serialization errors as retryable", () => {
    expect(
      isRetryableTransactionError(Object.assign(new Error("deadlock detected"), { code: "40P01" })),
    ).toBe(true);
    expect(isRetryableTransactionError({ meta: { database_error: "SQLSTATE 40001" } })).toBe(true);
    expect(isRetryableTransactionError(new Error("validation failed"))).toBe(false);
  });

  it("retries a deadlock and maps the resulting overlap to a safe slot conflict", async () => {
    const transaction = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("deadlock detected"), { code: "40P01" }))
      .mockRejectedValueOnce({
        code: "P2004",
        meta: { database_error: "booking_allocations_no_active_overlap (SQLSTATE 23P01)" },
      });
    getDatabaseMock.mockReturnValue({ $transaction: transaction });

    await expect(
      createAppointmentHold(
        {
          correlationId: "sentetik-deadlock-retry",
          practitionerId: "11111111-1111-4111-8111-111111111111",
          serviceId: "22222222-2222-4222-8222-222222222222",
          startsAt: new Date("2031-07-01T09:00:00.000Z"),
        },
        new Date("2031-06-01T09:00:00.000Z"),
      ),
    ).rejects.toBeInstanceOf(SlotConflictError);
    expect(transaction).toHaveBeenCalledTimes(2);
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
