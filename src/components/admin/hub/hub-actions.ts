import type { HubAppointmentStatus } from "./hub-data";

/*
 * Ribbon actions per appointment status. Mirrors the domain state machine in
 * src/domain/booking/appointment-status.ts and reuses the exact
 * reasonCode/toStatus contract of the admin status API, so the Hub can never
 * offer a transition the backend would reject.
 */

export type HubActionTone = "danger" | "neutral" | "primary";

export type HubAction = Readonly<{
  id: string;
  label: string;
  reasonCode: string;
  tone: HubActionTone;
  toStatus: HubAppointmentStatus;
}>;

const actionsByStatus: Readonly<Record<HubAppointmentStatus, readonly HubAction[]>> = {
  CANCELLED_BY_CLIENT: [],
  CANCELLED_BY_PRACTITIONER: [],
  COMPLETED: [],
  CONFIRMED: [
    {
      id: "complete",
      label: "Tamamlandı",
      reasonCode: "ADMIN_COMPLETED",
      tone: "primary",
      toStatus: "COMPLETED",
    },
    {
      id: "no-show",
      label: "Gelmedi",
      reasonCode: "ADMIN_NO_SHOW",
      tone: "neutral",
      toStatus: "NO_SHOW",
    },
    {
      id: "cancel",
      label: "İptal et",
      reasonCode: "ADMIN_CANCELLED",
      tone: "danger",
      toStatus: "CANCELLED_BY_PRACTITIONER",
    },
  ],
  NO_SHOW: [],
  PENDING_REVIEW: [
    {
      id: "confirm",
      label: "Onayla",
      reasonCode: "ADMIN_APPROVED",
      tone: "primary",
      toStatus: "CONFIRMED",
    },
    {
      id: "reject",
      label: "Reddet",
      reasonCode: "ADMIN_REJECTED",
      tone: "danger",
      toStatus: "REJECTED",
    },
  ],
  REJECTED: [],
  REQUESTED: [
    {
      id: "review",
      label: "İncelemeye al",
      reasonCode: "ADMIN_REVIEW_STARTED",
      tone: "primary",
      toStatus: "PENDING_REVIEW",
    },
  ],
  RESCHEDULE_PROPOSED: [
    {
      id: "confirm",
      label: "Onayla",
      reasonCode: "ADMIN_APPROVED",
      tone: "primary",
      toStatus: "CONFIRMED",
    },
    {
      id: "reject",
      label: "Reddet",
      reasonCode: "ADMIN_REJECTED",
      tone: "danger",
      toStatus: "REJECTED",
    },
  ],
};

export function getHubActions(
  status: HubAppointmentStatus,
  canManage: boolean,
): readonly HubAction[] {
  if (!canManage) return [];
  return actionsByStatus[status];
}

export function buildHubStatusUrl(appointmentId: string): string {
  return `/api/admin/appointments/${encodeURIComponent(appointmentId)}/status`;
}
