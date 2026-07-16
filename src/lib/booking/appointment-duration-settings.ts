import { z } from "zod";

import { getDatabase } from "@/lib/db";

export const appointmentDurationSettingsKey = "APPOINTMENT_DURATION_DEFAULTS";

export const appointmentDurationSettingsSchema = z.object({
  adultMinutes: z.number().int().min(5).max(240),
  childMinutes: z.number().int().min(5).max(240),
  firstMeetingMinutes: z.number().int().min(5).max(240),
});

export type AppointmentDurationSettings = z.infer<typeof appointmentDurationSettingsSchema>;

export const defaultAppointmentDurationSettings: AppointmentDurationSettings = Object.freeze({
  adultMinutes: 50,
  childMinutes: 45,
  firstMeetingMinutes: 60,
});

export async function getAppointmentDurationSettings(): Promise<AppointmentDurationSettings> {
  try {
    const setting = await getDatabase().operationalSetting.findUnique({
      select: { value: true },
      where: { key: appointmentDurationSettingsKey },
    });
    const parsed = appointmentDurationSettingsSchema.safeParse(setting?.value);
    return parsed.success ? parsed.data : defaultAppointmentDurationSettings;
  } catch {
    return defaultAppointmentDurationSettings;
  }
}
