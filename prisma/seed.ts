import { getDatabase } from "../src/lib/db";
import { getServerEnvironment } from "../src/lib/env";

const roleDefinitions = [
  ["SUPER_ADMIN", "Süper yönetici", "Tüm yönetim izinleri"],
  ["THERAPIST", "Terapist", "Randevu ve danışan operasyonları"],
  ["ASSISTANT", "Asistan", "Sınırlı randevu ve danışan operasyonları"],
  ["FINANCE", "Finans", "Ödeme ve finans operasyonları"],
  ["DEVELOPER", "Geliştirici", "Kişisel veri içermeyen teknik sağlık görünümü"],
] as const;

async function seed() {
  const database = getDatabase();
  const environment = getServerEnvironment();

  for (const [key, name, description] of roleDefinitions) {
    await database.role.upsert({
      create: { description, key, name },
      update: { description, name },
      where: { key },
    });
  }

  await database.service.upsert({
    create: {
      approvalMode: "MANUAL",
      defaultBufferAfterMinutes: 10,
      defaultBufferBeforeMinutes: 5,
      defaultDurationMinutes: 50,
      locationType: "HYBRID",
      name: "Örnek değerlendirme görüşmesi",
      policies: {
        create: {
          bookingMaxAdvanceDays: 60,
          bookingMinNoticeMinutes: 1_440,
          cancellationWindowMinutes: 1_440,
          effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
          maxDailyAppointments: 6,
          rescheduleWindowMinutes: 2_880,
        },
      },
      publicDescription: null,
      publicVisible: false,
      slug: "ornek-degerlendirme-gorusmesi",
      status: "DRAFT",
    },
    update: {},
    where: { slug: "ornek-degerlendirme-gorusmesi" },
  });

  const bootstrapEmail = environment.AUTH_BOOTSTRAP_ADMIN_EMAIL?.toLocaleLowerCase("tr-TR");
  if (bootstrapEmail) {
    const user = await database.user.upsert({
      create: { email: bootstrapEmail, status: "INVITED" },
      update: {},
      where: { email: bootstrapEmail },
    });
    const role = await database.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });

    await database.userRole.upsert({
      create: { roleId: role.id, userId: user.id },
      update: {},
      where: { userId_roleId: { roleId: role.id, userId: user.id } },
    });
  }

  await database.$disconnect();
}

seed().catch((error: unknown) => {
  console.error("Sentetik başlangıç verisi oluşturulamadı.", error);
  process.exitCode = 1;
});
