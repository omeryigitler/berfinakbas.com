CREATE TABLE "operational_settings" (
  "key" VARCHAR(120) NOT NULL,
  "value" JSONB NOT NULL,
  "updated_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "operational_settings_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "client_notes" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "category" VARCHAR(40) NOT NULL,
  "note" VARCHAR(500) NOT NULL,
  "created_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_notes_client_created_idx" ON "client_notes"("client_id", "created_at" DESC);

ALTER TABLE "operational_settings"
  ADD CONSTRAINT "operational_settings_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "client_notes"
  ADD CONSTRAINT "client_notes_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "client_notes"
  ADD CONSTRAINT "client_notes_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "client_notes" ("id", "client_id", "category", "note", "created_by_user_id", "created_at")
SELECT
  gen_random_uuid(),
  audit."entity_id"::uuid,
  CASE WHEN audit."after_summary"->>'category' = 'PAYMENT' THEN 'PAYMENT' ELSE 'ADMIN' END,
  LEFT(COALESCE(audit."after_summary"->>'note', audit."reason", 'Operasyon notu'), 500),
  audit."actor_user_id",
  audit."created_at"
FROM "audit_logs" audit
WHERE audit."action" = 'CLIENT_NOTE_CREATED'
  AND audit."entity_type" = 'CLIENT'
  AND audit."actor_user_id" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "clients" client WHERE client."id" = audit."entity_id"::uuid);
