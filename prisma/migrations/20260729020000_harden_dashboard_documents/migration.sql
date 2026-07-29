-- Store document binaries in typed columns instead of OperationalSetting JSON.
ALTER TABLE "client_documents"
  ADD COLUMN IF NOT EXISTS "file_name" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "mime_type" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "size_bytes" INTEGER,
  ADD COLUMN IF NOT EXISTS "content_bytes" BYTEA,
  ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMPTZ(3);

CREATE INDEX IF NOT EXISTS "client_documents_client_archived_created_idx"
  ON "client_documents"("client_id", "archived_at", "created_at" DESC);

-- Migrate files written by the temporary JSON/base64 implementation.
UPDATE "client_documents" AS document
SET
  "file_name" = COALESCE(document."file_name", setting."value" ->> 'fileName'),
  "mime_type" = COALESCE(document."mime_type", setting."value" ->> 'mimeType'),
  "size_bytes" = COALESCE(
    document."size_bytes",
    CASE
      WHEN (setting."value" ->> 'sizeBytes') ~ '^[0-9]+$'
        THEN (setting."value" ->> 'sizeBytes')::INTEGER
      ELSE NULL
    END
  ),
  "content_bytes" = COALESCE(
    document."content_bytes",
    CASE
      WHEN COALESCE(setting."value" ->> 'base64', '') <> ''
        THEN decode(setting."value" ->> 'base64', 'base64')
      ELSE NULL
    END
  ),
  "archived_at" = COALESCE(
    document."archived_at",
    CASE
      WHEN COALESCE(setting."value" ->> 'archivedAt', '') <> ''
        THEN (setting."value" ->> 'archivedAt')::TIMESTAMPTZ
      ELSE NULL
    END
  )
FROM "operational_settings" AS setting
WHERE setting."key" = 'client-document:' || document."id"::TEXT;

-- Binary data and archive metadata no longer belong in the settings table.
DELETE FROM "operational_settings"
WHERE "key" LIKE 'client-document:%';
