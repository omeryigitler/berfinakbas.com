import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `  const active = payablePlans.find((plan) => plan.status === 'ACTIVE') ?? payablePlans[0] ?? null;
  const activeCurrency = active?.currency ?? 'TRY';`,
    `  const active = payablePlans.find((plan) => plan.status === 'ACTIVE') ?? null;
  const financeAnchorPlan = active ?? payablePlans[0] ?? null;
  const activeCurrency = financeAnchorPlan?.currency ?? 'TRY';`,
    "Separate active plan from finance anchor",
  );
  source = replaceRequired(
    source,
    `const planStatusToTr = (s: string) =>
  s === 'ACTIVE' ? 'Aktif' : s === 'COMPLETED' ? 'Tamamlandı' : 'İptal Edildi';`,
    `const planStatusToTr = (s: string) =>
  s === 'ACTIVE'
    ? 'Aktif'
    : s === 'COMPLETED'
      ? 'Tamamlandı'
      : s === 'EXPIRED'
        ? 'Süresi Doldu'
        : 'İptal Edildi';`,
    "Expired plan display status",
  );
  return source;
});

await patchFile("types.ts", (initialSource) =>
  replaceRequired(
    initialSource,
    `status: 'Aktif' | 'Tamamlandı' | 'İptal Edildi';`,
    `status: 'Aktif' | 'Tamamlandı' | 'Süresi Doldu' | 'İptal Edildi';`,
    "Expired plan type",
  ),
);
