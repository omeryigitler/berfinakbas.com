import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const routeParamsSchema = z.object({ appointmentId: z.uuid() });
const COMPLETABLE_STATUSES = new Set([
  "REQUESTED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "RESCHEDULE_PROPOSED",
]);

type RouteContext = { params: Promise<{ appointmentId: string }> };

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "appointments:manage")
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

  const parsedParams = routeParamsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { code: "INVALID_APPOINTMENT_ID", error: "Randevu kimliği geçersiz." },
      { status: 400 },
    );
  }

  const appointmentId = parsedParams.data.appointmentId;
  const database = getDatabase();
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const idempotencyKey = `appointment-complete:${appointmentId}`;

  const result = await database.$transaction(
    async (transaction) => {
      const appointment = await transaction.appointment.findUnique({
        select: {
          allocation: { select: { id: true, status: true } },
          clientId: true,
          id: true,
          status: true,
        },
        where: { id: appointmentId },
      });
      if (!appointment) {
        return { kind: "NOT_FOUND" as const };
      }
      if (appointment.status === "COMPLETED") {
        const credit = await transaction.sessionCreditEntry.findUnique({
          select: { planId: true },
          where: { idempotencyKey },
        });
        return {
          kind: "OK" as const,
          consumedPlanId: credit?.planId ?? null,
          replayed: true,
        };
      }
      if (!COMPLETABLE_STATUSES.has(appointment.status)) {
        return { kind: "INVALID_STATUS" as const, status: appointment.status };
      }

      const plans = await transaction.clientPlan.findMany({
        orderBy: [{ validFrom: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          sessionCreditEntries: { select: { quantityDelta: true } },
        },
        where: { clientId: appointment.clientId, status: "ACTIVE" },
      });
      const plan = plans.find(
        (candidate) =>
          candidate.sessionCreditEntries.reduce(
            (total, entry) => total + entry.quantityDelta,
            0,
          ) > 0,
      );

      await transaction.appointment.update({
        data: { status: "COMPLETED" },
        where: { id: appointmentId },
      });
      if (appointment.allocation?.status === "ACTIVE") {
        await transaction.bookingAllocation.update({
          data: { releasedAt: new Date(), status: "RELEASED" },
          where: { id: appointment.allocation.id },
        });
      }

      if (plan) {
        await transaction.sessionCreditEntry.create({
          data: {
            actorUserId: session.user.id,
            appointmentId,
            idempotencyKey,
            planId: plan.id,
            quantityDelta: -1,
            reasonCode: "APPOINTMENT_COMPLETED",
            type: "CONSUME",
          },
        });
      }

      await transaction.appointmentStatusLog.create({
        data: {
          actorType: "USER",
          actorUserId: session.user.id,
          appointmentId,
          fromStatus: appointment.status,
          note: plan
            ? "Seans tamamlandı ve plandan bir kullanım düşüldü."
            : "Seans tamamlandı; kullanılabilir aktif plan bulunamadı.",
          reasonCode: "ADMIN_MARKED_COMPLETED",
          toStatus: "COMPLETED",
        },
      });
      await transaction.auditLog.create({
        data: {
          action: "appointment.completed",
          actorType: "USER",
          actorUserId: session.user.id,
          afterSummary: {
            consumedPlanId: plan?.id ?? null,
            status: "COMPLETED",
          },
          beforeSummary: { status: appointment.status },
          correlationId,
          entityId: appointmentId,
          entityType: "APPOINTMENT",
          reason: "ADMIN_MARKED_COMPLETED",
        },
      });

      return {
        kind: "OK" as const,
        consumedPlanId: plan?.id ?? null,
        replayed: false,
      };
    },
    { isolationLevel: "Serializable" },
  );

  if (result.kind === "NOT_FOUND") {
    return NextResponse.json(
      { code: "APPOINTMENT_NOT_FOUND", error: "Randevu bulunamadı." },
      { status: 404 },
    );
  }
  if (result.kind === "INVALID_STATUS") {
    return NextResponse.json(
      {
        code: "INVALID_APPOINTMENT_STATUS",
        error: `Bu randevu ${result.status} durumundayken tamamlanamaz.`,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    data: {
      consumedPlanId: result.consumedPlanId,
      id: appointmentId,
      replayed: result.replayed,
      status: "COMPLETED",
    },
  });
}
