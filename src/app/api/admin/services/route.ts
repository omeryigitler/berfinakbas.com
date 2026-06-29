import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { serviceConfigSchema } from "@/domain/services/service-config";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

function forbidden() {
  return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
}

export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "services:read")
  )
    return forbidden();

  const services = await getDatabase().service.findMany({
    include: { policies: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: services });
}

export async function POST(request: Request) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "services:manage")
  )
    return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json({ error: "Güvenilmeyen istek kaynağı." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi geçerli JSON olmalıdır." }, { status: 400 });
  }

  const parsed = serviceConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Hizmet ayarları geçersiz.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const database = getDatabase();

  const service = await database.$transaction(async (transaction) => {
    const createdService = await transaction.service.create({
      data: {
        approvalMode: input.approvalMode,
        defaultBufferAfterMinutes: input.bufferAfterMinutes,
        defaultBufferBeforeMinutes: input.bufferBeforeMinutes,
        defaultDurationMinutes: input.durationMinutes,
        locationType: input.locationType,
        name: input.name,
        publicDescription: input.publicDescription,
        publicVisible: input.publicVisible,
        slug: input.slug,
        sortOrder: input.sortOrder,
        status: input.status,
      },
    });

    await transaction.servicePolicy.create({
      data: {
        bookingMaxAdvanceDays: input.policy.bookingMaxAdvanceDays,
        bookingMinNoticeMinutes: input.policy.bookingMinNoticeMinutes,
        cancellationWindowMinutes: input.policy.cancellationWindowMinutes,
        createdByUserId: session.user.id,
        effectiveFrom: new Date(),
        maxDailyAppointments: input.policy.maxDailyAppointments,
        rescheduleWindowMinutes: input.policy.rescheduleWindowMinutes,
        serviceId: createdService.id,
      },
    });

    await transaction.auditLog.create({
      data: {
        action: "service.created",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: {
          durationMinutes: input.durationMinutes,
          locationType: input.locationType,
          name: input.name,
          publicVisible: input.publicVisible,
          status: input.status,
        },
        correlationId,
        entityId: createdService.id,
        entityType: "SERVICE",
        reason: input.reason,
      },
    });

    return createdService;
  });

  return NextResponse.json({ data: service }, { status: 201 });
}
