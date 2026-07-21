import { createHash } from "node:crypto";

import { getDatabase } from "../src/lib/db";
import { getServerEnvironment } from "../src/lib/env";

const EFFECTIVE_FROM = new Date("2026-01-01T00:00:00.000Z");

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

async function ensurePractitioner() {
  const database = getDatabase();
  const environment = getServerEnvironment();
  const configuredId = environment.BOOKING_PUBLIC_PRACTITIONER_ID;

  if (configuredId) {
    const existing = await database.practitioner.findUnique({ where: { id: configuredId } });
    if (existing) {
      return database.practitioner.update({
        data: { status: "ACTIVE" },
        where: { id: configuredId },
      });
    }
  }

  const existingActive = await database.practitioner.findFirst({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    where: { status: "ACTIVE" },
  });
  if (existingActive) return existingActive;

  const user = await database.user.upsert({
    create: {
      email: "booking-test@berfinakbas.local",
      name: "Berfin Akbaş",
      status: "ACTIVE",
    },
    update: { name: "Berfin Akbaş", status: "ACTIVE" },
    where: { email: "booking-test@berfinakbas.local" },
  });

  return database.practitioner.create({
    data: {
      ...(configuredId ? { id: configuredId } : {}),
      displayName: "Berfin Akbaş",
      status: "ACTIVE",
      timeZone: environment.BUSINESS_TIME_ZONE,
      userId: user.id,
    },
  });
}

async function ensureService() {
  const database = getDatabase();
  const service = await database.service.upsert({
    create: {
      approvalMode: "MANUAL",
      defaultBufferAfterMinutes: 10,
      defaultBufferBeforeMinutes: 5,
      defaultDurationMinutes: 15,
      locationType: "HYBRID",
      name: "İlk görüşme",
      publicDescription: "15 dakikalık ilk tanışma ve ihtiyaç değerlendirme görüşmesi.",
      publicVisible: true,
      slug: "ilk-gorusme",
      sortOrder: 0,
      status: "ACTIVE",
    },
    update: {
      approvalMode: "MANUAL",
      defaultBufferAfterMinutes: 10,
      defaultBufferBeforeMinutes: 5,
      defaultDurationMinutes: 15,
      locationType: "HYBRID",
      name: "İlk görüşme",
      publicDescription: "15 dakikalık ilk tanışma ve ihtiyaç değerlendirme görüşmesi.",
      publicVisible: true,
      sortOrder: 0,
      status: "ACTIVE",
    },
    where: { slug: "ilk-gorusme" },
  });

  await database.servicePolicy.upsert({
    create: {
      bookingMaxAdvanceDays: 60,
      bookingMinNoticeMinutes: 60,
      cancellationWindowMinutes: 1_440,
      effectiveFrom: EFFECTIVE_FROM,
      maxDailyAppointments: 12,
      rescheduleWindowMinutes: 1_440,
      serviceId: service.id,
    },
    update: {
      bookingMaxAdvanceDays: 60,
      bookingMinNoticeMinutes: 60,
      cancellationWindowMinutes: 1_440,
      maxDailyAppointments: 12,
      rescheduleWindowMinutes: 1_440,
    },
    where: {
      serviceId_effectiveFrom: {
        effectiveFrom: EFFECTIVE_FROM,
        serviceId: service.id,
      },
    },
  });

  return service;
}

async function ensureConsentDocuments() {
  const database = getDatabase();
  const documents = [
    {
      content:
        "Randevu talebi sırasında paylaştığınız iletişim bilgileri yalnızca talebin değerlendirilmesi ve sizinle iletişim kurulması amacıyla işlenir.",
      title: "Aydınlatma metni",
      type: "PRIVACY_NOTICE",
    },
    {
      content:
        "Bu form bir randevu talebi oluşturur. Randevu, uzman tarafından incelenip onaylandıktan sonra kesinleşir.",
      title: "Randevu talep koşulları",
      type: "BOOKING_TERMS",
    },
  ] as const;

  for (const document of documents) {
    await database.consentDocument.upsert({
      create: {
        contentHash: hashContent(document.content),
        effectiveFrom: EFFECTIVE_FROM,
        publicContent: document.content,
        publicTitle: document.title,
        type: document.type,
        version: "test-v1",
      },
      update: {
        contentHash: hashContent(document.content),
        publicContent: document.content,
        publicTitle: document.title,
        retiredAt: null,
      },
      where: {
        type_version: {
          type: document.type,
          version: "test-v1",
        },
      },
    });
  }
}

async function ensureAvailability(practitionerId: string) {
  const database = getDatabase();
  const activeRuleCount = await database.availabilityRule.count({
    where: { practitionerId, status: "ACTIVE" },
  });
  if (activeRuleCount > 0) return;

  await database.availabilityRule.createMany({
    data: [1, 2, 3, 4, 5].map((weekday) => ({
      localEndTime: "17:00",
      localStartTime: "09:00",
      practitionerId,
      slotIncrementMinutes: 15,
      status: "ACTIVE" as const,
      weekday,
    })),
  });
}

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Booking test verisi yalnız production deploy sırasında etkinleştirilir.");
    return;
  }

  const database = getDatabase();
  try {
    const practitioner = await ensurePractitioner();
    const service = await ensureService();
    await ensureConsentDocuments();
    await ensureAvailability(practitioner.id);

    console.log(
      `Randevu test verisi etkin: practitioner=${practitioner.id} service=${service.id}`,
    );
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Randevu test verisi etkinleştirilemedi.", error);
  process.exitCode = 1;
});
