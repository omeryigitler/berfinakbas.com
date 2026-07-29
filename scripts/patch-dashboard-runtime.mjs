const patches = [
  "./patch-dashboard-app.mjs",
  "./patch-dashboard-mywork.mjs",
  "./patch-dashboard-workspace.mjs",
  "./patch-client-details-1.mjs",
  "./patch-client-details-2.mjs",
  "./patch-client-details-3.mjs",
  "./patch-client-details-4.mjs",
  "./patch-client-details-5.mjs",
  "./patch-client-details-6.mjs",
  "./patch-client-details-7.mjs",
  "./patch-dashboard-data-integrity.mjs",
  "./patch-dashboard-finalize.mjs",
];

for (const patch of patches) await import(patch);
await import("./verify-dashboard-runtime.mjs");

console.log("Dashboard runtime persistence, authorization and data-integrity patches applied.");
