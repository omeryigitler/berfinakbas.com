import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { canManageAppointmentApi } from "@/lib/booking/appointment-api-access";
import {
  duplicateReviewRequestSchema,
  DuplicateReviewConflictError,
  DuplicateReviewNotFoundError,
  resolveAppointmentDuplicateReview,
} from "@/lib/clients/appointment-duplicate-review-service";
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

  const appointmentId = appointmentIdSchema.safeParse((await context.params).appointmentId);
  if (!appointmentId.success) {
    return NextResponse.json({ error: "Randevu kimliği geçersiz." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi geçerli JSON olmalıdır." }, { status: 400 });
  }
  const parsed = duplicateReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Mükerrer kayıt inceleme kararı geçersiz.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (
    !(await canManageAppointmentApi({
      appointmentId: appointmentId.data,
      roles: session.user.roles,
      userId: session.user.id,
    }))
  ) {
    return forbidden();
  }

  try {
    const resolution = await resolveAppointmentDuplicateReview({
      ...parsed.data,
      actorUserId: session.user.id,
      appointmentId: appointmentId.data,
      correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
    });
    return NextResponse.json({ data: resolution });
  } catch (error) {
    if (error instanceof DuplicateReviewNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof DuplicateReviewConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
