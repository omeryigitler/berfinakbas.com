import { readFile } from "node:fs/promises";
import path from "node:path";

function requireContains(source, text, label) {
  if (!source.includes(text)) throw new Error(`${label} is missing.`);
}

function requireAbsent(source, text, label) {
  if (source.includes(text)) throw new Error(`${label} is still present.`);
}

const dashboardRoot = path.resolve(".dashboard-source/src");
const app = await readFile(path.join(dashboardRoot, "App.tsx"), "utf-8");
const details = await readFile(path.join(dashboardRoot, "components/ClientDetailsHub.tsx"), "utf-8");
const workspace = await readFile(path.join(dashboardRoot, "components/WorkspacePanel.tsx"), "utf-8");
const moduleViews = await readFile(path.join(dashboardRoot, "components/workspaces/ModuleViews.tsx"), "utf-8");
const financeView = await readFile(path.join(dashboardRoot, "components/workspaces/FinancePdfViews.tsx"), "utf-8");
const moduleConfig = await readFile(path.join(dashboardRoot, "data/moduleConfig.ts"), "utf-8");
const paymentRoute = await readFile(path.resolve("src/app/api/admin/payments/route.ts"), "utf-8");
const paymentService = await readFile(path.resolve("src/lib/finance/simple-plan-payment-service.ts"), "utf-8");
const overview = await readFile(path.resolve("src/app/api/admin/dashboard-overview-v3/route.ts"), "utf-8");
const prerequisites = await readFile(path.resolve("src/app/api/admin/appointment-prerequisites/route.ts"), "utf-8");
const operationRead = await readFile(path.resolve("src/lib/admin/management-hub-read-operations.ts"), "utf-8");
const systemRead = await readFile(path.resolve("src/lib/admin/management-hub-read-system.ts"), "utf-8");

requireContains(app, "_paymentPlanOptions", "all open plan payment targets");
requireContains(app, "currency: entry.currency", "payment history currency");
requireContains(app, "window.addEventListener('dashboard:refresh-client'", "persisted client refresh listener");
requireContains(app, "}, [loadClients, selectedLeadId]);", "single client refresh dependency set");
requireAbsent(app, "const handleRefreshClient", "duplicate client refresh listener");
requireAbsent(app, "INITIAL_CLIENTS", "initial demo client state");
requireAbsent(app, "_payTarget", "single-installment payment target");
requireAbsent(app, "a.paymentStatus", "appointment-level payment state");

requireContains(details, "/api/admin/payments", "simple payment endpoint");
requireContains(details, "ÖDEME YAPILABİLECEK PLANLAR", "open plan payment list");
requireContains(details, 'label="Plan"', "payment plan selector");
requireContains(details, "Ödeme Tarihi", "payment date field");
requireContains(details, "dashboard:refresh-client", "persisted client refresh after finance writes");
requireContains(details, "requestId: createCorrelationId()", "stable payment request id");
requireContains(details, "'x-correlation-id': payForm.requestId", "payment idempotency header");
requireContains(details, "disabled={paymentSaving}", "duplicate payment submit guard");
requireAbsent(details, "paymentTypeOptions", "payment method selector");
requireAbsent(details, "ÖDEME TAKSİTLERİ", "installment UI");
requireAbsent(details, "Ödeme Türü", "payment type field");
requireAbsent(details, "appt.payment === 'Ödendi'", "appointment payment badge");
requireAbsent(details, "payment: 'Bekleniyor'", "new appointment payment placeholder");

requireContains(workspace, "/api/admin/dashboard-overview-v3", "permission-aware dashboard overview");
requireContains(moduleViews, "AppointmentCreateView", "new appointment view routing");
requireContains(moduleConfig, "id: 'yeni'", "new appointment navigation item");
requireAbsent(moduleConfig, "id: 'mesaj-sablonlari'", "unimplemented message template navigation");
requireAbsent(moduleConfig, "id: 'gonderim-gecmisi'", "unimplemented delivery history navigation");
requireAbsent(moduleConfig, "id: 'iletisim-izinleri'", "fake consent-setting navigation");
requireAbsent(moduleConfig, "id: 'gonderim-ayarlari'", "unimplemented PDF delivery navigation");
requireAbsent(moduleConfig, "id: 'bildirimler'", "unimplemented notification-setting navigation");
requireContains(financeView, "!entry.isReversed", "reversed payment filtering");

requireContains(paymentRoute, 'hasPermission(session.user.roles, "finance:manage")', "payment write permission");
requireContains(paymentRoute, "hasTrustedOrigin", "payment trusted-origin guard");
requireContains(paymentRoute, "recordSimplePlanPayment", "simple payment service call");
requireContains(paymentService, 'isolationLevel: "Serializable"', "payment serializable transaction");
requireContains(paymentService, "command.amountMinor > outstanding", "payment overage guard");
requireContains(paymentService, "installmentId: null", "installment-free payment ledger");
requireContains(paymentService, "paymentMethodId: null", "payment-method-free ledger");
requireContains(paymentService, "planId: plan.id", "plan-linked payment ledger");

requireContains(overview, "getAppointmentAccessWhere", "overview appointment scope");
requireContains(overview, "appointmentAccessWhere !== null", "overview appointment permission guard");
requireContains(overview, "access.finance", "overview finance permission guard");
requireContains(prerequisites, "getAppointmentAccessWhere", "appointment prerequisite scope");
requireContains(prerequisites, "guardianId: true", "child appointment guardian prerequisite");
requireContains(prerequisites, "Object.keys(accessWhere).length === 0", "practitioner scope boundary");
requireAbsent(prerequisites, "export async function POST", "unused appointment prerequisite write endpoint");
requireContains(operationRead, "isReversed: Boolean(item.reversedBy)", "finance reversal state");
requireContains(operationRead, '"REJECTED"', "appointment rejected history");
requireContains(operationRead, '"EXPIRED"', "appointment expired history");
requireContains(operationRead, 'readSettings(["PDF_RESOURCE_LIBRARY"])', "PDF metadata-only read");
requireAbsent(operationRead, "MESSAGE_TEMPLATES", "unimplemented message-template exposure");
requireAbsent(operationRead, "COMMUNICATION_CONSENTS", "fake communication-consent exposure");
requireAbsent(operationRead, "PDF_DELIVERY_SETTINGS", "unimplemented PDF delivery exposure");
requireContains(systemRead, "rolePermissions", "real role permission matrix");
requireContains(systemRead, "getAppointmentAccessWhere", "appointment report scope");
requireContains(systemRead, "where: appointmentAccessWhere", "therapist report data boundary");

console.log("Dashboard admin simplification verification passed.");
