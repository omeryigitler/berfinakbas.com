import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) =>
  replaceRequired(
    initialSource,
    `    payment: a.paymentStatus === 'PAID' ? 'Ödendi' : 'Bekleniyor',`,
    `    payment: '',`,
    "Remove appointment-level payment state from client mapping",
  ),
);

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `        payment: 'Bekleniyor',
        type: appForm.type,`,
    `        payment: '',
        type: appForm.type,`,
    "Remove new appointment payment placeholder",
  );
  source = replaceRequired(
    source,
    `
                          <span className={\`px-2.5 py-1 rounded-full text-[9px] font-black uppercase \${
                            appt.payment === 'Ödendi' ? 'bg-lime-50 text-lime-900 border border-lime-200' : 'bg-rose-50 text-rose-700'
                          }\`}>
                            {appt.payment}
                          </span>`,
    ``,
    "Remove appointment payment badge",
  );
  return source;
});
