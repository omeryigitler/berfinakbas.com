import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { canManageAppointmentApi } from "@/lib/booking/appointment-api-access";
import { canAccessAppointmentCompletionPlans } from "@/lib/booking/appointment-completion-policy";
import {
  AppointmentCompletionPlanInvalidError,
  AppointmentCompletionPlanRequiredError,
  AppointmentNotStartedError,
} from "@/lib/booking/appointment-transition-errors";
import {
  AppointmentNotFoundError,
  AppointmentTransitionConflictError,
  transitionAppointment,
} from "@/lib/booking/appointment-transition-service";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const routeParamsSchema = z.object({ appointmentId: z.uuid() });
const completionSchema = z
  .object({ planId: z.uuid().nullable().optional() })
  .strict();

type RouteContext = { params: Promise<{ appointmentId: string }> };

function forbidden(message = "Bu işlem için yetkiniz yok.") {
  return NextResponse.json({ code: "FORBIDDEN", error: message }, { status: 403 });
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
  const canReadFinance = canAccessAppointmentCompletionPlans(session.user.roles);
  if (requestedPlanId && !canReadFinance) {
    return forbidden("Seans planı kullanmak için finans görüntüleme yetkisi gerekir.");
  }

  try {
    const transition = await transitionAppointment({
      actorUserId: session.user.id,
      appointmentId,
      completionPlanId: requestedPlanId,
      correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
      reasonCode: "ADMIN_MARKED_COMPLETED",
      toStatus: "COMPLETED",
    });

    return NextResponse.json({
      data: {
        consumedPlanId: transition.consumedPlanId,
        id: transition.appointmentId,
        replayed: transition.replayed,
        status: transition.toStatus,
      },
    });
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: 404 });
    }
    if (error instanceof AppointmentNotStartedError) {
      return NextResponse.json(
        { code: error.code, error: error.message, startsAt: error.startsAt.toISOString() },
        { status: 409 },
      );
    }
    if (error instanceof AppointmentCompletionPlanRequiredError) {
      if (!canReadFinance) {
        return forbidden("Bu randevuyu tamamlamak için finans yetkili bir kullanıcı plan seçmelidir.");
      }
      return NextResponse.json({ code: error.code, error: error.message }, { status: 409 });
    }
    if (error instanceof AppointmentCompletionPlanInvalidError) {
      if (!canReadFinance) return forbidden();
      return NextResponse.json({ code: error.code, error: error.message }, { status: 422 });
    }
    if (error instanceof AppointmentTransitionConflictError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: 409 });
    }
    throw error;
  }
}
