-- Additive transactional outbox foundation. Events contain only minimum
-- integration metadata; provider credentials and message bodies are not stored.
-- Rollback is pre-production only: drop outbox_events and OutboxEventStatus.
-- In production preserve event history and use a forward-fix migration.

CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD');

CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "aggregate_type" VARCHAR(80) NOT NULL,
    "aggregate_id" VARCHAR(80) NOT NULL,
    "event_type" VARCHAR(120) NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotency_key" VARCHAR(160) NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMPTZ(3),
    "last_error_code" VARCHAR(120),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "processed_at" TIMESTAMPTZ(3),
    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "outbox_events_aggregate_type_not_blank" CHECK (length(btrim("aggregate_type")) > 0),
    CONSTRAINT "outbox_events_aggregate_id_not_blank" CHECK (length(btrim("aggregate_id")) > 0),
    CONSTRAINT "outbox_events_event_type_not_blank" CHECK (length(btrim("event_type")) > 0),
    CONSTRAINT "outbox_events_idempotency_key_not_blank" CHECK (length(btrim("idempotency_key")) > 0),
    CONSTRAINT "outbox_events_payload_object" CHECK (jsonb_typeof("payload") = 'object'),
    CONSTRAINT "outbox_events_attempt_count_nonnegative" CHECK ("attempt_count" >= 0),
    CONSTRAINT "outbox_events_processing_lock" CHECK (("status" = 'PROCESSING') = ("locked_at" IS NOT NULL)),
    CONSTRAINT "outbox_events_terminal_timestamp" CHECK (("status" IN ('SENT', 'DEAD')) = ("processed_at" IS NOT NULL)),
    CONSTRAINT "outbox_events_error_code_not_blank" CHECK ("last_error_code" IS NULL OR length(btrim("last_error_code")) > 0)
);

CREATE UNIQUE INDEX "outbox_events_idempotency_key_key" ON "outbox_events"("idempotency_key");
CREATE INDEX "outbox_events_status_next_attempt_idx" ON "outbox_events"("status", "next_attempt_at");
CREATE INDEX "outbox_events_aggregate_created_idx" ON "outbox_events"("aggregate_type", "aggregate_id", "created_at");
