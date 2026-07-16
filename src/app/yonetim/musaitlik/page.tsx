import { revalidatePath } from "next/cache";

import { AdminShell } from "@/components/admin/admin-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

import styles from "./musaitlik.module.css";

export const dynamic = "force-dynamic";

type ExceptionView = {
  id: string;
  localDate: Date;
  localEndTime: string | null;
  localStartTime: string | null;
  privateNote: string | null;
  reasonCode: string;
  status: string;
  type: string;
};

const exceptionTypeLabels: Record<string, string> = {
  BLOCKED: "Bloke saat",
  CLOSED: "Kapalı gün",
  CUSTOM_HOURS: "Özel saat",
};

const exceptionTypeOptions = ["CLOSED", "BLOCKED", "CUSTOM_HOURS"] as const;

const exceptionStatusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
};

const exceptionStatusOptions = ["ACTIVE", "INACTIVE"] as const;

function textValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function boundedTextValue(
  formData: FormData,
  key: string,
  minLength: number,
  maxLength: number,
): string {
  const value = textValue(formData, key).slice(0, maxLength);
  return value.length >= minLength ? value : "";
}

function enumValue<T extends string>(
  formData: FormData,
  key: string,
  options: readonly T[],
  fallback: T,
): T {
  const value = textValue(formData, key);
  return options.includes(value as T) ? (value as T) : fallback;
}

function isDateValue(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
  );
}

