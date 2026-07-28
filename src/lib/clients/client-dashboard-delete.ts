import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";
import { type RouteContext, forbidden, notFound, requireClientAccess } from "@/lib/clients/client-dashboard-shared";

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

  await database.$transaction(async (transaction) => {
    await transaction.client.update({
      data: { status: "INACTIVE" },
      where: { id: clientId },
    });
    await transaction.auditLog.create({
      data: {
        action: "client.deactivated",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { status: "INACTIVE" },
        beforeSummary: existing,
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_DEACTIVATED_FROM_DASHBOARD",
      },
    });
  });

  return NextResponse.json({ data: { id: clientId, status: "INACTIVE" } });
}
