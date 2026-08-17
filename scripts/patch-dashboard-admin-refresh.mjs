import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) =>
  replaceRequired(
    initialSource,
    `      await requireSuccess(response);
      const newPlan: Plan = {`,
    `      await requireSuccess(response);
      window.dispatchEvent(new CustomEvent('dashboard:refresh-client', { detail: { clientId: client.id } }));
      const newPlan: Plan = {`,
    "Refresh persisted client after plan creation",
  ),
);
