CREATE TYPE "DuplicateReviewStatus" AS ENUM (
  'NOT_REQUIRED',
  'PENDING',
  'KEPT_SEPARATE',
  'LINKED_EXISTING'
);

ALTER TABLE "clients"
  ADD COLUMN "email_normalized" VARCHAR(320),
  ADD COLUMN "phone_normalized" VARCHAR(40);

ALTER TABLE "guardians"
  ADD COLUMN "email_normalized" VARCHAR(320),
  ADD COLUMN "phone_normalized" VARCHAR(40);

CREATE FUNCTION "normalize_contact_email"(input_value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(lower(btrim(input_value)), '');
$$;

CREATE FUNCTION "normalize_contact_phone"(input_value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  WITH normalized AS (
    SELECT regexp_replace(COALESCE(input_value, ''), '[^0-9]', '', 'g') AS digits
  )
  SELECT NULLIF(
    CASE
      WHEN length(digits) = 14 AND digits LIKE '0090%' THEN substring(digits FROM 3)
      WHEN length(digits) = 12 AND digits LIKE '90%' THEN digits
      WHEN length(digits) = 11 AND digits LIKE '0%' THEN '90' || substring(digits FROM 2)
      WHEN length(digits) = 10 THEN '90' || digits
      ELSE digits
    END,
    ''
  )
  FROM normalized;
$$;

CREATE FUNCTION "set_contact_identity_normalized"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."email_normalized" := "normalize_contact_email"(NEW."email");
  NEW."phone_normalized" := "normalize_contact_phone"(NEW."phone");
  RETURN NEW;
END;
$$;

CREATE TRIGGER "clients_contact_identity_normalized"
BEFORE INSERT OR UPDATE OF "email", "phone"
ON "clients"
FOR EACH ROW
EXECUTE FUNCTION "set_contact_identity_normalized"();

CREATE TRIGGER "guardians_contact_identity_normalized"
BEFORE INSERT OR UPDATE OF "email", "phone"
ON "guardians"
FOR EACH ROW
EXECUTE FUNCTION "set_contact_identity_normalized"();

UPDATE "clients"
SET
  "email_normalized" = "normalize_contact_email"("email"),
  "phone_normalized" = "normalize_contact_phone"("phone");

UPDATE "guardians"
SET
  "email_normalized" = "normalize_contact_email"("email"),
  "phone_normalized" = "normalize_contact_phone"("phone");

CREATE INDEX "clients_email_normalized_idx" ON "clients"("email_normalized");
CREATE INDEX "clients_phone_normalized_idx" ON "clients"("phone_normalized");
CREATE INDEX "guardians_email_normalized_idx" ON "guardians"("email_normalized");
CREATE INDEX "guardians_phone_normalized_idx" ON "guardians"("phone_normalized");

ALTER TABLE "appointments"
  ADD COLUMN "duplicate_review_status" "DuplicateReviewStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "duplicate_review_resolved_at" TIMESTAMPTZ(3),
  ADD COLUMN "duplicate_review_resolved_by_user_id" UUID,
  ADD COLUMN "duplicate_review_target_client_id" UUID,
  ADD COLUMN "duplicate_review_reason" VARCHAR(500);

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_duplicate_review_resolved_by_user_id_fkey"
  FOREIGN KEY ("duplicate_review_resolved_by_user_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_duplicate_review_target_client_id_fkey"
  FOREIGN KEY ("duplicate_review_target_client_id")
  REFERENCES "clients"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "appointments_duplicate_review_status_idx"
ON "appointments"("duplicate_review_status", "status");
