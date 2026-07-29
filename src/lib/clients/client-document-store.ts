import { getDatabase } from "@/lib/db";

export type ClientDocumentListRow = {
  archivedAt: Date | null;
  category: string;
  createdAt: Date;
  fileName: string | null;
  hasContent: boolean;
  id: string;
  mimeType: string | null;
  sizeBytes: number | null;
  title: string;
  url: string | null;
};

export type ClientDocumentContentRow = ClientDocumentListRow & {
  contentBytes: Uint8Array | null;
};

export async function listStoredClientDocuments(
  clientId: string,
): Promise<ClientDocumentListRow[]> {
  return getDatabase().$queryRaw<ClientDocumentListRow[]>`
    SELECT
      "archived_at" AS "archivedAt",
      "category",
      "created_at" AS "createdAt",
      "file_name" AS "fileName",
      ("content_bytes" IS NOT NULL) AS "hasContent",
      "id",
      "mime_type" AS "mimeType",
      "size_bytes" AS "sizeBytes",
      "title",
      "url"
    FROM "client_documents"
    WHERE "client_id" = ${clientId}::uuid
      AND "archived_at" IS NULL
    ORDER BY "created_at" DESC
    LIMIT 50
  `;
}

export async function findStoredClientDocument(
  clientId: string,
  documentId: string,
): Promise<ClientDocumentContentRow | null> {
  const rows = await getDatabase().$queryRaw<ClientDocumentContentRow[]>`
    SELECT
      "archived_at" AS "archivedAt",
      "category",
      "content_bytes" AS "contentBytes",
      "created_at" AS "createdAt",
      "file_name" AS "fileName",
      ("content_bytes" IS NOT NULL) AS "hasContent",
      "id",
      "mime_type" AS "mimeType",
      "size_bytes" AS "sizeBytes",
      "title",
      "url"
    FROM "client_documents"
    WHERE "client_id" = ${clientId}::uuid
      AND "id" = ${documentId}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}
