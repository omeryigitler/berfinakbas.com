import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const contactLogSchema = z
  .object({
    channel: z.string().trim().min(1).max(40),
    occurredAt: z.string().datetime().optional(),
    result: z.string().trim().max(200).nullable().optional(),
    summary: z.string().trim().min(1).max(500),
  })
  .strict();

type RouteContext = { params: Promise<{ clientId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "clients:manage")
  ) {
    return NextResponse.json(
      { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
      { status: 403 },
    );
  }

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

  const parsed = contactLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "İletişim kaydı alanlarını kontrol edin." },
      { status: 400 },
    );
  }

  const { clientId } = await context.params;
  const database = getDatabase();
  const client = await database.client.findUnique({
    select: { id: true },
    where: { id: clientId },
  });
  if (!client) {
    return NextResponse.json(
      { code: "CLIENT_NOT_FOUND", error: "Danışan kaydı bulunamadı." },
      { status: 404 },
    );
  }

  const entry = await database.$transaction(async (transaction) => {
    const created = await transaction.clientContactLog.create({
      data: {
        channel: parsed.data.channel,
        clientId,
        createdByUserId: session.user.id,
        occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date(),
        result: parsed.data.result ?? null,
        summary: parsed.data.summary,
      },
      select: { channel: true, id: true, occurredAt: true, result: true, summary: true },
    });

    await transaction.auditLog.create({
      data: {
        action: "client.contact.logged",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { channel: created.channel },
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_CONTACT_LOGGED_FROM_DASHBOARD",
      },
    });

    return created;
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
