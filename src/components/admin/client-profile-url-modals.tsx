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
  if (!client || !["ADMIN", "PAYMENT"].includes(category)) return;

  await database.$transaction(async (transaction) => {
    const created = await transaction.clientNote.create({
      data: {
        category,
        clientId: client.id,
        createdByUserId: session.user.id,
        note,
      },
    });
    await transaction.auditLog.create({
      data: {
        action: "client_note.created",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { category },
        correlationId: crypto.randomUUID(),
        entityId: created.id,
        entityType: "CLIENT_NOTE",
        reason: "Operasyon notu oluşturuldu.",
      },
    });
  });

  revalidatePath("/yonetim/danisan-profili");
  redirect(`/yonetim/danisan-profili?clientId=${client.id}`);
}

export async function ClientProfileUrlModals({
  activeModal,
  clientId,
  clientName,
}: Props) {
  if (activeModal !== "not-ekle") return null;

  const session = await requirePermission("clients:read");
  if (!hasPermission(session.user.roles, "clients:manage")) return null;

  const closeHref = `/yonetim/danisan-profili?clientId=${clientId}` as Route;
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
      <form
        action={saveClientNote}
        className={`${modalStyles.modalStack} admin-note-form`}
      >
        <input name="clientId" type="hidden" value={clientId} />
        <ModalFieldPreview
          helper="Not bu danışana kalıcı olarak bağlanır. Klinik değerlendirme detayı yerine yalnızca operasyon takibi için kullanın."
          label="Danışan"
          value={clientName}
        />
        <div className="booking-subject-type">
          <label>
            <input defaultChecked name="category" type="radio" value="ADMIN" />
            <span>Yönetim notu</span>
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
          <small>
            En fazla 500 karakter. Son kaydedilen notlar bu pencerenin altında listelenir.
          </small>
        </label>
        <button className={modalStyles.modalButton} type="submit">
          Notu kaydet
        </button>
      </form>

      {notes.length > 0 ? (
        <div className={modalStyles.modalStack}>
          {notes.map((note) => (
            <ModalFieldPreview
              helper={note.createdAt.toLocaleDateString("tr-TR")}
              key={note.id}
              label={note.category === "PAYMENT" ? "Ödeme notu" : "Yönetim notu"}
              value={note.note}
            />
          ))}
        </div>
      ) : null}
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
