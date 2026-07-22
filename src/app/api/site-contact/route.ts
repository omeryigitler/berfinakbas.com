import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import type { Prisma } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";
import { getPublicContactSettings } from "@/lib/public-contact-settings";

const settingKey = "PUBLIC_CONTACT_FAB_SETTINGS";
const channelIds = ["whatsapp", "instagram", "phone", "email"] as const;
const channelIdSchema = z.enum(channelIds);
const emptyOrHttpsUrl = z.union([
  z.literal(""),
  z.url().max(500).refine((value) => new URL(value).protocol === "https:", "HTTPS bağlantısı gereklidir."),
]);
const emptyOrEmail = z.union([z.literal(""), z.email().max(320)]);
const labelsSchema = z.object({
  whatsapp: z.string().trim().min(2).max(80),
  instagram: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(2).max(80),
  email: z.string().trim().min(2).max(80),
});
const enabledSchema = z.object({
  whatsapp: z.boolean(),
  instagram: z.boolean(),
  phone: z.boolean(),
  email: z.boolean(),
});
const orderSchema = z
  .array(channelIdSchema)
  .length(channelIds.length)
  .refine((value) => new Set(value).size === channelIds.length, "Her iletişim kanalı bir kez sıralanmalıdır.");

const settingsSchema = z.object({
  fabEnabled: z.boolean(),
  showOnMobile: z.boolean(),
  showOnDesktop: z.boolean(),
  whatsappUrl: emptyOrHttpsUrl,
  instagramUrl: emptyOrHttpsUrl,
  phone: z.string().trim().max(40),
  email: emptyOrEmail,
  labels: labelsSchema,
  enabled: enabledSchema,
  order: orderSchema,
});

const updateSchema = settingsSchema.extend({
  reason: z.string().trim().min(8).max(500).optional(),
});

type SiteContactSettings = z.infer<typeof settingsSchema>;

const baseDefaults: SiteContactSettings = {
  fabEnabled: true,
  showOnMobile: true,
  showOnDesktop: true,
  whatsappUrl: "",
  instagramUrl: "",
  phone: "",
  email: "",
  labels: {
    whatsapp: "WhatsApp ile bize ulaşın",
    instagram: "Instagram'da bizi takip edin",
    phone: "Telefonla bizi arayın",
    email: "E-posta gönderin",
  },
  enabled: {
    whatsapp: true,
    instagram: true,
    phone: true,
    email: true,
  },
  order: [...channelIds],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readSettings(): Promise<SiteContactSettings> {
  const database = getDatabase();
  const [contact, stored] = await Promise.all([
    getPublicContactSettings(),
    database.operationalSetting.findUnique({
      select: { value: true },
      where: { key: settingKey },
    }),
  ]);

  const defaults: SiteContactSettings = {
    ...baseDefaults,
    whatsappUrl: contact.whatsappUrl ?? "",
    phone: contact.phone ?? "",
    email: contact.email ?? "",
  };

  if (!isRecord(stored?.value)) return defaults;

  const raw = stored.value;
  const candidate = {
    ...defaults,
    ...raw,
    labels: {
      ...defaults.labels,
      ...(isRecord(raw.labels) ? raw.labels : {}),
    },
    enabled: {
      ...defaults.enabled,
      ...(isRecord(raw.enabled) ? raw.enabled : {}),
    },
  };
  const parsed = settingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaults;
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  if (!hasPermission(session.user.roles, "services:manage")) {
    return NextResponse.json({ error: "Bu ayarları değiştirme yetkiniz yok." }, { status: 403 });
  }

  let payload: z.infer<typeof updateSchema>;
  try {
    payload = updateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "İletişim ayarları geçerli değil." }, { status: 400 });
  }

  const { reason, ...settings } = payload;
  const database = getDatabase();

  await database.$transaction(async (transaction) => {
    const previous = await transaction.operationalSetting.findUnique({
      where: { key: settingKey },
    });

    await transaction.operationalSetting.upsert({
      create: {
        key: settingKey,
        updatedByUserId: session.user.id,
        value: settings as Prisma.InputJsonValue,
      },
      update: {
        updatedByUserId: session.user.id,
        value: settings as Prisma.InputJsonValue,
      },
      where: { key: settingKey },
    });

    await transaction.settingChangeLog.create({
      data: {
        actorUserId: session.user.id,
        entityId: settingKey,
        entityType: "OPERATIONAL_SETTING",
        newValue: settings as Prisma.InputJsonValue,
        oldValue: previous ? (previous.value as Prisma.InputJsonValue) : undefined,
        reason: reason ?? "İletişim ve sosyal medya ayarları yönetim panelinden güncellendi.",
        settingKey,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/iletisim");
  revalidatePath("/yonetim");

  return NextResponse.json(settings, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
