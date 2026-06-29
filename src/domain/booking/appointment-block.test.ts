import { describe, expect, it } from "vitest";

import { calculateAppointmentBlock } from "./appointment-block";

describe("calculateAppointmentBlock", () => {
  it("supports custom durations and asymmetric buffers", () => {
    const block = calculateAppointmentBlock({
      bufferAfterMinutes: 3,
      bufferBeforeMinutes: 5,
      durationMinutes: 52,
      startsAt: new Date("2026-07-01T10:00:00.000Z"),
    });

    expect(block).toEqual({
      busyEndsAt: new Date("2026-07-01T10:55:00.000Z"),
      busyStartsAt: new Date("2026-07-01T09:55:00.000Z"),
      endsAt: new Date("2026-07-01T10:52:00.000Z"),
      startsAt: new Date("2026-07-01T10:00:00.000Z"),
    });
  });

  it("does not mutate the supplied start time", () => {
    const startsAt = new Date("2026-07-01T10:00:00.000Z");

    calculateAppointmentBlock({
      bufferAfterMinutes: 0,
      bufferBeforeMinutes: 0,
      durationMinutes: 45,
      startsAt,
    });

    expect(startsAt).toEqual(new Date("2026-07-01T10:00:00.000Z"));
  });

  it.each([0, -1, 52.5, 1_441])("rejects an invalid duration: %s", (durationMinutes) => {
    expect(() =>
      calculateAppointmentBlock({
        bufferAfterMinutes: 0,
        bufferBeforeMinutes: 0,
        durationMinutes,
        startsAt: new Date("2026-07-01T10:00:00.000Z"),
      }),
    ).toThrow(RangeError);
  });
});
