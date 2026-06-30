-- Additive forward migration: bind each appointment to the immutable consent
-- records used at request time without copying document text or form payloads.
-- No existing row is rewritten. Before production use, rollback may drop this
-- table; after links exist, prefer a forward fix so evidence is not discarded.

CREATE TABLE "appointment_consents" (
    "appointment_id" UUID NOT NULL,
    "consent_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_consents_pkey"
        PRIMARY KEY ("appointment_id", "consent_id")
);

CREATE INDEX "appointment_consents_consent_id_idx"
    ON "appointment_consents"("consent_id");

ALTER TABLE "appointment_consents"
    ADD CONSTRAINT "appointment_consents_appointment_id_fkey"
        FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment_consents"
    ADD CONSTRAINT "appointment_consents_consent_id_fkey"
        FOREIGN KEY ("consent_id") REFERENCES "consents"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
