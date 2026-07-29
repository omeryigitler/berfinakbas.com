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
const documentRoute = await readFile(
  path.resolve("src/app/api/admin/clients/[clientId]/documents/route.ts"),
  "utf-8",
);
const completionRoute = await readFile(
  path.resolve("src/app/api/admin/appointments/[appointmentId]/complete/route.ts"),
  "utf-8",
);

requireContains(app, "/api/admin/clients-v2?take=100", "archive-aware client endpoint");
requireContains(app, "ARCHIVED: 'Arşivlenmiş'", "archived client mapping");
requireContains(app, "_completionPlanId", "completion plan mapping");
requireContains(app, "_detailLoaded: true", "real detail load marker");
requireAbsent(app, "Otomatik tanımlanan plan paketi", "fabricated plan fallback");
requireAbsent(app, "totalPlanAmount: c.paymentStatus", "fabricated payment fallback");
requireAbsent(app, "age: c.ageGroup === 'Çocuk' ? 10 : 35", "fabricated age fallback");
requireAbsent(app, "keep mock data", "silent mock fallback");

requireContains(details, "await requireSuccess(response)", "API response validation");
requireContains(details, "body: JSON.stringify({ planId: completionPlanId })", "explicit plan completion");
requireContains(details, "status: apiStatus, archived", "archive persistence");
requireContains(details, "type=\"file\"", "real document input");
requireAbsent(details, "2026-07-25", "fixed appointment date");
requireAbsent(details, "2026-10-20", "fixed plan end date");
requireAbsent(details, "keep the optimistic", "optimistic success fallback");
requireAbsent(details, "1.2 MB", "fabricated document size");

requireAbsent(documentRoute, "DATABASE_JSON", "JSON document storage");
requireAbsent(documentRoute, "toString(\"base64\")", "base64 document storage");
requireContains(documentRoute, '"content_bytes" = ${bytes}', "binary document storage");
requireContains(completionRoute, 'appointment.status !== "CONFIRMED"', "completion status guard");
requireContains(completionRoute, "PLAN_SELECTION_REQUIRED", "explicit plan selection guard");
requireContains(completionRoute, "appointment.startsAt > now", "future appointment guard");

console.log("Dashboard runtime data-integrity verification passed.");
