import { z } from "zod";

import { getDatabase } from "@/lib/db";

export const publicContactSettingsKey = "PUBLIC_CONTACT_DETAILS";

const nullableContactValue = z.string().trim().max(320).nullable();
export const publicContactSettingsSchema = z.object({
  address: z.string().trim().min(2).max(300),
  email: nullableContactValue,
  mapsUrl: nullableContactValue,
  phone: z.string().trim().max(40).nullable(),
  whatsappUrl: nullableContactValue,
});

export type PublicContactSettings = z.infer<typeof publicContactSettingsSchema>;

export const defaultPublicContactSettings: PublicContactSettings = Object.freeze({
  address: "Küçükçekmece, İstanbul",
  email: null,
  mapsUrl: null,
  phone: null,
  whatsappUrl: null,
});

export async function getPublicContactSettings(): Promise<PublicContactSettings> {
  const setting = await getDatabase().operationalSetting.findUnique({
    select: { value: true },
    where: { key: publicContactSettingsKey },
  });
  const parsed = publicContactSettingsSchema.safeParse(setting?.value);
  return parsed.success ? parsed.data : defaultPublicContactSettings;
}