function isTimeValue(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function formatLocalDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function statusLabel(value: string, labels: Record<string, string>): string {
  return labels[value] ?? value;
}

function exceptionTimeLabel(exception: ExceptionView): string {
  if (exception.type === "CLOSED") return "Tüm gün";
  if (exception.localStartTime && exception.localEndTime) {
    return `${exception.localStartTime}-${exception.localEndTime}`;
  }
  return "Saat aralığı yok";
}

async function createAvailabilityException(formData: FormData) {
  "use server";
  await requirePermission("availability:manage");

  const practitionerId = textValue(formData, "practitionerId");
  const localDate = textValue(formData, "localDate");
  const type = enumValue(formData, "type", exceptionTypeOptions, "CLOSED");
  const status = enumValue(formData, "status", exceptionStatusOptions, "ACTIVE");
  const reasonCode = boundedTextValue(formData, "reasonCode", 2, 80) || "ADMIN_EXCEPTION";
  const privateNote = textValue(formData, "privateNote").slice(0, 500) || null;
  const localStartTime = textValue(formData, "localStartTime");
  const localEndTime = textValue(formData, "localEndTime");

  if (!practitionerId || !isDateValue(localDate)) return;

  const shouldRequireTimeRange = type !== "CLOSED";
  if (
    shouldRequireTimeRange &&
    (!isTimeValue(localStartTime) || !isTimeValue(localEndTime) || localStartTime >= localEndTime)
  ) {
    return;
  }

  await getDatabase().availabilityException.create({
    data: {
      localDate: new Date(`${localDate}T00:00:00.000Z`),
      localEndTime: type === "CLOSED" ? null : localEndTime,
      localStartTime: type === "CLOSED" ? null : localStartTime,
      practitionerId,
      privateNote,
      reasonCode,
      status,
      type,
    },
  });

  revalidatePath("/yonetim/musaitlik");
}

async function deactivateAvailabilityException(formData: FormData) {
  "use server";
  await requirePermission("availability:manage");

  const exceptionId = textValue(formData, "exceptionId");
  if (!exceptionId) return;

  await getDatabase().availabilityException.update({
    data: { status: "INACTIVE" },
    where: { id: exceptionId },
  });

  revalidatePath("/yonetim/musaitlik");
}

export default async function AvailabilityPage() {
  const session = await requirePermission("services:read");
  const canReadAppointments = hasPermission(session.user.roles, "appointments:read");
  const canReadClients = hasPermission(session.user.roles, "clients:read");
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canManageAvailability = hasPermission(session.user.roles, "availability:manage");
  const canReadTechnicalHealth = hasPermission(session.user.roles, "technical-health:read");

  const practitioners = await getDatabase().practitioner.findMany({
    orderBy: [{ displayName: "asc" }],
    select: {
      _count: {
        select: {
          availabilityExceptions: true,
          availabilityRules: true,
        },
      },
      availabilityExceptions: {
        orderBy: [{ localDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          localDate: true,
          localEndTime: true,
          localStartTime: true,
          privateNote: true,
          reasonCode: true,
          status: true,
          type: true,
        },
        take: 12,
      },
      availabilityRules: {
        orderBy: [{ weekday: "asc" }, { localStartTime: "asc" }],
        select: {
          id: true,
          localEndTime: true,
          localStartTime: true,
          slotIncrementMinutes: true,
          status: true,
          weekday: true,
        },
        take: 8,
      },
      displayName: true,
      id: true,
      status: true,
      timeZone: true,
    },
  });

  const activeExceptionCount = practitioners.reduce(
    (total, practitioner) =>
      total +
      practitioner.availabilityExceptions.filter((exception) => exception.status === "ACTIVE")
        .length,
    0,
  );
  const closedDayCount = practitioners.reduce(
    (total, practitioner) =>
      total +
      practitioner.availabilityExceptions.filter(
        (exception) => exception.status === "ACTIVE" && exception.type === "CLOSED",
      ).length,
    0,
  );
  const blockedSlotCount = practitioners.reduce(
    (total, practitioner) =>
      total +
      practitioner.availabilityExceptions.filter(
        (exception) => exception.status === "ACTIVE" && exception.type === "BLOCKED",
      ).length,
    0,
  );

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: canReadAppointments,
        clientsRead: canReadClients,
        financeRead: canReadFinance,
        servicesRead: true,
        technicalHealthRead: canReadTechnicalHealth,
      }}
      subtitle="Terapist bazlı kapalı gün, bloke saat ve özel çalışma saati istisnalarını yönetin."
      title="Müsaitlik yönetimi"
    >
      <section className={styles.summaryGrid} aria-label="Müsaitlik özeti">
        <article>
          <span>Terapist</span>
          <strong>{practitioners.length}</strong>
          <small>Aktif/pasif tüm terapistler</small>
        </article>
        <article>
          <span>Aktif istisna</span>
          <strong>{activeExceptionCount}</strong>
          <small>Randevu planını etkileyen kayıtlar</small>
        </article>
        <article>
          <span>Kapalı gün</span>
          <strong>{closedDayCount}</strong>
          <small>Gün boyu kapalı kayıtlar</small>
        </article>
        <article>
          <span>Bloke saat</span>
          <strong>{blockedSlotCount}</strong>
          <small>Kısmi saat engelleri</small>
        </article>
      </section>

      <section className={styles.panel} aria-labelledby="musaitlik-listesi">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="musaitlik-listesi">Terapist müsaitlik istisnaları</h2>
            <p>
              Kalıcı haftalık kurallar dashboard’da yönetilir. Bu ekran belirli gün veya saat için
              istisna oluşturur.
            </p>
          </div>
          <span>{practitioners.length} terapist</span>
        </div>

        {practitioners.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>Henüz terapist yok</strong>
            <span>İstisna yönetimi için önce aktif terapist kaydı gerekir.</span>
          </div>
        ) : (
          <div className={styles.practitionerGrid}>
            {practitioners.map((practitioner) => {
              const activeExceptions = practitioner.availabilityExceptions.filter(
                (exception) => exception.status === "ACTIVE",
              );
              const activeRules = practitioner.availabilityRules.filter(
                (rule) => rule.status === "ACTIVE",
              );

              return (
                <article className={styles.practitionerCard} key={practitioner.id}>
                  <header>
                    <div>
                      <strong>{practitioner.displayName}</strong>
                      <span>{practitioner.timeZone}</span>
                    </div>
                    <em>
                      {statusLabel(practitioner.status, { ACTIVE: "Aktif", INACTIVE: "Pasif" })}
                    </em>
                  </header>

                  <dl className={styles.metricGrid}>
                    <div>
                      <dt>Aktif istisna</dt>
                      <dd>{activeExceptions.length}</dd>
                    </div>
                    <div>
                      <dt>Haftalık kural</dt>
                      <dd>{activeRules.length}</dd>
                    </div>
                    <div>
                      <dt>Toplam istisna</dt>
                      <dd>{practitioner._count.availabilityExceptions}</dd>
                    </div>
                  </dl>

                  <div className={styles.exceptionList}>
                    {practitioner.availabilityExceptions.length === 0 ? (
                      <span>Henüz istisna kaydı yok.</span>
                    ) : (
                      practitioner.availabilityExceptions.map((exception) => (
                        <div className={styles.exceptionRow} key={exception.id}>
                          <div>
                            <strong>
                              {formatLocalDate(exception.localDate)} ·{" "}
                              {exceptionTimeLabel(exception)}
                            </strong>
                            <span>
                              {statusLabel(exception.type, exceptionTypeLabels)} ·{" "}
                              {exception.reasonCode} ·{" "}
                              {statusLabel(exception.status, exceptionStatusLabels)}
                            </span>
                            {exception.privateNote ? <small>{exception.privateNote}</small> : null}
                          </div>
                          {canManageAvailability && exception.status === "ACTIVE" ? (
                            <form action={deactivateAvailabilityException}>
                              <input name="exceptionId" type="hidden" value={exception.id} />
                              <button type="submit">Pasife al</button>
                            </form>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  {canManageAvailability ? (
                    <details className={styles.editPanel}>
                      <summary>Yeni istisna ekle</summary>
                      <form action={createAvailabilityException}>
                        <input name="practitionerId" type="hidden" value={practitioner.id} />

                        <fieldset className={styles.radioGroup}>
                          <legend>İstisna tipi</legend>
                          {exceptionTypeOptions.map((option) => (
                            <label key={option}>
                              <input
                                defaultChecked={option === "CLOSED"}
                                name="type"
                                type="radio"
                                value={option}
                              />
                              <span>{statusLabel(option, exceptionTypeLabels)}</span>
                            </label>
                          ))}
                        </fieldset>

                        <div className={styles.formGrid}>
                          <label>
                            Tarih
                            <input
                              maxLength={10}
                              minLength={10}
                              name="localDate"
                              pattern="\d{4}-\d{2}-\d{2}"
                              placeholder="2026-07-15"
                              required
                              type="text"
                            />
                            <small>YYYY-AA-GG formatı.</small>
                          </label>
                          <label>
                            Başlangıç saati
                            <input
                              maxLength={5}
                              minLength={5}
                              name="localStartTime"
                              pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                              placeholder="09:00"
                              type="text"
                            />
                            <small>Kapalı gün için boş bırakılabilir.</small>
                          </label>
                          <label>
                            Bitiş saati
                            <input
                              maxLength={5}
                              minLength={5}
                              name="localEndTime"
                              pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                              placeholder="17:00"
                              type="text"
                            />
                            <small>Bloke/özel saat için zorunlu.</small>
                          </label>
                        </div>

                        <div className={styles.formGridTwo}>
                          <label>
                            Sebep kodu
                            <input
                              defaultValue="ADMIN_EXCEPTION"
                              maxLength={80}
                              minLength={2}
                              name="reasonCode"
                              required
                              type="text"
                            />
                          </label>
                          <label>
                            Özel not
                            <input
                              maxLength={500}
                              name="privateNote"
                              placeholder="Örn. eğitim, izin, kurum dışı çalışma"
                              type="text"
                            />
                          </label>
                        </div>

                        <fieldset className={styles.radioGroup}>
                          <legend>Durum</legend>
                          {exceptionStatusOptions.map((option) => (
                            <label key={option}>
                              <input
                                defaultChecked={option === "ACTIVE"}
                                name="status"
                                type="radio"
                                value={option}
                              />
                              <span>{statusLabel(option, exceptionStatusLabels)}</span>
                            </label>
                          ))}
                        </fieldset>

                        <button type="submit">İstisna ekle</button>
                      </form>
                    </details>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
