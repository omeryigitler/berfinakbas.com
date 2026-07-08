import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getAppointmentAccessWhere } from "@/lib/booking/appointment-api-access";
import { databaseAppointmentStatuses } from "@/lib/booking/appointment-transition-service";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const appointmentListQuerySchema = z
  .object({
    cursor: z.uuid().optional(),
    status: z.enum(databaseAppointmentStatuses).default("PENDING_REVIEW"),
    take: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

const appointmentCreateSchema = z
  .object({
    clientId: z.uuid(),
    durationMinutes: z.coerce.number().int().min(5).max(240),
    guardianId: z.uuid().nullable().optional(),
    locationType: z.enum(["SERVICE_DEFAULT", "IN_PERSON", "ONLINE", "HYBRID"]).nullable().optional(),
    practitionerId: z.uuid(),
    requestNote: z.string().trim().max(500).nullable().optional(),
    serviceId: z.uuid(),
    startsAt: z.string().trim().min(1),
  })
  .strict();

class AppointmentCreateError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppointmentCreateError";
    this.status = status;
  }
}

function forbidden() {
  return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function newPublicReference(): string {
  return `ADM-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();

  const accessWhere = getAppointmentAccessWhere({
    mode: "read",
    roles: session.user.roles,
    userId: session.user.id,
  });
  if (accessWhere === null) return forbidden();

  const parsed = appointmentListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Randevu listesi filtresi geçersiz.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const appointments = await getDatabase().appointment.findMany({
    ...(parsed.data.cursor ? { cursor: { id: parsed.data.cursor }, skip: 1 } : {}),
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: {
      client: { select: { firstName: true, lastName: true, type: true } },
      endsAt: true,
      id: true,
      locationTypeSnapshot: true,
      practitioner: { select: { displayName: true } },
      publicReference: true,
      serviceNameSnapshot: true,
      startsAt: true,
      status: true,
    },
    take: parsed.data.take + 1,
    where: { ...accessWhere, status: parsed.data.status },
  });
  const hasMore = appointments.length > parsed.data.take;
  const data = hasMore ? appointments.slice(0, parsed.data.take) : appointments;

  return NextResponse.json({
    data,
    pagination: { nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json({ error: "Güvenilmeyen istek kaynağı." }, { status: 403 });
  }

  const accessWhere = getAppointmentAccessWhere({
    mode: "manage",
    roles: session.user.roles,
    userId: session.user.id,
  });
  if (accessWhere === null) return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi geçerli JSON olmalıdır." }, { status: 400 });
  }

  const parsed = appointmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Randevu oluşturma bilgileri geçersiz.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Randevu başlangıç tarihi geçersiz." }, { status: 400 });
  }

  const now = new Date();
  if (startsAt < now) {
    return NextResponse.json({ error: "Geçmiş tarihli randevu oluşturulamaz." }, { status: 400 });
  }

  const database = getDatabase();
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));

  try {
    const appointment = await database.$transaction(async (transaction) => {
      const [client, practitioner, service] = await Promise.all([
        transaction.client.findUnique({
          select: {
            firstName: true,
            guardians: { select: { guardianId: true } },
            id: true,
            lastName: true,
            type: true,
          },
          where: { id: parsed.data.clientId },
        }),
        transaction.practitioner.findFirst({
          select: { id: true },
          where: {
            id: parsed.data.practitionerId,
            status: "ACTIVE",
            ...(Object.keys(accessWhere).length === 0 ? {} : { userId: session.user.id }),
          },
        }),
        transaction.service.findUnique({
          select: {
            defaultBufferAfterMinutes: true,
            defaultBufferBeforeMinutes: true,
            defaultDurationMinutes: true,
            id: true,
            locationType: true,
            name: true,
            status: true,
          },
          where: { id: parsed.data.serviceId },
        }),
      ]);

      if (!client) throw new AppointmentCreateError("Danışan bulunamadı.", 404);
      if (!practitioner) throw new AppointmentCreateError("Terapist bulunamadı veya yetkiniz yok.", 403);
      if (!service || service.status !== "ACTIVE") {
        throw new AppointmentCreateError("Aktif hizmet bulunamadı.", 404);
      }

      const guardianId = parsed.data.guardianId ?? null;
      if (client.type === "CHILD") {
        if (!guardianId) throw new AppointmentCreateError("Çocuk danışan için veli seçmelisiniz.");
        if (!client.guardians.some((guardian) => guardian.guardianId === guardianId)) {
          throw new AppointmentCreateError("Seçilen veli bu danışana bağlı değil.");
        }
      }

      const endsAt = addMinutes(startsAt, parsed.data.durationMinutes);
      const busyStartsAt = addMinutes(startsAt, -service.defaultBufferBeforeMinutes);
      const busyEndsAt = addMinutes(endsAt, service.defaultBufferAfterMinutes);
      const locationTypeSnapshot =
        parsed.data.locationType === "IN_PERSON" ||
        parsed.data.locationType === "ONLINE" ||
        parsed.data.locationType === "HYBRID"
          ? parsed.data.locationType
          : service.locationType;
      const conflict = await transaction.bookingAllocation.findFirst({
        select: { id: true },
        where: {
          busyEndsAt: { gt: busyStartsAt },
          busyStartsAt: { lt: busyEndsAt },
          practitionerId: practitioner.id,
          status: "ACTIVE",
        },
      });

      if (conflict) {
        throw new AppointmentCreateError("Bu terapist için seçilen saatte aktif randevu/blok var.", 409);
      }

      const created = await transaction.appointment.create({
        data: {
          approvedAt: now,
          approvedByUserId: session.user.id,
          bufferAfterMinutesSnapshot: service.defaultBufferAfterMinutes,
          bufferBeforeMinutesSnapshot: service.defaultBufferBeforeMinutes,
          busyEndsAt,
          busyStartsAt,
          clientId: client.id,
          durationMinutesSnapshot: parsed.data.durationMinutes,
          endsAt,
          guardianId: client.type === "CHILD" ? guardianId : null,
          locationTypeSnapshot,
          policySnapshot: {
            createdBy: "admin",
            serviceId: service.id,
            source: "admin-create-flow",
          },
          practitionerId: practitioner.id,
          publicReference: newPublicReference(),
          requestNote: parsed.data.requestNote ?? null,
          serviceId: service.id,
          serviceNameSnapshot: service.name,
          source: "ADMIN",
          startsAt,
          status: "CONFIRMED",
        },
        select: { id: true, publicReference: true },
      });

      await transaction.bookingAllocation.create({
        data: {
          appointmentId: created.id,
          busyEndsAt,
          busyStartsAt,
          practitionerId: practitioner.id,
          status: "ACTIVE",
        },
      });

      await transaction.appointmentStatusLog.create({
        data: {
          actorType: "USER",
          actorUserId: session.user.id,
          appointmentId: created.id,
          fromStatus: null,
          note: parsed.data.requestNote ?? null,
          reasonCode: "ADMIN_CREATED",
          toStatus: "CONFIRMED",
        },
      });

      await transaction.auditLog.create({
        data: {
          action: "appointment.created",
          actorType: "USER",
          actorUserId: session.user.id,
          afterSummary: {
            clientId: client.id,
            practitionerId: practitioner.id,
            publicReference: created.publicReference,
            status: "CONFIRMED",
          },
          correlationId,
          entityId: created.id,
          entityType: "APPOINTMENT",
          reason: "ADMIN_CREATED",
        },
      });

      return created;
    });

    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof AppointmentCreateError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
