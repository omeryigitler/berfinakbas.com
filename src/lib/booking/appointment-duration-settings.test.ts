import { describe, expect, it } from "vitest";

import {
  appointmentDurationSettingsSchema,
  defaultAppointmentDurationSettings,
} from "./appointment-duration-settings";

describe("appointment duration settings", () => {
  it("accepts managed adult child and first-meeting durations", () => {
    expect(
      appointmentDurationSettingsSchema.parse({
        adultMinutes: 52,
        childMinutes: 45,
        firstMeetingMinutes: 30,
      }),
    ).toEqual({ adultMinutes: 52, childMinutes: 45, firstMeetingMinutes: 30 });
  });

  it("keeps safe defaults and rejects out-of-range values", () => {
    expect(defaultAppointmentDurationSettings).toEqual({
      adultMinutes: 50,
      childMinutes: 45,
      firstMeetingMinutes: 60,
    });
    expect(() =>
      appointmentDurationSettingsSchema.parse({
        adultMinutes: 0,
        childMinutes: 45,
        firstMeetingMinutes: 60,
      }),
    ).toThrow();
  });
});
