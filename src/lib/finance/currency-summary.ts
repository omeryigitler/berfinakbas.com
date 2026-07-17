export type CurrencyAggregate = Readonly<{
  count: number;
  currency: string;
  totalMinor: bigint;
}>;

export function formatMinorCurrency(amountMinor: bigint, currency: string): string {
  const absolute = amountMinor < 0n ? -amountMinor : amountMinor;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  const formatter = new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  });
  const formatted = formatter
    .formatToParts(whole)
    .map((part) => (part.type === "fraction" ? fraction : part.value))
    .join("");
  return amountMinor < 0n ? `-${formatted}` : formatted;
}

export function normalizeCurrencyAggregates(
  rows: readonly CurrencyAggregate[],
): CurrencyAggregate[] {
  const totals = new Map<string, { count: number; totalMinor: bigint }>();
  for (const row of rows) {
    const currency = row.currency.trim().toUpperCase();
    const current = totals.get(currency) ?? { count: 0, totalMinor: 0n };
    totals.set(currency, {
      count: current.count + row.count,
      totalMinor: current.totalMinor + row.totalMinor,
    });
  }
  return [...totals]
    .map(([currency, value]) => ({ currency, ...value }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function formatCurrencyAmounts(rows: readonly CurrencyAggregate[]): string {
  const normalized = normalizeCurrencyAggregates(rows);
  if (normalized.length === 0) return "Kayıt yok";
  return normalized.map((row) => formatMinorCurrency(row.totalMinor, row.currency)).join(" + ");
}

export function formatCurrencyAggregateLabel(rows: readonly CurrencyAggregate[]): string {
  const normalized = normalizeCurrencyAggregates(rows);
  const count = normalized.reduce((total, row) => total + row.count, 0);
  if (normalized.length === 0) return "0 kayıt";
  return `${count} kayıt · ${formatCurrencyAmounts(normalized)}`;
}
