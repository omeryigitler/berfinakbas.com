import { getDatabase } from "@/lib/db";
import type { ActiveSession } from "./management-hub-common";

const uuid = (group: number, index: number) => `${group}0000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const ids = {
  clients: Array.from({ length: 5 }, (_, index) => uuid(1, index + 1)),
  guardian: uuid(2, 1),
  plans: Array.from({ length: 4 }, (_, index) => uuid(3, index + 1)),
  installments: Array.from({ length: 4 }, (_, index) => uuid(4, index + 1)),
  appointments: Array.from({ length: 5 }, (_, index) => uuid(5, index + 1)),
} as const;
const legacyServiceSlug = "ornek-degerlendirme-gorusmesi";

function dateAt(dayOffset: number, hour = 10) {
  const value = new Date();
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hour, 0, 0, 0);
  return value;
}

export async function readDemoDataState() {
  const count = await getDatabase().client.count({ where: { id: { in: [...ids.clients] } } });
  return { complete: count === ids.clients.length, count };
}

export async function seedDemoData(session: ActiveSession, correlationId: string) {
  const database = getDatabase();
  const state = await readDemoDataState();
  if (state.count) throw new Error("Örnek veri zaten mevcut. Önce örnek veriyi kaldırın.");

  const [practitioner, service] = await Promise.all([
    database.practitioner.findFirst({ orderBy: { createdAt: "asc" }, where: { status: "ACTIVE" } }),
    database.service.findFirst({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      where: { slug: { not: legacyServiceSlug }, status: "ACTIVE" },
    }),
  ]);
  if (!practitioner || !service) {
    throw new Error("Örnek veri için Berfin Akbaş’a bağlı aktif terapist ve en az bir gerçek aktif hizmet gereklidir.");
  }

  await database.$transaction(async (tx) => {
    const clients = [
      ["Ayşe", "Kaya", "PROSPECTIVE", "ADULT", 1992, "ornek.ayse@berfinakbas.test", "+90 555 000 1001"],
      ["Mehmet", "Demir", "ACTIVE", "ADULT", 1988, "ornek.mehmet@berfinakbas.test", "+90 555 000 1002"],
      ["Elif", "Yılmaz", "ACTIVE", "ADULT", 1996, "ornek.elif@berfinakbas.test", "+90 555 000 1003"],
      ["Can", "Arslan", "ACTIVE", "ADULT", 1985, "ornek.can@berfinakbas.test", "+90 555 000 1004"],
      ["Deniz", "Çelik", "ACTIVE", "CHILD", 2017, null, null],
    ] as const;
    for (let index = 0; index < clients.length; index += 1) {
      const [firstName, lastName, status, type, birthYear, email, phone] = clients[index];
      await tx.client.create({ data: { id: ids.clients[index], firstName, lastName, status, type, birthYear, email, phone } });
    }

    await tx.guardian.create({ data: { id: ids.guardian, firstName: "Zeynep", lastName: "Çelik", phone: "+90 555 000 2001", email: "ornek.veli@berfinakbas.test" } });
    await tx.clientGuardian.create({ data: { clientId: ids.clients[4], guardianId: ids.guardian, isPrimary: true, relationship: "Anne" } });

    const plans = [
      [1, "8 Seans Başlangıç", "ACTIVE", 8, 0, 800_000n, 800_000n],
      [2, "8 Seans Devam", "ACTIVE", 8, 3, 800_000n, 800_000n],
      [3, "8 Seans Yoğun", "ACTIVE", 8, 7, 800_000n, 300_000n],
      [4, "Çocuk Değerlendirme Planı", "COMPLETED", 4, 4, 400_000n, 400_000n],
    ] as const;
    for (let index = 0; index < plans.length; index += 1) {
      const [clientIndex, name, status, sessionCount, used, total, paid] = plans[index];
      const planId = ids.plans[index];
      const clientId = ids.clients[clientIndex];
      await tx.clientPlan.create({ data: { id: planId, clientId, name, status, source: "CUSTOM", sessionCount, sessionDurationMinutes: 45, totalAmountMinor: total, currency: "TRY", validFrom: dateAt(-30), validUntil: dateAt(120), createdByUserId: session.user.id } });
      await tx.planInstallment.create({ data: { id: ids.installments[index], planId, sequence: 1, amountDueMinor: total, dueDate: index === 2 ? dateAt(-10) : dateAt(30) } });
      await tx.financeLedgerEntry.create({ data: { idempotencyKey: `demo-accrual-${planId}`, clientId, planId, installmentId: ids.installments[index], type: "ACCRUAL", amountMinor: total, currency: "TRY", occurredAt: dateAt(-25), note: "Kontrollü örnek veri", actorUserId: session.user.id } });
      await tx.financeLedgerEntry.create({ data: { idempotencyKey: `demo-payment-${planId}`, clientId, planId, installmentId: ids.installments[index], type: "PAYMENT", amountMinor: -paid, currency: "TRY", occurredAt: dateAt(-20), note: "Kontrollü örnek ödeme", actorUserId: session.user.id } });
      await tx.sessionCreditEntry.create({ data: { idempotencyKey: `demo-grant-${planId}`, planId, type: "GRANT", quantityDelta: sessionCount, reasonCode: "DEMO_GRANT", actorUserId: session.user.id } });
      if (used) await tx.sessionCreditEntry.create({ data: { idempotencyKey: `demo-use-${planId}`, planId, type: "CONSUME", quantityDelta: -used, reasonCode: "DEMO_USE", actorUserId: session.user.id } });
    }

    const appointments = [
      [0, 0, 9, "REQUESTED", null],
      [1, 0, 11, "CONFIRMED", null],
      [2, -1, 13, "COMPLETED", null],
      [3, -2, 15, "NO_SHOW", null],
      [4, -10, 10, "COMPLETED", ids.guardian],
    ] as const;
    for (let index = 0; index < appointments.length; index += 1) {
      const [clientIndex, dayOffset, hour, status, guardianId] = appointments[index];
      const startsAt = dateAt(dayOffset, hour);
      const endsAt = new Date(startsAt.getTime() + 45 * 60_000);
      const approved = status !== "REQUESTED";
      await tx.appointment.create({ data: { id: ids.appointments[index], publicReference: `ORN-${index + 1}-2026`, clientId: ids.clients[clientIndex], guardianId, practitionerId: practitioner.id, serviceId: service.id, status, startsAt, endsAt, busyStartsAt: startsAt, busyEndsAt: endsAt, serviceNameSnapshot: service.name, durationMinutesSnapshot: 45, bufferBeforeMinutesSnapshot: 0, bufferAfterMinutesSnapshot: 0, locationTypeSnapshot: service.locationType, policySnapshot: { controlledDemo: true }, requestNote: "Kontrollü örnek randevu", source: "ADMIN", approvedAt: approved ? startsAt : null, approvedByUserId: approved ? session.user.id : null } });
    }

    await tx.auditLog.create({ data: { action: "demo.data.seeded", actorType: "USER", actorUserId: session.user.id, afterSummary: { clients: ids.clients.length }, correlationId, entityId: "ORNEK-VERI", entityType: "DEMO_DATA", reason: "CONTROLLED_DEMO_DATA" } });
  });
  return readDemoDataState();
}

export async function cleanDemoData(session: ActiveSession, correlationId: string) {
  const database = getDatabase();
  await database.$transaction(async (tx) => {
    await tx.appointmentConsent.deleteMany({ where: { appointmentId: { in: [...ids.appointments] } } });
    await tx.bookingAllocation.deleteMany({ where: { appointmentId: { in: [...ids.appointments] } } });
    await tx.appointmentStatusLog.deleteMany({ where: { appointmentId: { in: [...ids.appointments] } } });
    await tx.sessionCreditEntry.deleteMany({ where: { planId: { in: [...ids.plans] } } });
    await tx.financeLedgerEntry.deleteMany({ where: { OR: [{ appointmentId: { in: [...ids.appointments] } }, { clientId: { in: [...ids.clients] } }, { planId: { in: [...ids.plans] } }] } });
    await tx.planInstallment.deleteMany({ where: { planId: { in: [...ids.plans] } } });
    await tx.clientPlan.deleteMany({ where: { id: { in: [...ids.plans] } } });
    await tx.appointment.deleteMany({ where: { id: { in: [...ids.appointments] } } });
    await tx.clientGuardian.deleteMany({ where: { clientId: { in: [...ids.clients] } } });
    await tx.guardian.deleteMany({ where: { id: ids.guardian } });
    await tx.client.deleteMany({ where: { id: { in: [...ids.clients] } } });
    await tx.auditLog.create({ data: { action: "demo.data.cleaned", actorType: "USER", actorUserId: session.user.id, afterSummary: { clients: 0 }, correlationId, entityId: "ORNEK-VERI", entityType: "DEMO_DATA", reason: "CONTROLLED_DEMO_DATA_REMOVAL" } });
  });
  return readDemoDataState();
}
