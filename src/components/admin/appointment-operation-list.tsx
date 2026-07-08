"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import "./appointment-operation-list.module.css";

type AppointmentStatus =
  | "CANCELLED_BY_CLIENT"
  | "CANCELLED_BY_PRACTITIONER"
  | "COMPLETED"
  | "CONFIRMED"
  | "NO_SHOW"
  | "PENDING_REVIEW"
  | "REJECTED"
  | "REQUESTED"
  | "RESCHEDULE_PROPOSED";

type AppointmentOperationItem = Readonly<{
  client: Readonly<{
    firstName: string;
    id: string;
    lastName: string;
    type: "ADULT" | "CHILD";
  }>;
  endsAt: string;
  id: string;
  locationTypeSnapshot: "HYBRID" | "IN_PERSON" | "ONLINE";
  practitioner: Readonly<{ displayName: string }>;
  publicReference: string;
  serviceNameSnapshot: string;
  startsAt: string;
  status: AppointmentStatus;
}>;

type AppointmentAction = "cancel" | "complete";

type ApiResponse = Readonly<{ data?: unknown; error?: string }>;

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  CANCELLED_BY_CLIENT: "Danışan iptal etti",
  CANCELLED_BY_PRACTITIONER: "Uzman iptal etti",
  COMPLETED: "Tamamlandı",
  CONFIRMED: "Onaylı",
  NO_SHOW: "Gelmedi",
  PENDING_REVIEW: "Onay bekliyor",
  REJECTED: "Reddedildi",
  REQUESTED: "Talep alındı",
  RESCHEDULE_PROPOSED: "Saat önerildi",
};

const locationLabels = {
  HYBRID: "Yüz yüze / çevrim içi",
  IN_PERSON: "Yüz yüze",
  ONLINE: "Çevrim içi",
} as const;

const actionConfig = {
  cancel: {
    label: "İptal et",
    pendingLabel: "İptal ediliyor...",
    reasonCode: "ADMIN_CANCELLED",
    successLabel: "iptal edildi",
    toStatus: "CANCELLED_BY_PRACTITIONER",
  },
  complete: {
    label: "Tamamlandı",
    pendingLabel: "Tamamlanıyor...",
    reasonCode: "ADMIN_COMPLETED",
    successLabel: "tamamlandı",
    toStatus: "COMPLETED",
  },
} as const;

function formatAppointmentRange(startsAt: string, endsAt: string, timeZone: string): string {
  const start = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(startsAt));
  const end = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(endsAt));
  return `${start} - ${end}`;
}

function statusUrl(appointmentId: string): string {
  return `/api/admin/appointments/${encodeURIComponent(appointmentId)}/status`;
}

async function readResponse(response: Response): Promise<ApiResponse> {
  try {
    return (await response.json()) as ApiResponse;
  } catch {
    return { error: "Beklenmeyen bir sunucu yanıtı alındı." };
  }
}

export function AppointmentOperationList({
  appointments,
  businessTimeZone,
  canManage,
  emptyDescription,
  emptyTitle,
}: {
  appointments: AppointmentOperationItem[];
  businessTimeZone: string;
  canManage: boolean;
  emptyDescription: string;
  emptyTitle: string;
}) {
  const router = useRouter();
  const [acting, setActing] = useState<{ action: AppointmentAction; appointmentId: string } | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [items, setItems] = useState(appointments);
  const [message, setMessage] = useState<string | null>(null);

  async function updateAppointment(appointment: AppointmentOperationItem, action: AppointmentAction) {
    const config = actionConfig[action];
    setActing({ action, appointmentId: appointment.id });
    setMessage(null);

    try {
      const response = await fetch(statusUrl(appointment.id), {
        body: JSON.stringify({ reasonCode: config.reasonCode, toStatus: config.toStatus }),
        headers: { accept: "application/json", "content-type": "application/json" },
        method: "PATCH",
      });
      const payload = await readResponse(response);
      if (!response.ok) throw new Error(payload.error ?? "Randevu durumu güncellenemedi.");

      setItems((current) => current.filter((item) => item.id !== appointment.id));
      setConfirmCancelId(null);
      setMessage(`${appointment.publicReference} numaralı randevu ${config.successLabel}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Randevu durumu güncellenemedi.");
    } finally {
      setActing(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="admin-empty-state" role="status">
        <strong>{emptyTitle}</strong>
        <span>{emptyDescription}</span>
      </div>
    );
  }

  return (
    <>
      <ul className="admin-client-list admin-dashboard-client-list">
        {items.map((appointment) => {
          const canActOnAppointment = canManage && appointment.status === "CONFIRMED";
          const cancelNeedsConfirm = confirmCancelId === appointment.id;
          const activeAction = acting?.appointmentId === appointment.id ? acting.action : null;

          return (
            <li className="admin-client-list-item admin-dashboard-client-card" key={appointment.id}>
              <div className="admin-client-list-main">
                <strong>
                  {appointment.client.firstName} {appointment.client.lastName}
                </strong>
                <span className="admin-client-contact">
                  {formatAppointmentRange(appointment.startsAt, appointment.endsAt, businessTimeZone)}
                </span>
                <span className="admin-client-meta">
                  <em>{appointment.serviceNameSnapshot}</em>
                  <em>{appointmentStatusLabels[appointment.status]}</em>
                  <em>{locationLabels[appointment.locationTypeSnapshot]}</em>
                  <em>{appointment.publicReference}</em>
                </span>
              </div>

              <div className="admin-appointment-card-actions">
                <Link
                  className="admin-client-profile-link admin-dashboard-client-action"
                  href={`/yonetim/danisan-profili?clientId=${appointment.client.id}` as Route}
                >
                  Profili aç
                </Link>
                {canActOnAppointment ? (
                  <>
                    <button
                      className="admin-appointment-card-button"
                      disabled={acting !== null}
                      onClick={() => void updateAppointment(appointment, "complete")}
                      type="button"
                    >
                      {activeAction === "complete" ? actionConfig.complete.pendingLabel : actionConfig.complete.label}
                    </button>
                    <button
                      className="admin-appointment-card-button danger"
                      disabled={acting !== null}
                      onClick={() => {
                        if (!cancelNeedsConfirm) {
                          setConfirmCancelId(appointment.id);
                          setMessage("İptali tamamlamak için aynı butona tekrar basın.");
                          return;
                        }
                        void updateAppointment(appointment, "cancel");
                      }}
                      type="button"
                    >
                      {activeAction === "cancel"
                        ? actionConfig.cancel.pendingLabel
                        : cancelNeedsConfirm
                          ? "İptali onayla"
                          : actionConfig.cancel.label}
                    </button>
                  </>
                ) : (
                  <span className="admin-appointment-card-status">
                    {appointment.practitioner.displayName}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {message ? <p className="admin-inline-success" role="status">{message}</p> : null}
    </>
  );
}
