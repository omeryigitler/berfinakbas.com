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
const details = await readFile(
  path.join(dashboardRoot, "components/ClientDetailsHub.tsx"),
  "utf-8",
);
const myWork = await readFile(path.join(dashboardRoot, "components/MyWorkPanel.tsx"), "utf-8");
const documentRoute = await readFile(
  path.resolve("src/app/api/admin/clients/[clientId]/documents/route.ts"),
  "utf-8",
);
const uploadValidation = await readFile(
  path.resolve("src/lib/files/document-upload-validation.ts"),
  "utf-8",
);
const completionRoute = await readFile(
  path.resolve("src/app/api/admin/appointments/[appointmentId]/complete/route.ts"),
  "utf-8",
);
const completionOptionsRoute = await readFile(
  path.resolve("src/app/api/admin/appointments/[appointmentId]/completion-options/route.ts"),
  "utf-8",
);
const transitionService = await readFile(
  path.resolve("src/lib/booking/appointment-transition-service.ts"),
  "utf-8",
);
const clientRead = await readFile(
  path.resolve("src/lib/clients/client-dashboard-read.ts"),
  "utf-8",
);
const clientListRead = await readFile(
  path.resolve("src/lib/clients/client-list-read.ts"),
  "utf-8",
);

requireContains(app, "/api/admin/clients-v2?take=100", "archive-aware client endpoint");
requireContains(app, "ARCHIVED: 'Arşivlenmiş'", "archived client mapping");
requireContains(
  app,
  "guardianPhone: isChild ? newlyCreated.parentPhone",
  "separate guardian phone mapping",
);
requireContains(app, "_detailLoaded: true", "real detail load marker");
requireAbsent(app, "_completionPlanId", "automatic completion plan selection");
requireAbsent(app, "Otomatik tanımlanan plan paketi", "fabricated plan fallback");
requireAbsent(app, "totalPlanAmount: c.paymentStatus", "fabricated payment fallback");
requireAbsent(app, "age: c.ageGroup === 'Çocuk' ? 10 : 35", "fabricated age fallback");
requireAbsent(app, "keep mock data", "silent mock fallback");

requireContains(myWork, "parentPhone?: string", "guardian phone type");
requireContains(myWork, "Veli Telefonu *", "guardian phone input");
requireContains(myWork, "setRealServiceOptions([])", "empty service failure state");
requireAbsent(myWork, "Diyet ve Beslenme", "diet service fallback");
requireAbsent(myWork, "Yaşam Koçluğu", "coaching service fallback");
requireAbsent(myWork, "Psikoterapi", "psychotherapy service fallback");
requireAbsent(myWork, "Kariyer ve Yönetici Mentorluğu", "mentoring service fallback");

requireContains(details, "await requireSuccess(response)", "API response validation");
requireContains(details, "/completion-options", "authorized completion options request");
requireContains(details, "Seans Düşülecek Plan", "completion plan selector");
requireContains(
  details,
  "Seans düşülecek planı seçin.",
  "explicit completion plan validation",
);
requireContains(details, "status: apiStatus, archived", "archive persistence");
requireContains(details, "type=\"file\"", "real document input");
requireAbsent(details, "_completionPlanId", "hidden automatic plan choice");
requireAbsent(details, "2026-07-25", "fixed appointment date");
requireAbsent(details, "2026-10-20", "fixed plan end date");
requireAbsent(details, "keep the optimistic", "optimistic success fallback");
requireAbsent(details, "1.2 MB", "fabricated document size");

requireContains(documentRoute, "validateDocumentUpload", "document content validation");
requireAbsent(documentRoute, "ALLOWED_MIME_TYPES", "declared-MIME-only validation");
requireAbsent(documentRoute, "DATABASE_JSON", "JSON document storage");
requireAbsent(documentRoute, "toString(\"base64\")", "base64 document storage");
requireContains(documentRoute, '"content_bytes" = ${bytes}', "binary document storage");
requireContains(uploadValidation, "if (!declaredMimeType)", "required MIME declaration");
requireContains(
  uploadValidation,
  "readCompoundDocumentStreamNames",
  "compound Word stream validation",
);
requireContains(
  uploadValidation,
  "readZipCentralDirectoryNames",
  "DOCX central-directory validation",
);
requireContains(uploadValidation, "application/octet-stream", "octet-stream rejection");

requireContains(completionRoute, "canManageAppointmentApi", "practitioner appointment scope guard");
requireContains(
  completionRoute,
  "canAccessAppointmentCompletionPlans",
  "completion finance policy",
);
requireContains(completionRoute, "transitionAppointment({", "central completion transition");
requireAbsent(completionRoute, ".$transaction(", "parallel completion transaction");
requireAbsent(completionRoute, "appointment-complete:", "legacy completion idempotency key");
requireContains(
  completionOptionsRoute,
  "canManageAppointmentApi",
  "completion options scope guard",
);
requireContains(
  completionOptionsRoute,
  "canAccessAppointmentCompletionPlans",
  "completion options finance authorization",
);
requireContains(transitionService, "completionPlanId", "central completion plan selection");
requireContains(
  transitionService,
  "appointment:${appointmentId}:session-consume",
  "central completion idempotency key",
);
requireContains(
  transitionService,
  "enqueueAppointmentStatusChangedEvent",
  "completion integration outbox",
);
requireContains(
  clientRead,
  'hasPermission(session.user.roles, "finance:read")',
  "finance read authorization",
);
requireContains(clientRead, "financeDataPromise", "conditional finance query");
requireContains(clientRead, "financeAccess: canReadFinance", "finance access response marker");
requireContains(
  clientRead,
  "plans: canReadFinance ? plans : []",
  "finance plan response filtering",
);
requireContains(
  clientListRead,
  'hasPermission(session.user.roles, "finance:read")',
  "client-list finance authorization",
);
requireContains(clientListRead, "if (!canReadFinance)", "client-list conditional finance query");
requireContains(clientListRead, "financeAccess: false", "client-list masked finance response");
requireContains(
  clientListRead,
  "select: { ...baseClientSelect, appointments }",
  "client-list finance-free projection",
);

console.log("Dashboard runtime data-integrity and authorization verification passed.");
