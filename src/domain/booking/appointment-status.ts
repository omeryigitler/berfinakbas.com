export const appointmentStatuses = [
  "requested",
  "pending_review",
  "confirmed",
  "rejected",
  "reschedule_proposed",
  "cancelled_by_client",
  "cancelled_by_practitioner",
  "completed",
  "no_show",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

const transitions = {
  cancelled_by_client: [],
  cancelled_by_practitioner: [],
  completed: [],
  confirmed: [
    "completed",
    "no_show",
    "cancelled_by_client",
    "cancelled_by_practitioner",
    "reschedule_proposed",
  ],
  no_show: [],
  pending_review: ["confirmed", "rejected", "reschedule_proposed"],
  rejected: [],
  requested: ["pending_review"],
  reschedule_proposed: ["confirmed", "rejected", "cancelled_by_client"],
} satisfies Record<AppointmentStatus, readonly AppointmentStatus[]>;

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return transitions[from].includes(to as never);
}

export function assertAppointmentTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!canTransitionAppointment(from, to)) {
    throw new Error(`Geçersiz randevu durum geçişi: ${from} -> ${to}`);
  }
}
