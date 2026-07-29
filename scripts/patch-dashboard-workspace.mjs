import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/WorkspacePanel.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `const res = await fetch('/api/admin/dashboard-overview', {`,
    `const res = await fetch('/api/admin/dashboard-overview-v2', {`,
    "Corrected dashboard overview endpoint",
  );
  source = replaceRequired(
    source,
    `  const fmtMinor = (minor: string | number | undefined) =>
    \`${"${new Intl.NumberFormat('tr-TR').format(Math.round(Number(minor ?? 0) / 100))} TL"}\`;`,
    `  const fmtMinor = (minor: string | number | undefined, currency = 'TRY') => {
    const amount = new Intl.NumberFormat('tr-TR').format(Math.round(Number(minor ?? 0) / 100));
    return \`${"${amount} ${currency === 'TRY' ? 'TL' : currency}"}\`;
  };
  const fmtFinance = (finance: any, field: string) => {
    const rows = Array.isArray(finance?.rows) ? finance.rows : [];
    if (rows.length === 0) return '0 TL';
    return rows.map((row: any) => fmtMinor(row?.[field], row?.currency ?? 'TRY')).join(' · ');
  };`,
    "Multi-currency finance formatter",
  );
  for (const field of [
    "todayCollectedMinor",
    "expectedTotalMinor",
    "dueTodayOutstandingMinor",
    "overdueOutstandingMinor",
  ]) {
    source = source.replaceAll(`fmtMinor(f.${field})`, `fmtFinance(f, '${field}')`);
  }
  return source;
});
