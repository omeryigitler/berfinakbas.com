import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const DOCUMENT_PREFIX = "client-document:";
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);

const linkDocumentSchema = z
  .object({
    category: z.string().trim().min(1).max(40).default("Yüklenen Belge"),
    title: z.string().trim().min(1).max(160),
    url: z.string().trim().url().max(1000),
  })
  .strict();

type RouteContext = { params: Promise<{ clientId: string }> };

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

function safeFileName(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f/\\]/g, "_").slice(0, 160) || "belge";
}

export async function POST(request: Request, context: RouteContext) {
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

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  let title: string;
  let category: string;
  let url: string;
  let storedPayload:
    | {
        archivedAt: null;
        base64: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        storage: "DATABASE_JSON";
      }
    | null = null;

  if (contentType.startsWith("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { code: "INVALID_MULTIPART", error: "Belge yükleme verisi okunamadı." },
        { status: 400 },
      );
    }

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { code: "FILE_REQUIRED", error: "Yüklenecek belgeyi seçin." },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { code: "FILE_TOO_LARGE", error: "Belge boyutu en fazla 4 MB olabilir." },
        { status: 413 },
      );
    }
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { code: "UNSUPPORTED_FILE_TYPE", error: "Bu belge türü desteklenmiyor." },
        { status: 415 },
      );
    }

    title = String(form.get("title") ?? file.name).trim().slice(0, 160);
    category = String(form.get("category") ?? "Yüklenen Belge").trim().slice(0, 40);
    if (!title || !category) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", error: "Belge adı ve kategorisi zorunludur." },
        { status: 400 },
      );
    }

    const documentId = randomUUID();
    url = `/api/admin/clients/${clientId}/documents/${documentId}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    storedPayload = {
      archivedAt: null,
      base64: bytes.toString("base64"),
      fileName: safeFileName(file.name),
      mimeType,
      sizeBytes: file.size,
      storage: "DATABASE_JSON",
    };

    const document = await database.$transaction(async (transaction) => {
      const created = await transaction.clientDocument.create({
        data: {
          category,
          clientId,
          createdByUserId: session.user.id,
          id: documentId,
          title,
          url,
        },
        select: { category: true, createdAt: true, id: true, title: true, url: true },
      });
      await transaction.operationalSetting.create({
        data: {
          key: `${DOCUMENT_PREFIX}${documentId}`,
          updatedByUserId: session.user.id,
          value: storedPayload!,
        },
      });
      await transaction.auditLog.create({
        data: {
          action: "client.document.created",
          actorType: "USER",
          actorUserId: session.user.id,
          afterSummary: {
            category: created.category,
            mimeType,
            sizeBytes: file.size,
            title: created.title,
          },
          correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
          entityId: clientId,
          entityType: "CLIENT",
          reason: "CLIENT_DOCUMENT_UPLOADED_FROM_DASHBOARD",
        },
      });
      return created;
    });

    return NextResponse.json(
      {
        data: {
          ...document,
          downloadUrl: document.url,
          mimeType,
          sizeBytes: file.size,
        },
      },
      { status: 201 },
    );
  }

  if (contentType.split(";", 1)[0]?.trim() !== "application/json") {
    return NextResponse.json(
      { code: "UNSUPPORTED_MEDIA_TYPE", error: "Belge veya geçerli bir bağlantı gönderin." },
      { status: 415 },
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
  const parsed = linkDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "Belge bağlantısı alanlarını kontrol edin." },
      { status: 400 },
    );
  }
  ({ title, category, url } = parsed.data);

  const document = await database.$transaction(async (transaction) => {
    const created = await transaction.clientDocument.create({
      data: {
        category,
        clientId,
        createdByUserId: session.user.id,
        title,
        url,
      },
      select: { category: true, createdAt: true, id: true, title: true, url: true },
    });
    await transaction.auditLog.create({
      data: {
        action: "client.document.created",
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: { category: created.category, title: created.title, url: created.url },
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: "CLIENT_DOCUMENT_LINKED_FROM_DASHBOARD",
      },
    });
    return created;
  });

  return NextResponse.json(
    { data: { ...document, downloadUrl: document.url, mimeType: null, sizeBytes: null } },
    { status: 201 },
  );
}
