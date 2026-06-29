import { describe, expect, it } from "vitest";

import { generateDailySlots, zonedDateTimeToUtc } from "./slot-generator";

const baseInput = {
  bufferAfterMinutes: 8,
  bufferBeforeMinutes: 5,
  durationMinutes: 52,
  localDate: "2026-06-29",
  now: new Date("2026-06-28T00:00:00.000Z"),
  slotIncrementMinutes: 15,
  timeZone: "Europe/Istanbul",
  windows: [{ endTime: "12:00", startTime: "09:00" }],
};

describe("zonedDateTimeToUtc", () => {
  it("converts Istanbul local time to UTC", () => {
    expect(zonedDateTimeToUtc("2026-06-29", "09:15", "Europe/Istanbul").toISOString()).toBe(
      "2026-06-29T06:15:00.000Z",
    );
  });

  it("rejects a nonexistent daylight-saving time", () => {
    expect(() => zonedDateTimeToUtc("2026-03-29", "02:30", "Europe/Berlin")).toThrow(
      "mevcut değildir",
    );
  });
});

describe("generateDailySlots", () => {
  it("supports custom duration, buffers and slot increments", () => {
    const slots = generateDailySlots(baseInput);

    expect(slots).toHaveLength(8);
    expect(slots[0]?.startsAt.toISOString()).toBe("2026-06-29T06:15:00.000Z");
    expect(slots.at(-1)?.startsAt.toISOString()).toBe("2026-06-29T08:00:00.000Z");
    expect(slots[0]?.blockStartsAt.toISOString()).toBe("2026-06-29T06:10:00.000Z");
    expect(slots[0]?.blockEndsAt.toISOString()).toBe("2026-06-29T07:15:00.000Z");
  });

  it("removes slots whose buffered block overlaps a busy interval", () => {
    const slots = generateDailySlots({
      ...baseInput,
      busyBlocks: [
        {
          endsAt: new Date("2026-06-29T08:00:00.000Z"),
          startsAt: new Date("2026-06-29T07:30:00.000Z"),
        },
      ],
    });

    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      "2026-06-29T06:15:00.000Z",
      "2026-06-29T06:30:00.000Z",
    ]);
  });

  it("respects minimum notice", () => {
    const slots = generateDailySlots({
      ...baseInput,
      minNoticeMinutes: 30,
      now: new Date("2026-06-29T06:10:00.000Z"),
    });

    expect(slots[0]?.startsAt.toISOString()).toBe("2026-06-29T06:45:00.000Z");
  });

  it("returns no slot when daily capacity is full", () => {
    expect(
      generateDailySlots({
        ...baseInput,
        existingAppointmentsCount: 6,
        maxDailyAppointments: 6,
      }),
    ).toEqual([]);
  });

  it("deduplicates starts from overlapping availability windows", () => {
    const slots = generateDailySlots({
      ...baseInput,
      bufferAfterMinutes: 0,
      bufferBeforeMinutes: 0,
      durationMinutes: 30,
      windows: [
        { endTime: "11:00", startTime: "09:00" },
        { endTime: "12:00", startTime: "10:00" },
      ],
    });

    expect(new Set(slots.map((slot) => slot.startsAt.toISOString())).size).toBe(slots.length);
  });
});
