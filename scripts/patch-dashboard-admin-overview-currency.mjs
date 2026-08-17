import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/WorkspacePanel.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `const payments = (overview?.recentPayments ?? []) as Array<{ name: string; label: string; amountMinor: string }>;`,
    `const payments = (overview?.recentPayments ?? []) as Array<{ name: string; label: string; amountMinor: string; currency: string }>;`,
    "Recent payment currency type",
  );
  source = replaceRequired(
    source,
    `+{fmtMinor(pay.amountMinor)} (Ödendi)`,
    `+{fmtMinor(pay.amountMinor, pay.currency)} (Ödendi)`,
    "Recent payment currency display",
  );
  return source;
});
