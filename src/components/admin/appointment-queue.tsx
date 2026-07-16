"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AppointmentQueueItem = Readonly<{
  client: Readonly<{
    firstName: string;
    id: string;
    lastName: string;
    type: "ADULT" | "CHILD";
  }>;
  duplicateReview: Readonly<{
    candidates: readonly Readonly<{
      clientId: string;
      firstName: string;
      lastName: string;
      matchReasons: readonly ("EMAIL" | "PHONE" | "GUARDIAN_EMAIL" | "GUARDIAN_PHONE")[];
      type: "ADULT" | "CHILD";
    }>[];
    status: "KEPT_SEPARATE" | "LINKED_EXISTING" | "NOT_REQUIRED" | "PENDING";
  }>;
  endsAt: string;
  id: string;
  locationTypeSnapshot: "HYBRID" | "IN_PERSON" | "ONLINE";
  practitioner: Readonly<{ displayName: string }>;
  publicReference: string;
  serviceNameSnapshot: string;
  startsAt: string;
  status: "PENDING_REVIEW" | "REQUESTED";
}>;

type AppointmentQueueResponse = Readonly<{
  data: AppointmentQueueItem[];
  pagination: Readonly<{ nextCursor: string | null }>;
}>;

type AppointmentDecision = "confirm" | "reject" | "review";

const clientTypeLabels = { ADULT: "Yetişkin", CHILD: "Çocuk" } as const;
const locationLabels = {
  HYBRID: "Yüz yüze / çevrim içi",
  IN_PERSON: "Yüz yüze",
  ONLINE: "Çevrim içi",
} as const;
const decisionConfig = {
  confirm: {
    reasonCode: "ADMIN_APPROVED",
    successLabel: "onaylandı",
    toStatus: "CONFIRMED",
  },
  reject: {
    reasonCode: "ADMIN_REJECTED",
    successLabel: "reddedildi",
    toStatus: "REJECTED",
  },
  review: {
    reasonCode: "ADMIN_REVIEW_STARTED",
    successLabel: "incelemeye alındı",
    toStatus: "PENDING_REVIEW",
  },
} as const;
const matchReasonLabels = {
  EMAIL: "e-posta",
  GUARDIAN_EMAIL: "veli e-postası",
  GUARDIAN_PHONE: "veli telefonu",
  PHONE: "telefon",
} as const;

export function buildAppointmentListUrl(cursor: string | null): string {
  const search = new URLSearchParams({
    status: "REQUESTED,PENDING_REVIEW",
    take: "25",
  });
  if (cursor) search.set("cursor", cursor);
  return `/api/admin/appointments?${search.toString()}`;
}

export function buildDuplicateReviewUrl(appointmentId: string): string {
  return `/api/admin/appointments/${encodeURIComponent(appointmentId)}/duplicate-review`;
}

