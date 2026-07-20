import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { isReferenceClientId } from "@/domain/clients/reference-clients";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

class ReferenceClientHasLinkedDataError extends Error {}

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "clients:manage")
  ) {
    return forbidden();
  }

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json(
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      { status: 403 },
    );
  }

  const { clientId } = await params;
  if (!isReferenceClientId(clientId)) {
    return NextResponse.json(
      {
        code: "REFERENCE_CLIENT_REQUIRED",
        error: "Yalnızca referans danışan kayıtları kalıcı olarak silinebilir.",
      },
      { status: 409 },
    );
  }

  const database = getDatabase();
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));

  try {
    const deleted = await database.$transaction(
      async (transaction) => {
        const client = await transaction.client.findUnique({
          select: {
            _count: {
              select: {
                appointments: true,
                consents: true,
                duplicateReviewTargets: true,
                financeEntries: true,
                notes: true,
                plans: true,
              },
            },
            id: true,
          },
          where: { id: clientId },
        });
        if (!client) return false;

        const linkedCount =
          client._count.appointments +
          client._count.consents +
          client._count.duplicateReviewTargets +
          client._count.financeEntries +
          client._count.notes +
          client._count.plans;
        if (linkedCount > 0) throw new ReferenceClientHasLinkedDataError();

        const guardianLinks = await transaction.clientGuardian.findMany({
          select: { guardianId: true },
          where: { clientId },
        });

        await transaction.clientGuardian.deleteMany({ where: { clientId } });
        await transaction.client.delete({ where: { id: clientId } });

        for (const { guardianId } of guardianLinks) {
          const guardian = await transaction.guardian.findUnique({
            select: {
              _count: {
                select: {
                  appointments: true,
                  clients: true,
                  grantedConsents: true,
                  subjectConsents: true,
                },
              },
            },
            where: { id: guardianId },
          });
          if (
            guardian &&
            guardian._count.appointments === 0 &&
            guardian._count.clients === 0 &&
            guardian._count.grantedConsents === 0 &&
            guardian._count.subjectConsents === 0
          ) {
            await transaction.guardian.delete({ where: { id: guardianId } });
          }
        }

        await transaction.auditLog.create({
          data: {
            action: "client.reference_deleted",
            actorType: "USER",
            actorUserId: session.user.id,
            beforeSummary: { referenceRecord: true },
            correlationId,
            entityId: clientId,
            entityType: "CLIENT",
            reason: "REFERENCE_CLIENT_PERMANENT_DELETE",
          },
        });

        return true;
      },
      { isolationLevel: "Serializable" },
    );

    if (!deleted) {
      return NextResponse.json(
        { code: "CLIENT_NOT_FOUND", error: "Danışan kaydı bulunamadı." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: { id: clientId }, deleted: true });
  } catch (error) {
    if (error instanceof ReferenceClientHasLinkedDataError) {
      return NextResponse.json(
        {
          code: "REFERENCE_CLIENT_HAS_LINKED_DATA",
          error: "Bu referans danışana işlem kaydı bağlanmış. Önce bağlı kayıtları kaldırın.",
        },
        { status: 409 },
      );
    }
    throw error;
  }
}
