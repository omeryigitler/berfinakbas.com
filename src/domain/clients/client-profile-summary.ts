import {
  formatCurrencyAmounts,
  normalizeCurrencyAggregates,
  type CurrencyAggregate,
} from "@/lib/finance/currency-summary";

export type ClientProfilePlanSummaryInput = Readonly<{
  balanceMinor: string;
  currency: string;
  remainingSessions: string;
  status: string;
  totalAmountMinor: string;
}>;

export type ClientProfileFinanceSummary = Readonly<{
  hasOpenBalance: boolean;
  openBalanceLabel: string;
  paidLabel: string;
  planTotalLabel: string;
  remainingSessions: number;
}>;

function aggregatePlans(
  plans: readonly ClientProfilePlanSummaryInput[],
  selector: (plan: ClientProfilePlanSummaryInput) => bigint,
): CurrencyAggregate[] {
  return normalizeCurrencyAggregates(
    plans.map((plan) => ({
      count: 1,
      currency: plan.currency,
      totalMinor: selector(plan),
    })),
  );
}

export function buildClientProfileFinanceSummary(
  plans: readonly ClientProfilePlanSummaryInput[],
): ClientProfileFinanceSummary {
  const planTotals = aggregatePlans(plans, (plan) => BigInt(plan.totalAmountMinor));
  const openBalances = aggregatePlans(plans, (plan) => {
    const balance = BigInt(plan.balanceMinor);
    return balance > 0n ? balance : 0n;
  });
  const paidTotals = aggregatePlans(plans, (plan) => {
    const total = BigInt(plan.totalAmountMinor);
    const balance = BigInt(plan.balanceMinor);
    return total > balance ? total - balance : 0n;
  });
  const remainingSessions = plans.reduce(
    (total, plan) => total + Number(plan.remainingSessions),
    0,
  );

  return {
    hasOpenBalance: openBalances.some((row) => row.totalMinor > 0n),
    openBalanceLabel: formatCurrencyAmounts(
      openBalances.filter((row) => row.totalMinor > 0n),
    ),
    paidLabel: formatCurrencyAmounts(paidTotals.filter((row) => row.totalMinor !== 0n)),
    planTotalLabel: formatCurrencyAmounts(planTotals.filter((row) => row.totalMinor !== 0n)),
    remainingSessions,
  };
}

export type ClientProfileOperationStatusInput = Readonly<{
  canReadAppointments: boolean;
  canReadFinance: boolean;
  clientType: "ADULT" | "CHILD";
  hasAppointment: boolean;
  hasGuardian: boolean;
  hasOpenBalance: boolean;
  openBalanceLabel: string;
}>;

export function buildClientProfileOperationStatus(
  input: ClientProfileOperationStatusInput,
): Readonly<{ detail: string; title: string }> {
  if (input.clientType === "CHILD" && !input.hasGuardian) {
    return {
      detail: "Çocuk danışan için veli bilgisi bağlanmalı.",
      title: "Veli eksik",
    };
  }
  if (input.canReadFinance && input.hasOpenBalance) {
    return {
      detail: input.openBalanceLabel,
      title: "Açık bakiye var",
    };
  }
  if (input.canReadAppointments && !input.hasAppointment) {
    return {
      detail: "Yeni randevu oluşturulabilir.",
      title: "Randevu yok",
    };
  }
  if (!input.canReadAppointments && !input.canReadFinance) {
    return {
      detail: "Randevu ve finans verileri bu rol için görünmüyor.",
      title: "Sınırlı görünüm",
    };
  }
  if (!input.canReadAppointments || !input.canReadFinance) {
    return {
      detail: "Özet yalnızca bu rolün erişebildiği kayıtları değerlendiriyor.",
      title: "Kısmi görünüm",
    };
  }
  return {
    detail: "Randevu ve finans akışında açık uyarı yok.",
    title: "Takip temiz",
  };
}
