import type { ClientDetail } from '@/components/admin/client-dashboard-types';

import { formatDashboardDate, getDashboardInitials } from './client-list-adapter';

export interface SalesHubBalance {
  amountMinor: bigint;
  currency: string;
}

export interface SalesHubClientDetailView {
  activeDays: number;
  activePlan: ClientDetail['plans'][number] | null;
  age: number | null;
  balance: SalesHubBalance;
  completedAppointments: number;
  displayName: string;
  initials: string;
  nextAppointment: ClientDetail['nextAppointment'];
  processIndex: number;
  scoreTitle: string;
}

export function formatDashboardMoney(amountMinor: bigint, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(amountMinor) / 100);
}

export function calculateClientBalance(detail: ClientDetail): SalesHubBalance {
  let amountMinor = 0n;
  let currency = detail.financeEntries[0]?.currency ?? detail.plans[0]?.currency ?? 'TRY';

  for (const entry of detail.financeEntries) {
    const value = BigInt(entry.amountMinor);
    currency = entry.currency || currency;
    if (entry.type === 'ACCRUAL') amountMinor += value;
    if (entry.type === 'PAYMENT') amountMinor -= value;
    if (entry.type === 'REFUND') amountMinor += value;
    if (entry.type === 'ADJUSTMENT') amountMinor += value;
  }

  return { amountMinor: amountMinor > 0n ? amountMinor : 0n, currency };
}

export function adaptClientDetail(detail: ClientDetail): SalesHubClientDetailView {
  const activePlan = detail.plans.find((plan) => plan.status === 'ACTIVE') ?? detail.plans[0] ?? null;
  const completedAppointments = detail.appointments.filter(
    (appointment) => appointment.status === 'COMPLETED',
  ).length;
  const createdAt = new Date(detail.createdAt).getTime();
  const activeDays = Number.isNaN(createdAt)
    ? 0
    : Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000));
  const age = detail.birthYear ? Math.max(0, new Date().getFullYear() - detail.birthYear) : null;
  const processIndex =
    detail.status === 'ACTIVE' ? (activePlan ? 2 : 1) : detail.status === 'INACTIVE' ? 4 : 0;

  return {
    activeDays,
    activePlan,
    age,
    balance: calculateClientBalance(detail),
    completedAppointments,
    displayName: `${detail.firstName} ${detail.lastName}`.trim(),
    initials: getDashboardInitials(detail.firstName, detail.lastName),
    nextAppointment: detail.nextAppointment,
    processIndex,
    scoreTitle:
      detail.score >= 80 ? 'Kapsamlı Gelişim' : detail.score >= 55 ? 'Gelişmekte' : 'Geliştirilmeli',
  };
}

export function getDetailEmptyValue(): string {
  return '—';
}

export { formatDashboardDate };
