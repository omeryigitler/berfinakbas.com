import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getAppointmentAccessWhere } from "@/lib/booking/appointment-api-access";
import { databaseAppointmentStatuses } from "@/lib/booking/appointment-transition-service";
import { getDatabase } from "@/lib/db";

const appointmentListQuerySchema = z
  .object({
    cursor: z.uuid().optional(),
    status: z.enum(databaseAppointmentStatuses).default("PENDING_REVIEW"),
    take: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

function forbidden() {
  return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
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
