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
  "./patch-dashboard-remaining-blockers.mjs",
  "./patch-dashboard-admin-no-initial-demo.mjs",
  "./patch-dashboard-admin-appointment-payment.mjs",
  "./patch-dashboard-admin-refresh.mjs",
  "./patch-dashboard-admin-refresh-event.mjs",
  "./patch-dashboard-workspace-v3.mjs",
  "./patch-dashboard-admin-simple-payments.mjs",
  "./patch-dashboard-admin-payment-idempotency.mjs",
  "./patch-dashboard-admin-plan-status.mjs",
  "./patch-dashboard-admin-payment-currency.mjs",
  "./patch-dashboard-admin-simple-workspaces.mjs",
  "./patch-dashboard-admin-overview-currency.mjs",
];

for (const patch of patches) await import(patch);
await import("./verify-dashboard-runtime.mjs");
await import("./verify-dashboard-admin-simplification.mjs");

console.log("Dashboard runtime persistence, authorization and data-integrity patches applied.");
