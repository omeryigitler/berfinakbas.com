import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const updateClientSchema = z
  .object({
    birthYear: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
    email: z.string().trim().email().max(320).nullable().optional(),
    firstName: z.string().trim().min(1).max(120).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    preferredName: z.string().trim().max(120).nullable().optional(),
    status: z.enum(["PROSPECTIVE", "ACTIVE", "INACTIVE"]).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ clientId: string }> };

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

function notFound() {
  return NextResponse.json(
    { code: "CLIENT_NOT_FOUND", error: "Danışan kaydı bulunamadı." },
    { status: 404 },
  );
}

async function requireClientAccess(permission: "clients:read" | "clients:manage") {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, permission)
  ) {
    return null;
  }
  return session;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireClientAccess("clients:read");
  if (!session) return forbidden();

  const { clientId } = await context.params;
  const client = await getDatabase().client.findUnique({
    select: {
      appointments: {
        orderBy: { startsAt: "desc" },
        select: {
          durationMinutesSnapshot: true,
          endsAt: true,
          id: true,
          locationTypeSnapshot: true,
          practitioner: { select: { displayName: true } },
          publicReference: true,
          requestNote: true,
          serviceNameSnapshot: true,
          startsAt: true,
          status: true,
        },
        take: 20,
      },
      birthYear: true,
      createdAt: true,
      email: true,
      financeEntries: {
        orderBy: { occurredAt: "desc" },
        select: {
          amountMinor: true,
          currency: true,
          externalReference: true,
          id: true,
          note: true,
          occurredAt: true,
          paymentMethod: { select: { name: true } },
          plan: { select: { name: true } },
          type: true,
        },
        take: 20,
      },
      firstName: true,
      guardians: {
        orderBy: { isPrimary: "desc" },
        select: {
          guardian: {
            select: {
              email: true,
              firstName: true,
              id: true,
              lastName: true,
              phone: true,
            },
          },
          isPrimary: true,
          relationship: true,
        },
      },
      id: true,
      lastName: true,
      notes: {
        orderBy: { createdAt: "desc" },
        select: {
          category: true,
          createdAt: true,
          createdBy: { select: { name: true } },
          id: true,
          note: true,
        },
        take: 20,
      },
      phone: true,
      plans: {
        orderBy: { createdAt: "desc" },
        select: {
          currency: true,
          id: true,
          name: true,
          sessionCount: true,
          sessionDurationMinutes: true,
          status: true,
          totalAmountMinor: true,
          validFrom: true,
          validUntil: true,
        },
        take: 10,
      },
      preferredName: true,
      status: true,
      type: true,
      updatedAt: true,
    },
    where: { id: clientId },
  });

  if (!client) return notFound();

  const now = Date.now();
  const nextAppointment = [...client.appointments]
    .filter((appointment) => appointment.startsAt.getTime() >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] ?? null;
  const completedAppointments = client.appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;
  const score = Math.min(
    100,
    35 +
      (client.phone ? 15 : 0) +
      (client.email ? 15 : 0) +
      Math.min(completedAppointments * 6, 20) +
      Math.min(client.notes.length * 3, 15),
  );

  return NextResponse.json(
    {
      data: {
        ...client,
        financeEntries: client.financeEntries.map((entry) => ({
          ...entry,
          amountMinor: entry.amountMinor.toString(),
        })),
        nextAppointment,
        plans: client.plans.map((plan) => ({
          ...plan,
          totalAmountMinor: plan.totalAmountMinor.toString(),
        })),
        score,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireClientAccess("clients:manage");
  if (!session) return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json(
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", error: "İstek gövdesi geçerli JSON olmalıdır." },
      { status: 400 },
    );
  }

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "Güncellenecek danışan alanlarını kontrol edin." },
      { status: 400 },
    );
  }

  const { clientId } = await context.params;
  const database = getDatabase();
  const existing = await database.client.findUnique({
    select: {
      birthYear: true,
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      phone: true,
      preferredName: true,
      status: true,
    },
    where: { id: clientId },
  });
  if (!existing) return notFound();

  const updated = await database.$transaction(async (transaction) => {
    const record = await transaction.client.update({
      data: parsed.data,
      select: {
        birthYear: true,
        email: true,
        firstName: true,
        id: true,
        lastName: true,
        phone: true,
        preferredName: true,
        status: true,
        type: true,
        updatedAt: true,
      },
      where: { id: clientId },
    });

    await transaction.auditLog.create({
      data: {
        action: "client.updated",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: record,
        beforeSummary: existing,
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_UPDATED_FROM_DASHBOARD",
      },
    });

    return record;
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireClientAccess("clients:manage");
  if (!session) return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json(
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      { status: 403 },
    );
  }

  const { clientId } = await context.params;
  const database = getDatabase();
  const existing = await database.client.findUnique({
    select: { id: true, status: true },
    where: { id: clientId },
  });
  if (!existing) return notFound();

  await database.$transaction(async (transaction) => {
    await transaction.client.update({
      data: { status: "INACTIVE" },
      where: { id: clientId },
    });
    await transaction.auditLog.create({
      data: {
        action: "client.deactivated",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { status: "INACTIVE" },
        beforeSummary: existing,
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_DEACTIVATED_FROM_DASHBOARD",
      },
    });
  });

  return NextResponse.json({ data: { id: clientId, status: "INACTIVE" } });
}