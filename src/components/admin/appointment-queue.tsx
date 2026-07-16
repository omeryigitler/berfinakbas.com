"use client";

import { useCallback, useEffect, useState } from "react";

type AppointmentQueueItem = Readonly<{
  client: Readonly<{ firstName: string; lastName: string; type: "ADULT" | "CHILD" }>;
  endsAt: string;
  id: string;
  locationTypeSnapshot: "HYBRID" | "IN_PERSON" | "ONLINE";
  practitioner: Readonly<{ displayName: string }>;
  publicReference: string;
  serviceNameSnapshot: string;
  startsAt: string;
  status: "PENDING_REVIEW";
}>;

type AppointmentQueueResponse = Readonly<{
  data: AppointmentQueueItem[];
  pagination: Readonly<{ nextCursor: string | null }>;
}>;

type AppointmentDecision = "confirm" | "reject";

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
} as const;

export function buildAppointmentListUrl(cursor: string | null): string {
  const search = new URLSearchParams({ status: "PENDING_REVIEW", take: "25" });
  if (cursor) search.set("cursor", cursor);
  return `/api/admin/appointments?${search.toString()}`;
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
        setFeedback(`${appointment.publicReference} için ${decision === "confirm" ? "onaylama" : "reddetme"} işlemini tamamlamak üzere aynı butona tekrar basın.`);
        return;
      }
      setPendingDecision(null);
      setActingAppointmentId(appointment.id);
      setError(null);
      setFeedback(null);

      try {
        await requestAppointmentDecision(appointment.id, decision);
        setAppointments((current) => current.filter((item) => item.id !== appointment.id));
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
                      <button
                        type="button"
                        disabled={actingAppointmentId !== null}
                        onClick={() => void decideAppointment(appointment, "confirm")}
                      >
                        {actingAppointmentId === appointment.id ? "İşleniyor…" : pendingDecision === `${appointment.id}:confirm` ? "Onayı tamamla" : "Onayla"}
                      </button>
                      <button
                        className="danger"
                        type="button"
                        disabled={actingAppointmentId !== null}
                        onClick={() => void decideAppointment(appointment, "reject")}
                      >
                        {pendingDecision === `${appointment.id}:reject` ? "Reddi tamamla" : "Reddet"}
                      </button>
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
