import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { canManageAppointmentApi } from "@/lib/booking/appointment-api-access";
import { canAccessAppointmentCompletionPlans } from "@/lib/booking/appointment-completion-policy";
import { getDatabase } from "@/lib/db";

type RouteContext = { params: Promise<{ appointmentId: string }> };

const appointmentIdSchema = z.uuid();

function forbidden(message = "Bu işlem için yetkiniz yok.") {
  return NextResponse.json({ code: "FORBIDDEN", error: message }, { status: 403 });
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();
  if (!canAccessAppointmentCompletionPlans(session.user.roles)) {
    return forbidden("Seans planlarını görüntülemek için finans yetkisi gerekir.");
  }

  const parsedId = appointmentIdSchema.safeParse((await context.params).appointmentId);
  if (!parsedId.success) {
    return NextResponse.json(
      { code: "INVALID_APPOINTMENT_ID", error: "Randevu kimliği geçersiz." },
      { status: 400 },
    );
  }

  if (
    !(await canManageAppointmentApi({
      appointmentId: parsedId.data,
      roles: session.user.roles,
      userId: session.user.id,
    }))
  ) {
    return forbidden();
  }

  const now = new Date();
  const appointment = await getDatabase().appointment.findUnique({
    select: {
      client: {
        select: {
          plans: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              sessionCreditEntries: { select: { quantityDelta: true } },
            },
            where: {
              status: "ACTIVE",
              validFrom: { lte: now },
              OR: [{ validUntil: null }, { validUntil: { gte: now } }],
            },
          },
        },
      },
      id: true,
      startsAt: true,
      status: true,
    },
    where: { id: parsedId.data },
  });

  if (!appointment) {
    return NextResponse.json(
      { code: "APPOINTMENT_NOT_FOUND", error: "Randevu bulunamadı." },
      { status: 404 },
    );
  }

  const plans = appointment.client.plans
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      remainingSessions: plan.sessionCreditEntries.reduce(
        (total, entry) => total + entry.quantityDelta,
        0,
      ),
    }))
    .filter((plan) => plan.remainingSessions > 0);

  return NextResponse.json(
    {
      data: {
        appointmentStatus: appointment.status,
        plans,
        startsAt: appointment.startsAt,
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
