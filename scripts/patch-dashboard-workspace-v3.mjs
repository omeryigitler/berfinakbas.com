import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/WorkspacePanel.tsx", (initialSource) =>
  replaceRequired(
    initialSource,
    `const res = await fetch('/api/admin/dashboard-overview-v2', {`,
    `const res = await fetch('/api/admin/dashboard-overview-v3', {`,
    "Role-aware dashboard overview endpoint",
  ),
);
