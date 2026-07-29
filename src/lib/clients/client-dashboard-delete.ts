import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";
import {
  PROFILE_PREFIX,
  type RouteContext,
  asJsonRecord,
  forbidden,
  notFound,
  requireClientAccess,
} from "@/lib/clients/client-dashboard-shared";

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireClientAccess("clients:manage");
  if (!session) return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json(
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      { status: 403 },
    );
  }

  const { clientId } = await context.params;
  const database = getDatabase();
  const existing = await database.client.findUnique({
    select: { id: true, status: true },
    where: { id: clientId },
  });
  if (!existing) return notFound();

  const setting = await database.operationalSetting.findUnique({
    select: { value: true },
    where: { key: `${PROFILE_PREFIX}${clientId}` },
  });
  const currentProfile = asJsonRecord(setting?.value);
  if (currentProfile.archived === true) {
    return NextResponse.json({ data: { archived: true, id: clientId, replayed: true } });
  }

  const archivedAt = new Date().toISOString();
  await database.$transaction(async (transaction) => {
    await transaction.client.update({
      data: { status: "INACTIVE" },
      where: { id: clientId },
    });
    await transaction.operationalSetting.upsert({
      create: {
        key: `${PROFILE_PREFIX}${clientId}`,
        updatedByUserId: session.user.id,
        value: { ...currentProfile, archived: true, archivedAt },
      },
      update: {
        updatedByUserId: session.user.id,
        value: { ...currentProfile, archived: true, archivedAt },
      },
      where: { key: `${PROFILE_PREFIX}${clientId}` },
    });
    await transaction.auditLog.create({
      data: {
        action: "client.archived",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { archived: true, archivedAt, status: "INACTIVE" },
        beforeSummary: { archived: false, status: existing.status },
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_ARCHIVED_FROM_DASHBOARD",
      },
    });
  });

  return NextResponse.json({ data: { archived: true, id: clientId, replayed: false } });
}
