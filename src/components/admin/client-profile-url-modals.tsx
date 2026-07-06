import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getServerEnvironment } from "@/lib/env";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

import { AdminUrlModal, ModalFieldPreview } from "./admin-url-modal";
import modalStyles from "./admin-url-modal.module.css";

type Props = {
  activeModal: string;
  clientId: string;
  clientName: string;
  canReadAppointments: boolean;
  canReadFinance: boolean;
};

type NoteSummary = { category?: string; note?: string };

function textValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string, fallback: number): number {
  const value = Number(textValue(formData, key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function amountToMinor(value: string): bigint {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return 0n;
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

function readNoteSummary(value: unknown): NoteSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    category: typeof record.category === "string" ? record.category : undefined,
    note: typeof record.note === "string" ? record.note : undefined,
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function zonedDateToUtc(localDate: string, localTime: string, timeZone: string): Date {
  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const guess = new Date(targetUtc);
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(guess);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zonedUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second),
  );
  return new Date(targetUtc - (zonedUtc - guess.getTime()));
}

function referenceCode(): string {
  return `ADM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function saveClientNote(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:read");
  const clientId = textValue(formData, "clientId");
  const category = textValue(formData, "category") || "ADMIN";
  const note = textValue(formData, "note");
  if (!clientId || note.length < 3) return;

  const database = getDatabase();
  const client = await database.client.findUnique({ select: { id: true }, where: { id: clientId } });
  if (!client) return;

  await database.auditLog.create({
    data: {
      action: "CLIENT_NOTE_CREATED",
      actorType: "USER",
      actorUserId: session.user.id,
      afterSummary: { category, note },
      correlationId: crypto.randomUUID(),
      entityId: client.id,
      entityType: "CLIENT",
      reason: note.slice(0, 500),
    },
  });
  revalidatePath("/yonetim/danisan-profili");
  redirect(`/yonetim/danisan-profili?clientId=${client.id}`);
}

async function createProfileAppointment(formData: FormData) {
  "use server";
  const session = await requirePermission("appointments:manage");
  const clientId = textValue(formData, "clientId");
  const serviceId = textValue(formData, "serviceId");
  const practitionerId = textValue(formData, "practitionerId");
  const localDate = textValue(formData, "localDate");
  const localTime = textValue(formData, "localTime");
  const durationMinutes = numberValue(formData, "durationMinutes", 45);
  if (!clientId || !serviceId || !practitionerId || !localDate || !localTime) return;

  const database = getDatabase();
  const environment = getServerEnvironment();
  const startsAt = zonedDateToUtc(localDate, localTime, environment.BUSINESS_TIME_ZONE);
  const endsAt = addMinutes(startsAt, durationMinutes);

  await database.$transaction(async (transaction) => {
    const [client, service, practitioner] = await Promise.all([
      transaction.client.findUnique({
        select: { guardians: { orderBy: [{ isPrimary: "desc" }], select: { guardianId: true }, take: 1 }, id: true },
        where: { id: clientId },
      }),
      transaction.service.findUnique({
        select: {
          defaultBufferAfterMinutes: true,
          defaultBufferBeforeMinutes: true,
          defaultDurationMinutes: true,
          id: true,
          locationType: true,
          name: true,
        },
        where: { id: serviceId },
      }),
      transaction.practitioner.findUnique({ select: { id: true }, where: { id: practitionerId } }),
    ]);
    if (!client || !service || !practitioner) return;

    const busyStartsAt = addMinutes(startsAt, -service.defaultBufferBeforeMinutes);
    const busyEndsAt = addMinutes(endsAt, service.defaultBufferAfterMinutes);
    const conflict = await transaction.bookingAllocation.findFirst({
      select: { id: true },
      where: {
        busyEndsAt: { gt: busyStartsAt },
        busyStartsAt: { lt: busyEndsAt },
        practitionerId,
        status: "ACTIVE",
      },
    });
    if (conflict) return;

    const appointment = await transaction.appointment.create({
      data: {
        approvedAt: new Date(),
        approvedByUserId: session.user.id,
        busyEndsAt,
        busyStartsAt,
        clientId,
        durationMinutesSnapshot: durationMinutes,
        endsAt,
        guardianId: client.guardians[0]?.guardianId ?? null,
        locationTypeSnapshot: service.locationType,
        policySnapshot: { adminCreated: true },
        practitionerId,
        publicReference: referenceCode(),
        requestNote: textValue(formData, "requestNote") || null,
        serviceId,
        serviceNameSnapshot: service.name,
        source: "ADMIN",
        startsAt,
        status: "CONFIRMED",
      },
      select: { id: true },
    });

    await transaction.bookingAllocation.create({
      data: { appointmentId: appointment.id, busyEndsAt, busyStartsAt, practitionerId, status: "ACTIVE" },
    });
    await transaction.appointmentStatusLog.create({
      data: {
        actorType: "USER",
        actorUserId: session.user.id,
        appointmentId: appointment.id,
        note: "Created from client profile modal",
        reasonCode: "ADMIN_CREATED",
        toStatus: "CONFIRMED",
      },
    });
  });

  revalidatePath("/yonetim/danisan-profili");
  redirect(`/yonetim/danisan-profili?clientId=${clientId}`);
}

async function createProfilePlan(formData: FormData) {
  "use server";
  const session = await requirePermission("finance:manage");
  const clientId = textValue(formData, "clientId");
  const name = textValue(formData, "name") || "Ozel seans plani";
  const amountMinor = amountToMinor(textValue(formData, "amount"));
  const sessionCount = numberValue(formData, "sessionCount", 1);
  const durationMinutes = numberValue(formData, "sessionDurationMinutes", 45);
  const validFrom = textValue(formData, "validFrom");
  const dueDate = textValue(formData, "dueDate") || validFrom;
  if (!clientId || amountMinor <= 0n || !validFrom || !dueDate) return;

  const database = getDatabase();
  await database.$transaction(async (transaction) => {
    const client = await transaction.client.findUnique({ select: { id: true }, where: { id: clientId } });
    if (!client) return;

    const plan = await transaction.clientPlan.create({
      data: {
        clientId,
        createdByUserId: session.user.id,
        currency: "TRY",
        invoiceStatus: "NOT_REQUIRED",
        name,
        sessionCount,
        sessionDurationMinutes: durationMinutes,
        source: "CUSTOM",
        status: "ACTIVE",
        totalAmountMinor: amountMinor,
        validFrom: new Date(`${validFrom}T00:00:00.000Z`),
      },
      select: { id: true },
    });

    const installment = await transaction.planInstallment.create({
      data: {
        amountDueMinor: amountMinor,
        dueDate: new Date(`${dueDate}T00:00:00.000Z`),
        planId: plan.id,
        sequence: 1,
      },
      select: { id: true },
    });

    await transaction.financeLedgerEntry.create({
      data: {
        actorUserId: session.user.id,
        amountMinor,
        clientId,
        currency: "TRY",
        idempotencyKey: crypto.randomUUID(),
        installmentId: installment.id,
        note: "Plan accrual from client profile modal",
        occurredAt: new Date(),
        planId: plan.id,
        type: "ACCRUAL",
      },
    });
    await transaction.sessionCreditEntry.create({
      data: {
        actorUserId: session.user.id,
        idempotencyKey: crypto.randomUUID(),
        planId: plan.id,
        quantityDelta: sessionCount,
        reasonCode: "CLIENT_PROFILE_PLAN_CREATED",
        type: "GRANT",
      },
    });
  });

  revalidatePath("/yonetim/danisan-profili");
  redirect(`/yonetim/danisan-profili?clientId=${clientId}`);
}

export async function ClientProfileUrlModals({
  activeModal,
  clientId,
  clientName,
  canReadAppointments,
  canReadFinance,
}: Props) {
  const closeHref = ("/yonetim/danisan-profili?clientId=" + clientId) as Route;
  if (activeModal === "randevu-olustur" && !canReadAppointments) return null;
  if (activeModal === "odeme-plani" && !canReadFinance) return null;
  if (!["not-ekle", "randevu-olustur", "odeme-plani"].includes(activeModal)) return null;

  const database = getDatabase();
  const [services, practitioners, notes] = await Promise.all([
    activeModal === "randevu-olustur"
      ? database.service.findMany({
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { defaultDurationMinutes: true, id: true, name: true },
          where: { status: "ACTIVE" },
        })
      : Promise.resolve([]),
    activeModal === "randevu-olustur"
      ? database.practitioner.findMany({
          orderBy: [{ displayName: "asc" }],
          select: { displayName: true, id: true },
          where: { status: "ACTIVE" },
        })
      : Promise.resolve([]),
    activeModal === "not-ekle"
      ? database.auditLog.findMany({
          orderBy: [{ createdAt: "desc" }],
          select: { afterSummary: true, createdAt: true, id: true, reason: true },
          take: 5,
          where: { action: "CLIENT_NOTE_CREATED", entityId: clientId, entityType: "CLIENT" },
        })
      : Promise.resolve([]),
  ]);

  if (activeModal === "not-ekle") {
    return (
      <AdminUrlModal closeHref={closeHref} footer={<ModalFooter closeHref={closeHref} />} title="Not ekle">
        <form action={saveClientNote} className={modalStyles.modalStack}>
          <input name="clientId" type="hidden" value={clientId} />
          <ModalFieldPreview label="Danisan" value={clientName} helper="Not bu profile kalici olarak baglanir." />
          <div className="booking-subject-type">
            <label><input defaultChecked name="category" type="radio" value="ADMIN" /> Admin notu</label>
            <label><input name="category" type="radio" value="SESSION" /> Seans notu</label>
            <label><input name="category" type="radio" value="PAYMENT" /> Odeme notu</label>
          </div>
          <label className="booking-field">
            Not
            <textarea maxLength={500} minLength={3} name="note" required />
          </label>
          <button className={modalStyles.modalButton} type="submit">Notu kaydet</button>
        </form>
        {notes.length > 0 ? (
          <div className={modalStyles.modalStack}>
            {notes.map((note) => {
              const summary = readNoteSummary(note.afterSummary);
              return <ModalFieldPreview key={note.id} label={summary.category ?? "NOTE"} value={summary.note ?? note.reason ?? "Not"} helper={note.createdAt.toLocaleDateString("tr-TR")} />;
            })}
          </div>
        ) : null}
      </AdminUrlModal>
    );
  }

  if (activeModal === "randevu-olustur") {
    return (
      <AdminUrlModal closeHref={closeHref} footer={<ModalFooter closeHref={closeHref} />} title="Randevu olustur">
        <form action={createProfileAppointment} className={modalStyles.modalStack}>
          <input name="clientId" type="hidden" value={clientId} />
          <ModalFieldPreview label="Danisan" value={clientName} helper="Randevu bu profile baglanir." />
          <div className={modalStyles.modalGrid}>
            <label className="booking-field">Hizmet<select name="serviceId" required>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
            <label className="booking-field">Uzman<select name="practitionerId" required>{practitioners.map((practitioner) => <option key={practitioner.id} value={practitioner.id}>{practitioner.displayName}</option>)}</select></label>
            <label className="booking-field">Tarih<input name="localDate" required type="date" /></label>
            <label className="booking-field">Saat<input name="localTime" required type="time" /></label>
            <label className="booking-field">Sure<input defaultValue={services[0]?.defaultDurationMinutes ?? 45} min={15} name="durationMinutes" required type="number" /></label>
          </div>
          <label className="booking-field">Operasyon notu<textarea maxLength={500} name="requestNote" /></label>
          <button className={modalStyles.modalButton} type="submit">Randevuyu kaydet</button>
        </form>
      </AdminUrlModal>
    );
  }

  return (
    <AdminUrlModal closeHref={closeHref} footer={<ModalFooter closeHref={closeHref} />} title="Odeme plani">
      <form action={createProfilePlan} className={modalStyles.modalStack}>
        <input name="clientId" type="hidden" value={clientId} />
        <ModalFieldPreview label="Danisan" value={clientName} helper="Plan bu profile baglanir." />
        <div className={modalStyles.modalGrid}>
          <label className="booking-field">Plan adi<input defaultValue="Ozel seans plani" name="name" required /></label>
          <label className="booking-field">Seans sayisi<input defaultValue={8} min={1} name="sessionCount" required type="number" /></label>
          <label className="booking-field">Seans suresi<input defaultValue={45} min={15} name="sessionDurationMinutes" required type="number" /></label>
          <label className="booking-field">Toplam tutar<input inputMode="decimal" name="amount" placeholder="12000" required /></label>
          <label className="booking-field">Baslangic<input name="validFrom" required type="date" /></label>
          <label className="booking-field">Odeme tarihi<input name="dueDate" required type="date" /></label>
        </div>
        <button className={modalStyles.modalButton} type="submit">Plani kaydet</button>
      </form>
    </AdminUrlModal>
  );
}

function ModalFooter({ closeHref }: { closeHref: Route }) {
  return (
    <div className={modalStyles.footerActions}>
      <Link className={modalStyles.modalButtonSecondary} href={closeHref} scroll={false}>
        Kapat
      </Link>
    </div>
  );
}
