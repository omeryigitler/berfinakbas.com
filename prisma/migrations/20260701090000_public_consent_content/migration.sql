-- Additive public presentation fields for versioned consent documents.
-- Existing rows remain valid but public booking stays fail-closed until both
-- fields are populated with legally approved content.
ALTER TABLE "consent_documents"
    ADD COLUMN "public_title" VARCHAR(160),
    ADD COLUMN "public_content" TEXT;

ALTER TABLE "consent_documents"
    ADD CONSTRAINT "consent_documents_public_content_pair"
        CHECK (("public_title" IS NULL) = ("public_content" IS NULL)),
    ADD CONSTRAINT "consent_documents_public_content_not_blank"
        CHECK (
            "public_title" IS NULL
            OR (
                length(btrim("public_title")) > 0
                AND length(btrim("public_content")) > 0
            )
        );
