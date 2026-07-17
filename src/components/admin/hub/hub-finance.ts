import {
  formatCurrencyAggregateLabel,
  formatMinorCurrency,
  type CurrencyAggregate,
} from "@/lib/finance/currency-summary";

import { formatRelativeStamp } from "./hub-data";

export type HubFinanceEntryRow = Readonly<{
  amountMinor: bigint;
  client: Readonly<{ firstName: string; lastName: string; preferredName: string | null }>;
  currency: string;
  id: string;
  occurredAt: Date;
  type: "ACCRUAL" | "ADJUSTMENT" | "PAYMENT" | "REFUND" | "REVERSAL";
}>;

export type HubFinanceSummary = Readonly<{
  entries: readonly Readonly<{
    amountLabel: string;
    at: string;
    clientName: string;
    id: string;
    typeLabel: string;
  }>[];
  monthAccrualLabel: string;
  monthPaymentLabel: string;
}>;

export type HubFinanceTotals = Readonly<{
  accruals: readonly CurrencyAggregate[];
  payments: readonly CurrencyAggregate[];
}>;

const financeTypeLabels: Readonly<Record<HubFinanceEntryRow["type"], string>> = {
  ACCRUAL: "Plan borcu",
  ADJUSTMENT: "Düzeltme",
  PAYMENT: "Ödeme",
  REFUND: "İade",
  REVERSAL: "Dengeleyici kayıt",
};

export function buildHubFinanceSummary(
  recentRows: readonly HubFinanceEntryRow[],
  totals: HubFinanceTotals,
  now: Date,
  timeZone: string,
): HubFinanceSummary {
  return {
    entries: recentRows.map((row) => ({
      amountLabel: formatMinorCurrency(row.amountMinor, row.currency),
      at: formatRelativeStamp(row.occurredAt, now, timeZone),
      clientName: row.client.preferredName ?? `${row.client.firstName} ${row.client.lastName}`,
      id: row.id,
      typeLabel: financeTypeLabels[row.type],
    })),
    monthAccrualLabel: formatCurrencyAggregateLabel(totals.accruals),
    monthPaymentLabel: formatCurrencyAggregateLabel(totals.payments),
  };
}
