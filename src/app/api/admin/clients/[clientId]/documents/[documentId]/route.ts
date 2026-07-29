import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { findStoredClientDocument } from "@/lib/clients/client-document-store";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

type RouteContext = { params: Promise<{ clientId: string; documentId: string }> };

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

function contentDisposition(fileName: string, download: boolean): string {
  const safeAscii =
    fileName
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\]/g, "_")
      .slice(0, 160) || "belge";
  return `${download ? "attachment" : "inline"}; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "clients:read")
  ) {
    return forbidden();
  }

  const { clientId, documentId } = await context.params;
  const document = await findStoredClientDocument(clientId, documentId);
  if (!document) {
    return NextResponse.json(
      { code: "DOCUMENT_NOT_FOUND", error: "Belge bulunamadı." },
      { status: 404 },
    );
  }
  if (document.archivedAt) {
    return NextResponse.json(
      { code: "DOCUMENT_ARCHIVED", error: "Belge arşivlenmiş." },
      { status: 410 },
    );
  }

  if (document.contentBytes) {
    const bytes = new Uint8Array(document.contentBytes.byteLength);
    bytes.set(document.contentBytes);
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(bytes.buffer, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": contentDisposition(document.fileName ?? document.title, download),
        "Content-Length": String(bytes.byteLength),
        "Content-Type": document.mimeType ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (document.url && /^https?:\/\//i.test(document.url)) {
    return NextResponse.redirect(document.url);
  }

  return NextResponse.json(
    { code: "DOCUMENT_CONTENT_MISSING", error: "Belge içeriği bulunamadı." },
    { status: 404 },
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "clients:manage")
  ) {
    return forbidden();
  }

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json(
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      { status: 403 },
    );
  }

  const { clientId, documentId } = await context.params;
  const document = await findStoredClientDocument(clientId, documentId);
  if (!document) {
    return NextResponse.json(
      { code: "DOCUMENT_NOT_FOUND", error: "Belge bulunamadı." },
      { status: 404 },
    );
  }
  if (document.archivedAt) {
    return NextResponse.json({
      data: { archivedAt: document.archivedAt.toISOString(), id: documentId, replayed: true },
    });
  }

  const archivedAt = new Date();
  const database = getDatabase();
  await database.$transaction(async (transaction) => {
    const changed = await transaction.$executeRaw`
      UPDATE "client_documents"
      SET "archived_at" = ${archivedAt}
      WHERE "id" = ${documentId}::uuid
        AND "client_id" = ${clientId}::uuid
        AND "archived_at" IS NULL
    `;
    if (changed !== 1) throw new Error("Belge arşivlenemedi.");

    await transaction.auditLog.create({
      data: {
        action: "client.document.archived",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { archivedAt: archivedAt.toISOString(), documentId, title: document.title },
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_DOCUMENT_ARCHIVED_FROM_DASHBOARD",
      },
    });
  });

  return NextResponse.json({
    data: { archivedAt: archivedAt.toISOString(), id: documentId, replayed: false },
  });
}
