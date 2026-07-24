import type { ClientDetail } from "@/components/admin/client-dashboard-types";

import { formatDashboardDate, getDashboardInitials } from "./client-list-adapter";

export interface SalesHubClientDetailView {
  activeDays: number;
  activePlan: ClientDetail["plans"][number] | null;
  age: number | null;
  completableAppointment: ClientDetail["appointments"][number] | null;
  completedAppointments: number;
  displayName: string;
  initials: string;
  lastVisit: ClientDetail["appointments"][number] | null;
  nextAppointment: ClientDetail["nextAppointment"];
  openBalanceLabel: string;
  paidLabel: string;
  planTotalLabel: string;
  processIndex: number;
}

export function formatDashboardMoney(amountMinor: bigint, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(amountMinor) / 100);
}

export function adaptClientDetail(detail: ClientDetail): SalesHubClientDetailView {
  const activePlan =
    detail.plans.find((plan) => plan.status === "ACTIVE") ?? detail.plans[0] ?? null;
  const completedAppointments = detail.completedAppointments;
  const now = Date.now();
  const createdAt = new Date(detail.createdAt).getTime();
  const activeDays = Number.isNaN(createdAt)
    ? 0
    : Math.max(0, Math.floor((now - createdAt) / 86_400_000));
  const age = detail.birthYear ? Math.max(0, new Date().getFullYear() - detail.birthYear) : null;
  const lastVisit =
    detail.appointments.find((appointment) => new Date(appointment.startsAt).getTime() < now) ??
    null;
  // A session can be marked complete only after it has actually started, so the
  // completable appointment is the most recent CONFIRMED one at or before "now"
  // (appointments arrive newest-first). This keeps future appointments out of
  // reach of "Tamamla" while letting a past confirmed session still be closed.
  const completableAppointment =
    detail.appointments.find(
      (appointment) =>
        appointment.status === "CONFIRMED" &&
        new Date(appointment.startsAt).getTime() <= now,
    ) ?? null;
  const processIndex =
    detail.status === "ACTIVE" ? (activePlan ? 2 : 1) : detail.status === "INACTIVE" ? 4 : 0;

  return {
    activeDays,
    activePlan,
    age,
    completableAppointment,
    completedAppointments,
    displayName: `${detail.firstName} ${detail.lastName}`.trim(),
    initials: getDashboardInitials(detail.firstName, detail.lastName),
    lastVisit,
    nextAppointment: detail.nextAppointment,
    openBalanceLabel: detail.financeSummary.openBalanceLabel,
    paidLabel: detail.financeSummary.paidLabel,
    planTotalLabel: detail.financeSummary.planTotalLabel,
    processIndex,
  };
}

export function getDetailEmptyValue(): string {
  return "—";
}

export { formatDashboardDate };
