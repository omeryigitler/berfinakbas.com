import { describe, expect, it } from "vitest";

import {
  assertMinimumBookingNotice,
  prepareAppointmentHold,
  SlotConflictError,
} from "./appointment-hold";

describe("prepareAppointmentHold", () => {
  it("creates a single-use token hash and preserves custom duration and buffers", () => {
    const prepared = prepareAppointmentHold({
      bufferAfterMinutes: 11,
      bufferBeforeMinutes: 7,
      durationMinutes: 52,
      holdDurationMinutes: 8,
      now: new Date("2026-06-29T09:00:00.000Z"),
      startsAt: new Date("2026-06-29T10:00:00.000Z"),
      token: "sentetik-hold-token-0000000000000000000000000001",
    });

    expect(prepared).toMatchObject({
      busyEndsAt: new Date("2026-06-29T11:03:00.000Z"),
      busyStartsAt: new Date("2026-06-29T09:53:00.000Z"),
      endsAt: new Date("2026-06-29T10:52:00.000Z"),
      expiresAt: new Date("2026-06-29T09:08:00.000Z"),
      startsAt: new Date("2026-06-29T10:00:00.000Z"),
    });
    expect(prepared.holderTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(prepared.holderTokenHash).not.toContain(prepared.holderToken);
    expect(Object.isFrozen(prepared)).toBe(true);
  });

  it("rejects past slots and invalid configurable hold durations", () => {
    const common = {
      bufferAfterMinutes: 0,
      bufferBeforeMinutes: 0,
      durationMinutes: 45,
      now: new Date("2026-06-29T09:00:00.000Z"),
      startsAt: new Date("2026-06-29T08:59:00.000Z"),
      token: "sentetik-hold-token-0000000000000000000000000001",
    };

    expect(() => prepareAppointmentHold({ ...common, holdDurationMinutes: 8 })).toThrow(
      "Yalnızca gelecekteki bir slot",
    );
    expect(() =>
      prepareAppointmentHold({
        ...common,
        holdDurationMinutes: 0,
        startsAt: new Date("2026-06-29T10:00:00.000Z"),
      }),
    ).toThrow("Hold süresi");
  });

  it("never keeps a hold alive beyond the slot start", () => {
    const prepared = prepareAppointmentHold({
      bufferAfterMinutes: 0,
      bufferBeforeMinutes: 0,
      durationMinutes: 45,
      holdDurationMinutes: 10,
      now: new Date("2026-06-29T09:00:00.000Z"),
      startsAt: new Date("2026-06-29T09:05:00.000Z"),
      token: "sentetik-hold-token-0000000000000000000000000001",
    });

    expect(prepared.expiresAt).toEqual(prepared.startsAt);
  });
});

describe("assertMinimumBookingNotice", () => {
  it("accepts the exact boundary and rejects an earlier start", () => {
    const now = new Date("2026-06-29T09:00:00.000Z");

    expect(() =>
      assertMinimumBookingNotice(new Date("2026-06-29T10:00:00.000Z"), now, 60),
    ).not.toThrow();
    expect(() => assertMinimumBookingNotice(new Date("2026-06-29T09:59:59.999Z"), now, 60)).toThrow(
      SlotConflictError,
    );
  });
});
