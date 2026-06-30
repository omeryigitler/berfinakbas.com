-- Additive forward migration: distinguish the record subject from the guardian
-- who supplied an acknowledgement or explicit-consent declaration for a child.
-- No existing consent row is rewritten. Rollback before the new column is used may
-- drop the foreign key, check, index and column; after use, prefer a forward fix.

ALTER TABLE "consents"
    ADD COLUMN "granted_by_guardian_id" UUID;

ALTER TABLE "consents"
    ADD CONSTRAINT "consents_guardian_grantor_requires_client"
        CHECK ("granted_by_guardian_id" IS NULL OR "client_id" IS NOT NULL);

CREATE INDEX "consents_granted_by_guardian_id_captured_at_idx"
    ON "consents"("granted_by_guardian_id", "captured_at");

ALTER TABLE "consents"
    ADD CONSTRAINT "consents_granted_by_guardian_id_fkey"
        FOREIGN KEY ("granted_by_guardian_id") REFERENCES "guardians"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
