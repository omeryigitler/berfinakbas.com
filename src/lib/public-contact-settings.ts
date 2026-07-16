import { z } from "zod";

import { getDatabase } from "@/lib/db";

export const publicContactSettingsKey = "PUBLIC_CONTACT_DETAILS";

const nullableEmail = z.union([z.email().max(320), z.null()]);
const nullableUrl = z.union([z.url().max(500), z.null()]);
export const publicContactSettingsSchema = z.object({
  address: z.string().trim().min(2).max(300),
  email: nullableEmail,
  mapsUrl: nullableUrl,
  phone: z.union([z.string().trim().min(7).max(40), z.null()]),
  whatsappUrl: nullableUrl,
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
