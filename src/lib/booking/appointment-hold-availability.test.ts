import { describe, expect, it } from "vitest";

import {
  BookingResourceUnavailableError,
  SlotConflictError,
} from "@/domain/booking/appointment-hold";

import {
  assertAppointmentHoldAvailability,
  getZonedBookingDate,
  getZonedBookingDayRange,
  type AssertAppointmentHoldAvailabilityInput,
} from "./appointment-hold-availability";

const baseInput = {
  bookingMaxAdvanceDays: 60,
  bookingMinNoticeMinutes: 60,
  bufferAfterMinutes: 5,
  bufferBeforeMinutes: 5,
  durationMinutes: 50,
  reservedBookingsCount: 0,
  exceptions: [],
  maxDailyAppointments: 6,
  now: new Date("2026-06-29T06:00:00.000Z"),
  rules: [{ localEndTime: "13:00", localStartTime: "09:00", slotIncrementMinutes: 15 }],
  startsAt: new Date("2026-06-29T07:00:00.000Z"),
  timeZone: "Europe/Istanbul",
} satisfies AssertAppointmentHoldAvailabilityInput;

describe("appointment hold availability", () => {
  it("accepts only a generated slot in the practitioner's local schedule", () => {
    expect(() => assertAppointmentHoldAvailability(baseInput)).not.toThrow();
    expect(() =>
      assertAppointmentHoldAvailability({
        ...baseInput,
        startsAt: new Date("2026-06-29T07:07:00.000Z"),
      }),
    ).toThrow(SlotConflictError);
  });

  it("rejects closed and blocked local-time exceptions", () => {
    expect(() =>
      assertAppointmentHoldAvailability({
        ...baseInput,
        exceptions: [
          {
            localDate: "2026-06-29",
            localEndTime: null,
            localStartTime: null,
            practitionerId: "11111111-1111-4111-8111-111111111111",
            privateNote: null,
            reasonCode: "SYNTHETIC_CLOSED_DAY",
            status: "ACTIVE",
            type: "CLOSED",
          },
        ],
      }),
    ).toThrow(SlotConflictError);
    expect(() =>
      assertAppointmentHoldAvailability({
        ...baseInput,
        exceptions: [
          {
            localDate: "2026-06-29",
            localEndTime: "11:00",
            localStartTime: "09:30",
            practitionerId: "11111111-1111-4111-8111-111111111111",
            privateNote: null,
            reasonCode: "SYNTHETIC_BLOCK",
            status: "ACTIVE",
            type: "BLOCKED",
          },
        ],
      }),
    ).toThrow(SlotConflictError);
  });

  it("fails closed on ambiguous exception or slot-increment configuration", () => {
    expect(() =>
      assertAppointmentHoldAvailability({
        ...baseInput,
        rules: [
          ...baseInput.rules,
          { localEndTime: "16:00", localStartTime: "14:00", slotIncrementMinutes: 20 },
        ],
      }),
    ).toThrow(BookingResourceUnavailableError);
    expect(() =>
      assertAppointmentHoldAvailability({
        ...baseInput,
        exceptions: [
          {
            localDate: "2026-06-29",
            localEndTime: null,
            localStartTime: null,
            practitionerId: "11111111-1111-4111-8111-111111111111",
            privateNote: null,
            reasonCode: "SYNTHETIC_CLOSED_DAY",
            status: "ACTIVE",
            type: "CLOSED",
          },
          {
            localDate: "2026-06-29",
            localEndTime: "11:00",
            localStartTime: "10:00",
            practitionerId: "11111111-1111-4111-8111-111111111111",
            privateNote: null,
            reasonCode: "SYNTHETIC_BLOCK",
            status: "ACTIVE",
            type: "BLOCKED",
          },
        ],
      }),
    ).toThrow(BookingResourceUnavailableError);
  });

  it("enforces maximum advance and daily appointment limits", () => {
    expect(() =>
      assertAppointmentHoldAvailability({ ...baseInput, bookingMaxAdvanceDays: 0 }),
    ).not.toThrow();
    expect(() =>
      assertAppointmentHoldAvailability({
        ...baseInput,
        bookingMaxAdvanceDays: 0,
        startsAt: new Date("2026-06-30T07:00:00.000Z"),
      }),
    ).toThrow(SlotConflictError);
    expect(() =>
      assertAppointmentHoldAvailability({
        ...baseInput,
        reservedBookingsCount: 6,
      }),
    ).toThrow(SlotConflictError);
  });

  it("derives local dates, weekdays and UTC day bounds from the practitioner timezone", () => {
    expect(getZonedBookingDate(new Date("2026-06-28T22:30:00.000Z"), "Europe/Istanbul")).toEqual({
      localDate: "2026-06-29",
      weekday: 1,
    });
    expect(getZonedBookingDayRange("2026-03-29", "Europe/Berlin")).toEqual({
      endsAt: new Date("2026-03-29T22:00:00.000Z"),
      startsAt: new Date("2026-03-28T23:00:00.000Z"),
    });
  });
});
