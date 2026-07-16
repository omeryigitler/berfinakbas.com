import type { Route } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

import { AdminUrlModal } from "./admin-url-modal";
import modalStyles from "./admin-url-modal.module.css";
import { SelectControl } from "./select-control";

type Guardian = {
  email: string | null;
  firstName: string;
  id: string;
  lastName: string;
  phone: string;
};

type Relation = {
  authorityVerifiedAt: Date | null;
  guardian: Guardian;
  isPrimary: boolean;
  relationship: string;
  verificationNote: string | null;
};

type ConsentDocument = {
  id: string;
  publicTitle: string | null;
  type: string;
  version: string;
};
type ConsentSummary = { id: string; status: string };

type ClientSummary = {
  birthYear: number | null;
  email: string | null;
  firstName: string;
  id: string;
  lastName: string;
  phone: string | null;
  preferredName: string | null;
  status: string;
  type: "ADULT" | "CHILD";
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value || null;
}

function closeHref(clientId: string): Route {
  return `/yonetim/danisan-profili?clientId=${clientId}` as Route;
}

async function grantConsent(formData: FormData) {
  "use server";
  const session = await requirePermission("consents:manage");
  const clientId = text(formData, "clientId");
  const documentId = text(formData, "documentId");
  const grantedByGuardianId = optional(formData, "grantedByGuardianId");
  const reason = text(formData, "reason");
  if (!clientId || !documentId || reason.length < 8) return;

  const database = getDatabase();
  const [client, document] = await Promise.all([
    database.client.findUnique({
      include: { guardians: true },
      where: { id: clientId },
    }),
    database.consentDocument.findFirst({
      where: { id: documentId, retiredAt: null },
    }),
  ]);
  if (!client || !document) return;
  if (client.type === "CHILD" && !grantedByGuardianId) return;
  if (
    grantedByGuardianId &&
    !client.guardians.some((item) => item.guardianId === grantedByGuardianId)
  )
    return;

  await database.$transaction(async (transaction) => {
    const activeConsentCount = await transaction.consent.count({
      where: {
        clientId,
        document: { type: document.type },
        status: "GRANTED",
      },
    });
    if (activeConsentCount > 0) return;

    const consent = await transaction.consent.create({
      data: {
        actorUserId: session.user.id,
        captureChannel: "ADMIN",
        clientId,
        documentId,
        evidenceMetadata: { note: reason },
        grantedByGuardianId,
        status: "GRANTED",
      },
    });
    await transaction.auditLog.create({
      data: {
        action: "consent.granted",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { documentId, status: "GRANTED" },
        correlationId: crypto.randomUUID(),
        entityId: consent.id,
        entityType: "CONSENT",
        reason,
      },
    });
  });
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

async function withdrawConsent(formData: FormData) {
  "use server";
  const session = await requirePermission("consents:manage");
  const clientId = text(formData, "clientId");
  const consentId = text(formData, "consentId");
  const reason = text(formData, "reason");
  if (!clientId || !consentId || reason.length < 8) return;

  const database = getDatabase();
  await database.$transaction(async (transaction) => {
    const existing = await transaction.consent.findFirst({
      where: { clientId, id: consentId, status: "GRANTED" },
    });
    if (!existing) return;
    const withdrawnAt = new Date();
    const existingEvidence =
      existing.evidenceMetadata &&
      typeof existing.evidenceMetadata === "object" &&
      !Array.isArray(existing.evidenceMetadata)
        ? existing.evidenceMetadata
        : {};
    await transaction.consent.update({
      data: {
        evidenceMetadata: { ...existingEvidence, withdrawalNote: reason },
        status: "WITHDRAWN",
        withdrawnAt,
      },
      where: { id: existing.id },
    });
    await transaction.auditLog.create({
      data: {
        action: "consent.withdrawn",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: {
          status: "WITHDRAWN",
          withdrawnAt: withdrawnAt.toISOString(),
        },
        beforeSummary: { status: existing.status },
        correlationId: crypto.randomUUID(),
        entityId: existing.id,
        entityType: "CONSENT",
        reason,
      },
    });
  });
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

async function verifyGuardianAuthority(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:manage");
  const clientId = text(formData, "clientId");
  const guardianId = text(formData, "guardianId");
  const verificationNote = text(formData, "verificationNote");
  if (!clientId || !guardianId || verificationNote.length < 8) return;

  const verifiedAt = new Date();
  const database = getDatabase();
  await database.$transaction(async (transaction) => {
    const relation = await transaction.clientGuardian.findUnique({
      select: { authorityVerifiedAt: true },
      where: { clientId_guardianId: { clientId, guardianId } },
    });
    if (!relation) return;

    await transaction.clientGuardian.update({
      data: { authorityVerifiedAt: verifiedAt, verificationNote },
      where: { clientId_guardianId: { clientId, guardianId } },
    });
    await transaction.auditLog.create({
      data: {
        action: "guardian.authority_verified",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { authorityVerified: true },
        beforeSummary: { authorityVerified: Boolean(relation.authorityVerifiedAt) },
        correlationId: crypto.randomUUID(),
        entityId: guardianId,
        entityType: "GUARDIAN",
        reason: verificationNote,
      },
    });
  });
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

async function updateClient(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:manage");
  const clientId = text(formData, "clientId");
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  const birthYearValue = optional(formData, "birthYear");
  const status = text(formData, "status");
  if (!clientId || !firstName || !lastName) return;
  if (!["ACTIVE", "INACTIVE", "PROSPECTIVE"].includes(status)) return;

  const birthYear = birthYearValue ? Number(birthYearValue) : null;
  const currentYear = new Date().getFullYear();
  if (
    birthYear !== null &&
    (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > currentYear)
  )
    return;

  const nextValues = {
    birthYear,
    email: optional(formData, "email"),
    firstName,
    lastName,
    phone: optional(formData, "phone"),
    preferredName: optional(formData, "preferredName"),
    status: status as "ACTIVE" | "INACTIVE" | "PROSPECTIVE",
  };
  const database = getDatabase();
  await database.$transaction(async (transaction) => {
    const existing = await transaction.client.findUnique({
      select: {
        birthYear: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        preferredName: true,
        status: true,
      },
      where: { id: clientId },
    });
    if (!existing) return;

    const changedFields = Object.entries(nextValues)
      .filter(([key, value]) => existing[key as keyof typeof existing] !== value)
      .map(([key]) => key);
    if (changedFields.length === 0) return;

    await transaction.client.update({ data: nextValues, where: { id: clientId } });
    await transaction.auditLog.create({
      data: {
        action: "client.profile_updated",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { changedFields, status: nextValues.status },
        beforeSummary: { status: existing.status },
        correlationId: crypto.randomUUID(),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_PROFILE_UPDATED",
      },
    });
  });
  revalidatePath("/yonetim/danisanlar");
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

async function addExistingGuardian(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:manage");
  const clientId = text(formData, "clientId");
  const guardianId = text(formData, "guardianId");
  const relationship = text(formData, "relationship");
  if (!clientId || !guardianId || !relationship) return;

  const database = getDatabase();
  await database.$transaction(
    async (transaction) => {
      const count = await transaction.clientGuardian.count({ where: { clientId } });
      await transaction.clientGuardian.upsert({
        create: { clientId, guardianId, isPrimary: count === 0, relationship },
        update: { relationship },
        where: { clientId_guardianId: { clientId, guardianId } },
      });
      await transaction.auditLog.create({
        data: {
          action: "guardian.relation_upserted",
          actorType: "USER",
          actorUserId: session.user.id,
          afterSummary: { isPrimary: count === 0, linked: true },
          correlationId: crypto.randomUUID(),
          entityId: guardianId,
          entityType: "GUARDIAN",
          reason: "GUARDIAN_RELATION_UPSERTED",
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

async function createGuardian(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:manage");
  const clientId = text(formData, "clientId");
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  const phone = text(formData, "phone");
  const relationship = text(formData, "relationship");
  if (!clientId || !firstName || !lastName || !phone || !relationship) return;

  const database = getDatabase();
  await database.$transaction(
    async (transaction) => {
      const count = await transaction.clientGuardian.count({ where: { clientId } });
      const guardian = await transaction.guardian.create({
        data: { email: optional(formData, "email"), firstName, lastName, phone },
        select: { id: true },
      });
      await transaction.clientGuardian.create({
        data: {
          clientId,
          guardianId: guardian.id,
          isPrimary: count === 0,
          relationship,
        },
      });
      await transaction.auditLog.create({
        data: {
          action: "guardian.created_and_linked",
          actorType: "USER",
          actorUserId: session.user.id,
          afterSummary: { isPrimary: count === 0, linked: true },
          correlationId: crypto.randomUUID(),
          entityId: guardian.id,
          entityType: "GUARDIAN",
          reason: "GUARDIAN_CREATED_AND_LINKED",
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

async function updateGuardian(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:manage");
  const clientId = text(formData, "clientId");
  const guardianId = text(formData, "guardianId");
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  const phone = text(formData, "phone");
  const relationship = text(formData, "relationship");
  if (!clientId || !guardianId || !firstName || !lastName || !phone || !relationship) return;

  const database = getDatabase();
  await database.$transaction(async (transaction) => {
    await transaction.guardian.update({
      data: { email: optional(formData, "email"), firstName, lastName, phone },
      where: { id: guardianId },
    });
    await transaction.clientGuardian.update({
      data: { relationship },
      where: { clientId_guardianId: { clientId, guardianId } },
    });
    await transaction.auditLog.create({
      data: {
        action: "guardian.profile_updated",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: {
          changedFields: ["email", "firstName", "lastName", "phone", "relationship"],
        },
        correlationId: crypto.randomUUID(),
        entityId: guardianId,
        entityType: "GUARDIAN",
        reason: "GUARDIAN_PROFILE_UPDATED",
      },
    });
  });
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

async function setPrimaryGuardian(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:manage");
  const clientId = text(formData, "clientId");
  const guardianId = text(formData, "guardianId");
  if (!clientId || !guardianId) return;

  const database = getDatabase();
  await database.$transaction(async (transaction) => {
    await transaction.clientGuardian.updateMany({
      data: { isPrimary: false },
      where: { clientId },
    });
    await transaction.clientGuardian.update({
      data: { isPrimary: true },
      where: { clientId_guardianId: { clientId, guardianId } },
    });
    await transaction.auditLog.create({
      data: {
        action: "guardian.primary_changed",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { isPrimary: true },
        correlationId: crypto.randomUUID(),
        entityId: guardianId,
        entityType: "GUARDIAN",
        reason: "PRIMARY_GUARDIAN_CHANGED",
      },
    });
  });
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

async function removeGuardian(formData: FormData) {
  "use server";
  const session = await requirePermission("clients:manage");
  const clientId = text(formData, "clientId");
  const guardianId = text(formData, "guardianId");
  if (!clientId || !guardianId) return;

  const database = getDatabase();
  await database.$transaction(
    async (transaction) => {
      const client = await transaction.client.findUnique({
        include: { guardians: { select: { guardianId: true, isPrimary: true } } },
        where: { id: clientId },
      });
      if (!client) return;
      if (client.type === "CHILD" && client.guardians.length <= 1) return;

      const removed = client.guardians.find((item) => item.guardianId === guardianId);
      if (!removed) return;
      await transaction.clientGuardian.delete({
        where: { clientId_guardianId: { clientId, guardianId } },
      });
      if (removed.isPrimary) {
        const replacement = client.guardians.find((item) => item.guardianId !== guardianId);
        if (replacement) {
          await transaction.clientGuardian.update({
            data: { isPrimary: true },
            where: {
              clientId_guardianId: { clientId, guardianId: replacement.guardianId },
            },
          });
        }
      }
      await transaction.auditLog.create({
        data: {
          action: "guardian.relation_removed",
          actorType: "USER",
          actorUserId: session.user.id,
          afterSummary: { linked: false },
          beforeSummary: { isPrimary: removed.isPrimary, linked: true },
          correlationId: crypto.randomUUID(),
          entityId: guardianId,
          entityType: "GUARDIAN",
          reason: "GUARDIAN_RELATION_REMOVED",
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  revalidatePath("/yonetim/danisan-profili");
  redirect(closeHref(clientId));
}

export function ClientProfileManagementModals({
  activeModal,
  allGuardians,
  canManageClients,
  canManageConsents,
  client,
  consentDocuments,
  consents,
  relations,
}: {
  activeModal: string;
  allGuardians: Guardian[];
  canManageClients: boolean;
  canManageConsents: boolean;
  client: ClientSummary;
  consentDocuments: ConsentDocument[];
  consents: ConsentSummary[];
  relations: Relation[];
}) {
  const close = closeHref(client.id);

  if (activeModal === "profili-duzenle" && canManageClients) {
    return (
      <AdminUrlModal closeHref={close} title="Danışan profilini düzenle">
        <form action={updateClient} className={modalStyles.modalStack}>
          <input name="clientId" type="hidden" value={client.id} />
          <div className={modalStyles.modalGrid}>
            <label className="booking-field">
              Ad
              <input defaultValue={client.firstName} maxLength={120} name="firstName" required />
            </label>
            <label className="booking-field">
              Soyad
              <input defaultValue={client.lastName} maxLength={120} name="lastName" required />
            </label>
            <label className="booking-field">
              Tercih edilen ad
              <input
                defaultValue={client.preferredName ?? ""}
                maxLength={120}
                name="preferredName"
              />
            </label>
            <label className="booking-field">
              Doğum yılı
              <input
                defaultValue={client.birthYear ?? ""}
                inputMode="numeric"
                maxLength={4}
                name="birthYear"
              />
            </label>
            <label className="booking-field">
              Telefon
              <input defaultValue={client.phone ?? ""} maxLength={40} name="phone" />
            </label>
            <label className="booking-field">
              E-posta
              <input defaultValue={client.email ?? ""} maxLength={320} name="email" type="email" />
            </label>
            <label className="booking-field">
              Statü
              <SelectControl
                defaultValue={client.status}
                name="status"
                options={[
                  { label: "Ön görüşme", value: "PROSPECTIVE" },
                  { label: "Aktif", value: "ACTIVE" },
                  { label: "Pasif", value: "INACTIVE" },
                ]}
              />
            </label>
          </div>
          <button className={modalStyles.modalButton} type="submit">
            Profili kaydet
          </button>
        </form>
      </AdminUrlModal>
    );
  }

  if (activeModal === "onay-yonetimi" && canManageConsents) {
    const grantedConsents = consents.filter((consent) => consent.status === "GRANTED");
    return (
      <AdminUrlModal closeHref={close} title="KVKK / onay yönetimi">
        <div className={modalStyles.modalStack}>
          <form action={grantConsent} className={modalStyles.modalStack}>
            <h3>Yeni onay kaydet</h3>
            <input name="clientId" type="hidden" value={client.id} />
            <label className="booking-field">
              Belge
              <SelectControl
                name="documentId"
                options={consentDocuments.map((document) => ({
                  label: `${document.publicTitle ?? document.type} · v${document.version}`,
                  value: document.id,
                }))}
                required
              />
            </label>
            {client.type === "CHILD" ? (
              <label className="booking-field">
                Onayı veren veli
                <SelectControl
                  name="grantedByGuardianId"
                  options={relations.map((relation) => ({
                    label: `${relation.guardian.firstName} ${relation.guardian.lastName}`,
                    value: relation.guardian.id,
                  }))}
                  required
                />
              </label>
            ) : null}
            <label className="booking-field">
              Kayıt notu
              <textarea
                minLength={8}
                name="reason"
                placeholder="Onayın nasıl ve ne zaman alındığını yazın."
                required
              />
            </label>
            <button
              className={modalStyles.modalButton}
              disabled={consentDocuments.length === 0}
              type="submit"
            >
              Onayı kaydet
            </button>
          </form>
          {grantedConsents.map((consent) => (
            <form action={withdrawConsent} className={modalStyles.modalStack} key={consent.id}>
              <input name="clientId" type="hidden" value={client.id} />
              <input name="consentId" type="hidden" value={consent.id} />
              <label className="booking-field">
                Geri çekme nedeni
                <textarea minLength={8} name="reason" required />
              </label>
              <button className={modalStyles.modalButtonSecondary} type="submit">
                Onayı geri çek
              </button>
            </form>
          ))}
          <Link className={modalStyles.modalButtonSecondary} href={close}>
            Kapat
          </Link>
        </div>
      </AdminUrlModal>
    );
  }

  if (activeModal !== "veli-yonetimi" || !canManageClients) return null;

  const availableGuardians = allGuardians.filter(
    (guardian) => !relations.some((relation) => relation.guardian.id === guardian.id),
  );

  return (
    <AdminUrlModal closeHref={close} title="Veli / sorumlu yönetimi">
      <div className={modalStyles.modalStack}>
        {availableGuardians.length > 0 ? (
          <form action={addExistingGuardian} className={modalStyles.modalStack}>
            <h3>Mevcut veli bağla</h3>
            <input name="clientId" type="hidden" value={client.id} />
            <label className="booking-field">
              Veli
              <SelectControl
                name="guardianId"
                options={availableGuardians.map((guardian) => ({
                  label: `${guardian.firstName} ${guardian.lastName} · ${guardian.phone}`,
                  value: guardian.id,
                }))}
                required
              />
            </label>
            <label className="booking-field">
              Yakınlık
              <input
                maxLength={80}
                name="relationship"
                placeholder="Anne, baba, bakım veren..."
                required
              />
            </label>
            <button className={modalStyles.modalButton} type="submit">
              Veliyi bağla
            </button>
          </form>
        ) : null}

        <form action={createGuardian} className={modalStyles.modalStack}>
          <h3>Yeni veli oluştur</h3>
          <input name="clientId" type="hidden" value={client.id} />
          <div className={modalStyles.modalGrid}>
            <label className="booking-field">
              Ad
              <input maxLength={120} name="firstName" required />
            </label>
            <label className="booking-field">
              Soyad
              <input maxLength={120} name="lastName" required />
            </label>
            <label className="booking-field">
              Telefon
              <input maxLength={40} name="phone" required />
            </label>
            <label className="booking-field">
              E-posta
              <input maxLength={320} name="email" type="email" />
            </label>
            <label className="booking-field">
              Yakınlık
              <input maxLength={80} name="relationship" required />
            </label>
          </div>
          <button className={modalStyles.modalButton} type="submit">
            Yeni veliyi oluştur
          </button>
        </form>

        {relations.map((relation) => (
          <form
            action={updateGuardian}
            className={modalStyles.modalStack}
            key={relation.guardian.id}
          >
            <h3>
              {relation.guardian.firstName} {relation.guardian.lastName}
              {relation.isPrimary ? " · Birincil" : ""}
              {relation.authorityVerifiedAt ? " · Yetkisi doğrulandı" : " · Yetki bekliyor"}
            </h3>
            <input name="clientId" type="hidden" value={client.id} />
            <input name="guardianId" type="hidden" value={relation.guardian.id} />
            <div className={modalStyles.modalGrid}>
              <label className="booking-field">
                Ad
                <input defaultValue={relation.guardian.firstName} name="firstName" required />
              </label>
              <label className="booking-field">
                Soyad
                <input defaultValue={relation.guardian.lastName} name="lastName" required />
              </label>
              <label className="booking-field">
                Telefon
                <input defaultValue={relation.guardian.phone} name="phone" required />
              </label>
              <label className="booking-field">
                E-posta
                <input defaultValue={relation.guardian.email ?? ""} name="email" type="email" />
              </label>
              <label className="booking-field">
                Yakınlık
                <input defaultValue={relation.relationship} name="relationship" required />
              </label>
            </div>
            {!relation.authorityVerifiedAt ? (
              <label className="booking-field">
                Yetki doğrulama notu
                <textarea
                  minLength={8}
                  name="verificationNote"
                  placeholder="Temsil yetkisinin nasıl doğrulandığını yazın."
                  required
                />
              </label>
            ) : relation.verificationNote ? (
              <p>Doğrulama notu: {relation.verificationNote}</p>
            ) : null}
            <div className={modalStyles.footerActions}>
              <button className={modalStyles.modalButton} formNoValidate type="submit">
                Bilgileri kaydet
              </button>
              {!relation.authorityVerifiedAt ? (
                <button
                  className={modalStyles.modalButtonSecondary}
                  formAction={verifyGuardianAuthority}
                  type="submit"
                >
                  Temsil yetkisini doğrula
                </button>
              ) : null}
              {!relation.isPrimary ? (
                <button
                  className={modalStyles.modalButtonSecondary}
                  formAction={setPrimaryGuardian}
                  formNoValidate
                  type="submit"
                >
                  Birincil yap
                </button>
              ) : null}
              {client.type !== "CHILD" || relations.length > 1 ? (
                <button
                  className={modalStyles.modalButtonSecondary}
                  formAction={removeGuardian}
                  formNoValidate
                  type="submit"
                >
                  İlişkiyi kaldır
                </button>
              ) : null}
            </div>
          </form>
        ))}
        <Link className={modalStyles.modalButtonSecondary} href={close}>
          Kapat
        </Link>
      </div>
    </AdminUrlModal>
  );
}
