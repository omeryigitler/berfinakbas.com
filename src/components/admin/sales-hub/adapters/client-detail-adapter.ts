import type { ClientDetail } from "@/components/admin/client-dashboard-types";

import { formatDashboardDate, getDashboardInitials } from "./client-list-adapter";

export interface SalesHubBalance {
  amountMinor: bigint;
  currency: string;
}

export interface SalesHubClientDetailView {
  activeDays: number;
  activePlan: ClientDetail["plans"][number] | null;
  age: number | null;
  balance: SalesHubBalance;
  completedAppointments: number;
  displayName: string;
  hasOpenBalance: boolean;
  initials: string;
  nextAppointment: ClientDetail["nextAppointment"];
  openBalanceLabel: string;
  paidLabel: string;
  planTotalLabel: string;
  processIndex: number;
  remainingSessions: number;
  scoreTitle: string;
}

export function formatDashboardMoney(amountMinor: bigint, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(amountMinor) / 100);
}

export function calculateClientBalance(detail: ClientDetail): SalesHubBalance {
  let amountMinor = 0n;
  let currency = detail.financeEntries[0]?.currency ?? detail.plans[0]?.currency ?? "TRY";

  // Ledger amounts are stored signed: accruals positive, payments negative.
  // The open balance is therefore the plain signed sum, clamped at zero.
  for (const entry of detail.financeEntries) {
    currency = entry.currency || currency;
    amountMinor += BigInt(entry.amountMinor);
  }

  return { amountMinor: amountMinor > 0n ? amountMinor : 0n, currency };
}

export function adaptClientDetail(detail: ClientDetail): SalesHubClientDetailView {
  const activePlan =
    detail.plans.find((plan) => plan.status === "ACTIVE") ?? detail.plans[0] ?? null;
  const completedAppointments = detail.appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;
  const createdAt = new Date(detail.createdAt).getTime();
  const activeDays = Number.isNaN(createdAt)
    ? 0
    : Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000));
  const age = detail.birthYear ? Math.max(0, new Date().getFullYear() - detail.birthYear) : null;
  const processIndex =
    detail.status === "ACTIVE" ? (activePlan ? 2 : 1) : detail.status === "INACTIVE" ? 4 : 0;

  return {
    activeDays,
    activePlan,
    age,
    balance: calculateClientBalance(detail),
    completedAppointments,
    displayName: `${detail.firstName} ${detail.lastName}`.trim(),
    hasOpenBalance: detail.financeSummary.hasOpenBalance,
    initials: getDashboardInitials(detail.firstName, detail.lastName),
    nextAppointment: detail.nextAppointment,
    openBalanceLabel: detail.financeSummary.openBalanceLabel,
    paidLabel: detail.financeSummary.paidLabel,
    planTotalLabel: detail.financeSummary.planTotalLabel,
    processIndex,
    remainingSessions: detail.financeSummary.remainingSessions,
    scoreTitle:
      detail.score >= 80
        ? "Kapsamlı Gelişim"
        : detail.score >= 55
          ? "Gelişmekte"
          : "Geliştirilmeli",
  };
}

export function getDetailEmptyValue(): string {
  return "—";
}

export { formatDashboardDate };
