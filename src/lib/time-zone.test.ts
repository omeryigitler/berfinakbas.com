import { describe, expect, it } from "vitest";

import { formatDateTimeInputInZone, resolveZonedDateTime } from "./time-zone";

describe("resolveZonedDateTime", () => {
  it("keeps the practitioner local clock when converting to UTC", () => {
    const result = resolveZonedDateTime({
      date: "2026-07-20",
      time: "10:00",
      timeZone: "Europe/Istanbul",
    });

    expect(result).toEqual({ date: new Date("2026-07-20T07:00:00.000Z"), ok: true });
  });

  it("formats an instant as local date and time for the selected zone", () => {
    expect(
      formatDateTimeInputInZone(new Date("2026-07-20T07:15:00.000Z"), "Europe/Istanbul"),
    ).toEqual({ date: "2026-07-20", time: "10:15" });
  });

  it("rejects a local clock value that does not exist during the DST jump", () => {
    expect(
      resolveZonedDateTime({
        date: "2026-03-08",
        time: "02:30",
        timeZone: "America/New_York",
      }),
    ).toEqual({ ok: false, reason: "NONEXISTENT" });
  });

  it("rejects an ambiguous local clock value during the DST fallback", () => {
    expect(
      resolveZonedDateTime({
        date: "2026-11-01",
        time: "01:30",
        timeZone: "America/New_York",
      }),
    ).toEqual({ ok: false, reason: "AMBIGUOUS" });
  });

  it("rejects invalid date, time and time-zone values", () => {
    expect(
      resolveZonedDateTime({ date: "2026-02-30", time: "10:00", timeZone: "Europe/Istanbul" }),
    ).toEqual({ ok: false, reason: "INVALID" });
    expect(
      resolveZonedDateTime({ date: "2026-07-20", time: "25:00", timeZone: "Europe/Istanbul" }),
    ).toEqual({ ok: false, reason: "INVALID" });
    expect(
      resolveZonedDateTime({ date: "2026-07-20", time: "10:00", timeZone: "Invalid/Zone" }),
    ).toEqual({ ok: false, reason: "INVALID" });
  });
});
