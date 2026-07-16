import type { Route } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/domain/auth/permissions";
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

function textValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

async function saveClientNote(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:manage");
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

  if (!["ADMIN", "PAYMENT"].includes(category)) return;
  await database.$transaction(async (transaction) => {
    const created = await transaction.clientNote.create({
      data: { category, clientId: client.id, createdByUserId: session.user.id, note },
    });
    await transaction.auditLog.create({ data: {
      action: "client_note.created", actorType: "USER", actorUserId: session.user.id,
      afterSummary: { category }, correlationId: crypto.randomUUID(), entityId: created.id,
      entityType: "CLIENT_NOTE", reason: "Operasyon notu oluşturuldu.",
    } });
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
  const closeHref = `/yonetim/danisan-profili?clientId=${clientId}` as Route;
  if (activeModal === "randevu-olustur" && !canReadAppointments) return null;
  if (activeModal === "odeme-plani" && !canReadFinance) return null;
  if (!["not-ekle", "randevu-olustur", "odeme-plani"].includes(activeModal)) {
    return null;
  }

  if (activeModal === "not-ekle") {
    const session = await requirePermission("clients:read");
    if (!hasPermission(session.user.roles, "clients:manage")) return null;

    const notes = await getDatabase().clientNote.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: { category: true, createdAt: true, id: true, note: true },
      take: 5,
      where: { clientId },
    });

    return (
      <AdminUrlModal
        closeHref={closeHref}
        footer={<ModalFooter closeHref={closeHref} />}
        title="Not ekle"
      >
        <form action={saveClientNote} className={`${modalStyles.modalStack} admin-note-form`}>
          <input name="clientId" type="hidden" value={clientId} />
          <ModalFieldPreview
            helper="Not bu profile kalıcı olarak bağlanır. Klinik değerlendirme detayı yerine operasyon takibi için kullanın."
            label="Danışan"
            value={clientName}
          />
          <div className="booking-subject-type">
            <label>
              <input
                defaultChecked
                name="category"
                type="radio"
                value="ADMIN"
              />
              <span>Admin notu</span>
            </label>
            <label>
              <input name="category" type="radio" value="PAYMENT" />
              <span>Ödeme notu</span>
            </label>
          </div>
          <label className="booking-field">
            Not
            <textarea
              className="admin-url-modal-large-textarea"
              maxLength={500}
              minLength={3}
              name="note"
              placeholder="Bu danışanla ilgili operasyon notunu buraya yazın."
              required
            />
            <small>En fazla 500 karakter. Kaydedildikten sonra profil geçmişinde görünür.</small>
          </label>
          <button className={modalStyles.modalButton} type="submit">
            Notu kaydet
          </button>
        </form>

        {notes.length > 0 ? (
          <div className={modalStyles.modalStack}>
            {notes.map((note) => {
              return (
                <ModalFieldPreview
                  helper={note.createdAt.toLocaleDateString("tr-TR")}
                  key={note.id}
                  label={note.category === "PAYMENT" ? "Ödeme notu" : "Admin notu"}
                  value={note.note}
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
      `/yonetim/randevular?clientId=${clientId}&modal=randevu-olustur` as Route;

    return (
      <AdminUrlModal
        closeHref={closeHref}
        footer={
          <ModalLinkFooter
            closeHref={closeHref}
            primaryHref={appointmentHref}
            primaryLabel="Randevu ekranına geç"
          />
        }
        title="Randevu oluştur"
      >
        <div className={modalStyles.modalGrid}>
          <ModalFieldPreview
            helper="Randevu oluşturma ekranı seçili danışanla açılır."
            label="Danışan"
            value={clientName}
          />
          <ModalFieldPreview
            helper="Takvim ve çakışma kontrolü randevu ekranında çalışır."
            label="Bağlantı"
            value="Takvim ekranına yönlendirme"
          />
        </div>
      </AdminUrlModal>
    );
  }

  const financeHref = `/yonetim/odemeler?clientId=${clientId}` as Route;

  return (
    <AdminUrlModal
      closeHref={closeHref}
      footer={
        <ModalLinkFooter
          closeHref={closeHref}
          primaryHref={financeHref}
          primaryLabel="Ödeme ekranına geç"
        />
      }
      title="Ödeme planı"
    >
      <div className={modalStyles.modalGrid}>
        <ModalFieldPreview
          helper="Finans motoru seçili danışan filtresiyle ödeme ekranında çalışır."
          label="Danışan"
          value={clientName}
        />
        <ModalFieldPreview
          helper="Plan ve ödeme işlemleri tam sayfa akışta daha rahat yapılır."
          label="Bağlantı"
          value="Ödeme ekranına yönlendirme"
        />
      </div>
    </AdminUrlModal>
  );
}

function ModalFooter({ closeHref }: { closeHref: Route }) {
  return (
    <div className={modalStyles.footerActions}>
      <Link
        className={modalStyles.modalButtonSecondary}
        href={closeHref}
        scroll={false}
      >
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
      <Link
        className={modalStyles.modalButtonSecondary}
        href={closeHref}
        scroll={false}
      >
        Kapat
      </Link>
      <Link
        className={modalStyles.modalButton}
        href={primaryHref}
        scroll={false}
      >
        {primaryLabel}
      </Link>
    </div>
  );
}
