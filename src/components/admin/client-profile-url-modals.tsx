import type { Route } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

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

function readNoteSummary(value: unknown): NoteSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    category: typeof record.category === "string" ? record.category : undefined,
    note: typeof record.note === "string" ? record.note : undefined,
  };
}

async function saveClientNote(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:read");
  const clientId = textValue(formData, "clientId");
  const category = textValue(formData, "category") || "ADMIN";
  const note = textValue(formData, "note");
  if (!clientId || note.length < 3) return;

  const database = getDatabase();
  const client = await database.client.findUnique({
    select: { id: true },
    where: { id: clientId },
  });
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

export async function ClientProfileUrlModals({
  activeModal,
  clientId,
  clientName,
  canReadAppointments,
  canReadFinance,
}: Props) {
  const closeHref = (`/yonetim/danisan-profili?clientId=${clientId}`) as Route;
  if (activeModal === "randevu-olustur" && !canReadAppointments) return null;
  if (activeModal === "odeme-plani" && !canReadFinance) return null;
  if (!["not-ekle", "randevu-olustur", "odeme-plani"].includes(activeModal)) {
    return null;
  }

  if (activeModal === "not-ekle") {
    const notes = await getDatabase().auditLog.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: { afterSummary: true, createdAt: true, id: true, reason: true },
      take: 5,
      where: { action: "CLIENT_NOTE_CREATED", entityId: clientId, entityType: "CLIENT" },
    });

    return (
      <AdminUrlModal
        closeHref={closeHref}
        footer={<ModalFooter closeHref={closeHref} />}
        title="Not ekle"
      >
        <form action={saveClientNote} className={modalStyles.modalStack}>
          <input name="clientId" type="hidden" value={clientId} />
          <ModalFieldPreview
            helper="Not bu profile kalici olarak baglanir."
            label="Danisan"
            value={clientName}
          />
          <div className="booking-subject-type">
            <label>
              <input defaultChecked name="category" type="radio" value="ADMIN" /> Admin notu
            </label>
            <label>
              <input name="category" type="radio" value="SESSION" /> Seans notu
            </label>
            <label>
              <input name="category" type="radio" value="PAYMENT" /> Odeme notu
            </label>
          </div>
          <label className="booking-field">
            Not
            <textarea maxLength={500} minLength={3} name="note" required />
          </label>
          <button className={modalStyles.modalButton} type="submit">
            Notu kaydet
          </button>
        </form>

        {notes.length > 0 ? (
          <div className={modalStyles.modalStack}>
            {notes.map((note) => {
              const summary = readNoteSummary(note.afterSummary);
              return (
                <ModalFieldPreview
                  helper={note.createdAt.toLocaleDateString("tr-TR")}
                  key={note.id}
                  label={summary.category ?? "NOTE"}
                  value={summary.note ?? note.reason ?? "Not"}
                />
              );
            })}
          </div>
        ) : null}
      </AdminUrlModal>
    );
  }

  if (activeModal === "randevu-olustur") {
    const appointmentHref =
      (`/yonetim/randevular?clientId=${clientId}&modal=randevu-olustur`) as Route;

    return (
      <AdminUrlModal
        closeHref={closeHref}
        footer={
          <ModalLinkFooter
            closeHref={closeHref}
            primaryHref={appointmentHref}
            primaryLabel="Randevu ekranina gec"
          />
        }
        title="Randevu olustur"
      >
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview
            helper="Randevu olusturma motoru ayri PR ile baglanacak."
            label="Danisan"
            value={clientName}
          />
          <ModalFieldPreview
            helper="Bu PR sadece URL modal ve client context tasir."
            label="Baglanti"
            value="Takvim ekranina yonlendirme"
          />
        </div>
      </AdminUrlModal>
    );
  }

  const financeHref = (`/yonetim/odemeler?clientId=${clientId}`) as Route;

  return (
    <AdminUrlModal
      closeHref={closeHref}
      footer={
        <ModalLinkFooter
          closeHref={closeHref}
          primaryHref={financeHref}
          primaryLabel="Odeme ekranina gec"
        />
      }
      title="Odeme plani"
    >
      <div className={modalStyles.modalGrid}>
        <ModalFieldPreview
          helper="Finans motoru mevcut odeme ekraninda calisir."
          label="Danisan"
          value={clientName}
        />
        <ModalFieldPreview
          helper="Plan olusturma islemi ayri PR ile modal icine alinacak."
          label="Baglanti"
          value="Odeme ekranina yonlendirme"
        />
      </div>
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

function ModalLinkFooter({
  closeHref,
  primaryHref,
  primaryLabel,
}: {
  closeHref: Route;
  primaryHref: Route;
  primaryLabel: string;
}) {
  return (
    <div className={modalStyles.footerActions}>
      <Link className={modalStyles.modalButtonSecondary} href={closeHref} scroll={false}>
        Kapat
      </Link>
      <Link className={modalStyles.modalButton} href={primaryHref} scroll={false}>
        {primaryLabel}
      </Link>
    </div>
  );
}
