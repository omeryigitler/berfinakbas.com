import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const documentSchema = z
  .object({
    category: z.string().trim().min(1).max(40).default("Yüklenen Belge"),
    title: z.string().trim().min(1).max(160),
    url: z.string().trim().url().max(1000).nullable().optional(),
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

  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "Belge alanlarını kontrol edin." },
      { status: 400 },
    );
  }

  const { clientId } = await context.params;
  const database = getDatabase();
  const client = await database.client.findUnique({ select: { id: true }, where: { id: clientId } });
  if (!client) {
    return NextResponse.json(
      { code: "CLIENT_NOT_FOUND", error: "Danışan kaydı bulunamadı." },
      { status: 404 },
    );
  }

  const document = await database.$transaction(async (transaction) => {
    const created = await transaction.clientDocument.create({
      data: {
        category: parsed.data.category,
        clientId,
        createdByUserId: session.user.id,
        title: parsed.data.title,
        url: parsed.data.url ?? null,
      },
      select: { category: true, createdAt: true, id: true, title: true, url: true },
    });

    await transaction.auditLog.create({
      data: {
        action: "client.document.created",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { category: created.category, title: created.title },
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_DOCUMENT_CREATED_FROM_DASHBOARD",
      },
    });

    return created;
  });

  return NextResponse.json({ data: document }, { status: 201 });
}
