import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) =>
  replaceRequired(
    initialSource,
    `      amount: Math.abs(money(entry.amountMinor)),
      planName: entry.plan?.name ?? 'Plan bilgisi yok',`,
    `      amount: Math.abs(money(entry.amountMinor)),
      currency: entry.currency ?? activeCurrency,
      planName: entry.plan?.name ?? 'Plan bilgisi yok',`,
    "Payment history currency mapping",
  ),
);

await patchFile("types.ts", (initialSource) =>
  replaceRequired(
    initialSource,
    `  planName?: string;
  note: string;`,
    `  planName?: string;
  currency?: string;
  note: string;`,
    "Payment history currency type",
  ),
);

await patchFile("components/ClientDetailsHub.tsx", (initialSource) =>
  replaceRequired(
    initialSource,
    `                            <span className="font-black text-emerald-600">+{record.amount.toLocaleString('tr-TR')} {clientPaymentCurrencyLabel}</span>`,
    `                            <span className="font-black text-emerald-600">+{record.amount.toLocaleString('tr-TR')} {record.currency === 'TRY' || !record.currency ? 'TL' : record.currency}</span>`,
    "Payment history per-record currency",
  ),
);
