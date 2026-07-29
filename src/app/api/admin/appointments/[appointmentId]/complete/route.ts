import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { canManageAppointmentApi } from "@/lib/booking/appointment-api-access";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const routeParamsSchema = z.object({ appointmentId: z.uuid() });
const completionSchema = z
  .object({ planId: z.uuid().nullable().optional() })
  .strict();

type RouteContext = { params: Promise<{ appointmentId: string }> };

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();

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
  if (
    !(await canManageAppointmentApi({
      appointmentId,
      roles: session.user.roles,
      userId: session.user.id,
    }))
  ) {
    return forbidden();
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "İstek gövdesi okunamadı." },
      { status: 400 },
    );
  }
  let body: unknown = {};
  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { code: "INVALID_JSON", error: "İstek gövdesi geçerli JSON olmalıdır." },
        { status: 400 },
      );
    }
  }
  const parsedBody = completionSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "Tamamlama bilgilerini kontrol edin." },
      { status: 400 },
    );
  }

  const requestedPlanId = parsedBody.data.planId ?? null;
  const database = getDatabase();
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const idempotencyKey = `appointment-complete:${appointmentId}`;
  const now = new Date();

  const result = await database.$transaction(
    async (transaction) => {
      const appointment = await transaction.appointment.findUnique({
        select: {
          allocation: { select: { id: true, status: true } },
          clientId: true,
          id: true,
          startsAt: true,
          status: true,
        },
        where: { id: appointmentId },
      });
      if (!appointment) return { kind: "NOT_FOUND" as const };

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
      if (appointment.status !== "CONFIRMED") {
        return { kind: "INVALID_STATUS" as const, status: appointment.status };
      }
      if (appointment.startsAt > now) {
        return { kind: "NOT_STARTED" as const, startsAt: appointment.startsAt };
      }

      const plans = await transaction.clientPlan.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          sessionCreditEntries: { select: { quantityDelta: true } },
        },
        where: {
          clientId: appointment.clientId,
          status: "ACTIVE",
          validFrom: { lte: now },
          OR: [{ validUntil: null }, { validUntil: { gte: now } }],
        },
      });
      const eligiblePlans = plans
        .map((plan) => ({
          id: plan.id,
          name: plan.name,
          remainingSessions: plan.sessionCreditEntries.reduce(
            (total, entry) => total + entry.quantityDelta,
            0,
          ),
        }))
        .filter((plan) => plan.remainingSessions > 0);

      if (!requestedPlanId && eligiblePlans.length > 0) {
        return { kind: "PLAN_REQUIRED" as const, plans: eligiblePlans };
      }
      const selectedPlan = requestedPlanId
        ? eligiblePlans.find((plan) => plan.id === requestedPlanId) ?? null
        : null;
      if (requestedPlanId && !selectedPlan) {
        return { kind: "INVALID_PLAN" as const, plans: eligiblePlans };
      }

      await transaction.appointment.update({
        data: { status: "COMPLETED" },
        where: { id: appointmentId },
      });
      if (appointment.allocation?.status === "ACTIVE") {
        await transaction.bookingAllocation.update({
          data: { releasedAt: now, status: "RELEASED" },
          where: { id: appointment.allocation.id },
        });
      }

      if (selectedPlan) {
        await transaction.sessionCreditEntry.create({
          data: {
            actorUserId: session.user.id,
            appointmentId,
            idempotencyKey,
            planId: selectedPlan.id,
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
          note: selectedPlan
            ? `Seans tamamlandı ve ${selectedPlan.name} planından bir kullanım düşüldü.`
            : "Seans tamamlandı; kullanılabilir aktif plan bulunmadığı için kredi düşülmedi.",
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
            consumedPlanId: selectedPlan?.id ?? null,
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
        consumedPlanId: selectedPlan?.id ?? null,
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
        error: `Yalnız onaylanmış randevu tamamlanabilir. Mevcut durum: ${result.status}.`,
      },
      { status: 409 },
    );
  }
  if (result.kind === "NOT_STARTED") {
    return NextResponse.json(
      {
        code: "APPOINTMENT_NOT_STARTED",
        error: "Başlangıç zamanı gelmemiş bir randevu tamamlanamaz.",
        startsAt: result.startsAt.toISOString(),
      },
      { status: 409 },
    );
  }
  if (result.kind === "PLAN_REQUIRED") {
    return NextResponse.json(
      {
        code: "PLAN_SELECTION_REQUIRED",
        error: "Seans düşülecek aktif planı seçin.",
        plans: result.plans,
      },
      { status: 409 },
    );
  }
  if (result.kind === "INVALID_PLAN") {
    return NextResponse.json(
      {
        code: "INVALID_PLAN",
        error: "Seçilen plan bu danışana ait aktif ve kredili bir plan değil.",
        plans: result.plans,
      },
      { status: 422 },
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
