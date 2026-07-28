import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const DOCUMENT_PREFIX = "client-document:";

type RouteContext = { params: Promise<{ clientId: string; documentId: string }> };
type JsonRecord = Record<string, any>;

function asJsonRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

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
  const database = getDatabase();
  const document = await database.clientDocument.findFirst({
    select: { id: true, title: true, url: true },
    where: { clientId, id: documentId },
  });
  if (!document) {
    return NextResponse.json(
      { code: "DOCUMENT_NOT_FOUND", error: "Belge bulunamadı." },
      { status: 404 },
    );
  }

  const setting = await database.operationalSetting.findUnique({
    select: { value: true },
    where: { key: `${DOCUMENT_PREFIX}${documentId}` },
  });
  const metadata = asJsonRecord(setting?.value);
  if (typeof metadata.archivedAt === "string" && metadata.archivedAt) {
    return NextResponse.json(
      { code: "DOCUMENT_ARCHIVED", error: "Belge arşivlenmiş." },
      { status: 410 },
    );
  }

  if (typeof metadata.base64 === "string") {
    const bytes = Buffer.from(metadata.base64, "base64");
    const mimeType =
      typeof metadata.mimeType === "string" && metadata.mimeType
        ? metadata.mimeType
        : "application/octet-stream";
    const fileName =
      typeof metadata.fileName === "string" && metadata.fileName
        ? metadata.fileName
        : document.title;
    const download = new URL(request.url).searchParams.get("download") === "1";
    const body = new Uint8Array(bytes.byteLength);
    body.set(bytes);
    return new NextResponse(body.buffer, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": contentDisposition(fileName, download),
        "Content-Length": String(bytes.byteLength),
        "Content-Type": mimeType,
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
  const database = getDatabase();
  const document = await database.clientDocument.findFirst({
    select: { id: true, title: true },
    where: { clientId, id: documentId },
  });
  if (!document) {
    return NextResponse.json(
      { code: "DOCUMENT_NOT_FOUND", error: "Belge bulunamadı." },
      { status: 404 },
    );
  }

  const key = `${DOCUMENT_PREFIX}${documentId}`;
  const existingSetting = await database.operationalSetting.findUnique({
    select: { value: true },
    where: { key },
  });
  const metadata = asJsonRecord(existingSetting?.value);
  const archivedAt = new Date().toISOString();

  await database.$transaction(async (transaction) => {
    await transaction.operationalSetting.upsert({
      create: {
        key,
        updatedByUserId: session.user.id,
        value: { archivedAt, storage: "EXTERNAL_OR_METADATA_ONLY" },
      },
      update: {
        updatedByUserId: session.user.id,
        value: { ...metadata, archivedAt },
      },
      where: { key },
    });
    await transaction.auditLog.create({
      data: {
        action: "client.document.archived",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { archivedAt, documentId, title: document.title },
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_DOCUMENT_ARCHIVED_FROM_DASHBOARD",
      },
    });
  });

  return NextResponse.json({ data: { archivedAt, id: documentId } });
}