export function formatAppointmentDate(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function buildAppointmentStatusUrl(appointmentId: string): string {
  return `/api/admin/appointments/${encodeURIComponent(appointmentId)}/status`;
}

export function buildAppointmentDecisionBody(decision: AppointmentDecision) {
  const config = decisionConfig[decision];
  return Object.freeze({ reasonCode: config.reasonCode, toStatus: config.toStatus });
}

async function requestAppointmentPage(
  cursor: string | null,
  signal?: AbortSignal,
): Promise<AppointmentQueueResponse> {
  const response = await fetch(buildAppointmentListUrl(cursor), {
    headers: { accept: "application/json" },
    signal,
  });
  const payload = (await response.json()) as AppointmentQueueResponse | { error?: string };
  if (!response.ok || !("data" in payload)) {
    throw new Error("error" in payload && payload.error ? payload.error : "Liste alınamadı.");
  }
  return payload;
}

async function requestAppointmentDecision(
  appointmentId: string,
  decision: AppointmentDecision,
): Promise<void> {
  const response = await fetch(buildAppointmentStatusUrl(appointmentId), {
    body: JSON.stringify(buildAppointmentDecisionBody(decision)),
    headers: { accept: "application/json", "content-type": "application/json" },
    method: "PATCH",
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Randevu durumu güncellenemedi.");
  }
}

async function requestDuplicateResolution(
  appointmentId: string,
  body:
    | Readonly<{ action: "KEEP_SEPARATE" }>
    | Readonly<{ action: "LINK_EXISTING"; targetClientId: string }>,
): Promise<void> {
  const response = await fetch(buildDuplicateReviewUrl(appointmentId), {
    body: JSON.stringify(body),
    headers: { accept: "application/json", "content-type": "application/json" },
    method: "PATCH",
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Mükerrer kayıt incelemesi güncellenemedi.");
  }
}

function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === "AbortError";
}

export function AppointmentQueue({
  businessTimeZone,
  canManage,
}: {
  businessTimeZone: string;
  canManage: boolean;
}) {
  const [actingAppointmentId, setActingAppointmentId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentQueueItem[]>([]);
  const [pendingDecision, setPendingDecision] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadPage = useCallback(
    async (cursor: string | null, append: boolean, signal?: AbortSignal) => {
      setError(null);
      setFeedback(null);
      setLoading(true);

      try {
        const payload = await requestAppointmentPage(cursor, signal);

        setAppointments((current) => (append ? [...current, ...payload.data] : payload.data));
        setNextCursor(payload.pagination.nextCursor);
      } catch (cause) {
        if (isAbortError(cause)) return;
        setError(cause instanceof Error ? cause.message : "Liste alınamadı.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const decideAppointment = useCallback(
    async (appointment: AppointmentQueueItem, decision: AppointmentDecision) => {
      const decisionKey = `${appointment.id}:${decision}`;
      if (pendingDecision !== decisionKey) {
        setPendingDecision(decisionKey);
        const decisionLabel =
          decision === "confirm"
            ? "onaylama"
            : decision === "reject"
              ? "reddetme"
              : "incelemeye alma";
        setFeedback(
          `${appointment.publicReference} için ${decisionLabel} işlemini tamamlamak üzere aynı butona tekrar basın.`,
        );
        return;
      }
      setPendingDecision(null);
      setActingAppointmentId(appointment.id);
      setError(null);
      setFeedback(null);

      try {
        await requestAppointmentDecision(appointment.id, decision);
        setAppointments((current) =>
          decision === "review"
            ? current.map((item) =>
                item.id === appointment.id ? { ...item, status: "PENDING_REVIEW" as const } : item,
              )
            : current.filter((item) => item.id !== appointment.id),
        );
        setFeedback(
          `${appointment.publicReference} numaralı talep ${decisionConfig[decision].successLabel}.`,
        );
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Randevu durumu güncellenemedi.");
      } finally {
        setActingAppointmentId(null);
      }
    },
    [pendingDecision],
  );

  const resolveDuplicate = useCallback(
    async (
      appointment: AppointmentQueueItem,
      action: "KEEP_SEPARATE" | "LINK_EXISTING",
      targetClientId?: string,
    ) => {
      const decisionKey = `${appointment.id}:duplicate:${action}:${targetClientId ?? "new"}`;
      if (pendingDecision !== decisionKey) {
        setPendingDecision(decisionKey);
        setFeedback(
          action === "KEEP_SEPARATE"
            ? "Yeni kaydı ayrı tutmak için aynı butona tekrar basın."
            : "Talebi seçilen mevcut danışana bağlamak için aynı butona tekrar basın.",
        );
        return;
      }

      setPendingDecision(null);
      setActingAppointmentId(appointment.id);
      setError(null);
      setFeedback(null);

      try {
        await requestDuplicateResolution(
          appointment.id,
          action === "KEEP_SEPARATE"
            ? { action }
            : { action, targetClientId: targetClientId ?? "" },
        );
        const selectedCandidate = appointment.duplicateReview.candidates.find(
          (candidate) => candidate.clientId === targetClientId,
        );
        setAppointments((current) =>
          current.map((item) =>
            item.id === appointment.id
              ? {
                  ...item,
                  client:
                    action === "LINK_EXISTING" && selectedCandidate
                      ? {
                          firstName: selectedCandidate.firstName,
                          id: selectedCandidate.clientId,
                          lastName: selectedCandidate.lastName,
                          type: selectedCandidate.type,
                        }
                      : item.client,
                  duplicateReview: {
                    candidates: [],
                    status:
                      action === "KEEP_SEPARATE"
                        ? ("KEPT_SEPARATE" as const)
                        : ("LINKED_EXISTING" as const),
                  },
                }
              : item,
          ),
        );
        setFeedback(
          action === "KEEP_SEPARATE"
            ? `${appointment.publicReference} yeni ve ayrı danışan kaydı olarak tutuldu.`
            : `${appointment.publicReference} mevcut danışan kaydına bağlandı.`,
        );
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Mükerrer kayıt incelemesi güncellenemedi.",
        );
      } finally {
        setActingAppointmentId(null);
      }
    },
    [pendingDecision],
  );

  useEffect(() => {
    const controller = new AbortController();
    void requestAppointmentPage(null, controller.signal)
      .then((payload) => {
        setAppointments(payload.data);
        setNextCursor(payload.pagination.nextCursor);
      })
      .catch((cause: unknown) => {
        if (!isAbortError(cause)) {
          setError(cause instanceof Error ? cause.message : "Liste alınamadı.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading && appointments.length === 0) {
    return (
      <div className="admin-empty-state" role="status">
        <strong>Bekleyen talepler yükleniyor</strong>
        <span>Yalnızca yetkili olduğunuz kayıtlar getiriliyor.</span>
      </div>
    );
  }

  if (error && appointments.length === 0) {
    return (
      <div className="admin-error-state" role="alert">
        <strong>Randevu listesi alınamadı</strong>
        <span>{error}</span>
        <button type="button" onClick={() => void loadPage(null, false)}>
          Yeniden dene
        </button>
      </div>
    );
  }

  if (appointments.length === 0 && !nextCursor) {
    return (
      <>
        {feedback ? (
          <p className="admin-inline-success" role="status">
            {feedback}
          </p>
        ) : null}
        <div className="admin-empty-state" role="status">
          <strong>Bekleyen talep yok</strong>
          <span>İncelemeye alınan yeni talepler burada görünecek.</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-appointments-table">
          <caption className="sr-only">İnceleme bekleyen randevu talepleri</caption>
          <thead>
            <tr>
              <th scope="col">Danışan</th>
              <th scope="col">Hizmet</th>
              <th scope="col">Tarih ve saat</th>
              <th scope="col">Görüşme</th>
              <th scope="col">Referans</th>
              <th scope="col">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>
                  <strong>
                    {appointment.client.firstName} {appointment.client.lastName}
                  </strong>
                  <span>{clientTypeLabels[appointment.client.type]}</span>
                  {appointment.duplicateReview.status === "PENDING" ? (
                    <span className="admin-inline-warning">
                      Olası mükerrer kayıt · {appointment.duplicateReview.candidates.length} aday
                    </span>
                  ) : null}
                </td>
                <td>{appointment.serviceNameSnapshot}</td>
                <td>
                  <time dateTime={appointment.startsAt}>
                    {formatAppointmentDate(appointment.startsAt, businessTimeZone)}
                  </time>
                </td>
                <td>
                  {locationLabels[appointment.locationTypeSnapshot]}
                  <span>{appointment.practitioner.displayName}</span>
                </td>
                <td>
                  <code>{appointment.publicReference}</code>
                </td>
                <td>
                  {canManage ? (
                    <div className="admin-appointment-actions">
                      {appointment.status === "REQUESTED" ? (
                        <button
                          type="button"
                          disabled={actingAppointmentId !== null}
                          onClick={() => void decideAppointment(appointment, "review")}
                        >
                          {pendingDecision === `${appointment.id}:review`
                            ? "İncelemeyi başlat"
                            : "İncelemeye al"}
                        </button>
                      ) : appointment.duplicateReview.status === "PENDING" ? (
                        <>
                          {appointment.duplicateReview.candidates.map((candidate) => {
                            const key = `${appointment.id}:duplicate:LINK_EXISTING:${candidate.clientId}`;
                            return (
                              <div className="admin-duplicate-candidate" key={candidate.clientId}>
                                <Link
                                  className="admin-duplicate-candidate-link"
                                  href={
                                    `/yonetim/danisan-profili?clientId=${candidate.clientId}` as Route
                                  }
                                >
                                  {candidate.firstName} {candidate.lastName}
                                </Link>
                                <span>
                                  {candidate.matchReasons
                                    .map((reason) => matchReasonLabels[reason])
                                    .join(", ")}
                                </span>
                                <button
                                  type="button"
                                  disabled={actingAppointmentId !== null}
                                  onClick={() =>
                                    void resolveDuplicate(
                                      appointment,
                                      "LINK_EXISTING",
                                      candidate.clientId,
                                    )
                                  }
                                >
                                  {pendingDecision === key
                                    ? "Bağlamayı tamamla"
                                    : "Bu danışana bağla"}
                                </button>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            disabled={actingAppointmentId !== null}
                            onClick={() => void resolveDuplicate(appointment, "KEEP_SEPARATE")}
                          >
                            {pendingDecision === `${appointment.id}:duplicate:KEEP_SEPARATE:new`
                              ? "Ayrı tutmayı tamamla"
                              : "Yeni kayıt olarak tut"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={actingAppointmentId !== null}
                            onClick={() => void decideAppointment(appointment, "confirm")}
                          >
                            {actingAppointmentId === appointment.id
                              ? "İşleniyor…"
                              : pendingDecision === `${appointment.id}:confirm`
                                ? "Onayı tamamla"
                                : "Onayla"}
                          </button>
                          <button
                            className="danger"
                            type="button"
                            disabled={actingAppointmentId !== null}
                            onClick={() => void decideAppointment(appointment, "reject")}
                          >
                            {pendingDecision === `${appointment.id}:reject`
                              ? "Reddi tamamla"
                              : "Reddet"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <span>Yalnızca görüntüleme</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-list-footer" aria-live="polite">
        <span>{appointments.length} bekleyen talep gösteriliyor.</span>
        <div>
          <button type="button" disabled={loading} onClick={() => void loadPage(null, false)}>
            Yenile
          </button>
          {nextCursor ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadPage(nextCursor, true)}
            >
              {loading ? "Yükleniyor…" : "Daha fazla göster"}
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="admin-inline-error" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p className="admin-inline-success" role="status">
          {feedback}
        </p>
      ) : null}
    </>
  );
}
