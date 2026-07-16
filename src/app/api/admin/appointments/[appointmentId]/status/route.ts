import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { BookingConsentGateError } from "@/domain/consent/booking-consent";
import { canManageAppointmentApi } from "@/lib/booking/appointment-api-access";
import {
  AppointmentNotFoundError,
  AppointmentTransitionConflictError,
  transitionAppointment,
  transitionAppointmentRequestSchema,
} from "@/lib/booking/appointment-transition-service";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const appointmentIdSchema = z.uuid();

type RouteContext = Readonly<{
  params: Promise<{ appointmentId: string }>;
}>;

function forbidden() {
  return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json({ error: "Güvenilmeyen istek kaynağı." }, { status: 403 });
  }

  const parsedAppointmentId = appointmentIdSchema.safeParse((await context.params).appointmentId);
  if (!parsedAppointmentId.success) {
    return NextResponse.json({ error: "Randevu kimliği geçersiz." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi geçerli JSON olmalıdır." }, { status: 400 });
  }
  const parsed = transitionAppointmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Randevu durum geçişi geçersiz.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (
    !(await canManageAppointmentApi({
      appointmentId: parsedAppointmentId.data,
      roles: session.user.roles,
      userId: session.user.id,
    }))
  )
    return forbidden();

  try {
    const transition = await transitionAppointment({
      ...parsed.data,
      actorUserId: session.user.id,
      appointmentId: parsedAppointmentId.data,
      correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
    });
    return NextResponse.json({ data: transition });
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof AppointmentTransitionConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof BookingConsentGateError) {
      return NextResponse.json(
        { code: error.code, error: error.message, issues: error.issues },
        { status: 422 },
      );
    }
    throw error;
  }
}
