-- Additive availability migration. Existing booking data is not rewritten.
-- Rollback (pre-production only): drop the two new tables, then their enums.
-- In production prefer a forward-fix migration so configuration history remains traceable.

CREATE TYPE "AvailabilityRuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "AvailabilityExceptionType" AS ENUM ('CLOSED', 'CUSTOM_HOURS', 'BLOCKED');
CREATE TYPE "AvailabilityExceptionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "availability_rules" (
    "id" UUID NOT NULL,
    "practitioner_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "local_start_time" VARCHAR(5) NOT NULL,
    "local_end_time" VARCHAR(5) NOT NULL,
    "valid_from" DATE,
    "valid_until" DATE,
    "slot_increment_minutes" INTEGER NOT NULL,
    "status" "AvailabilityRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "availability_rules_weekday_range" CHECK ("weekday" BETWEEN 0 AND 6),
    CONSTRAINT "availability_rules_start_time_format" CHECK ("local_start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    CONSTRAINT "availability_rules_end_time_format" CHECK ("local_end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    CONSTRAINT "availability_rules_time_order" CHECK ("local_start_time" < "local_end_time"),
    CONSTRAINT "availability_rules_validity_order" CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_from" <= "valid_until"),
    CONSTRAINT "availability_rules_slot_increment_range" CHECK ("slot_increment_minutes" BETWEEN 1 AND 1440)
);

CREATE TABLE "availability_exceptions" (
    "id" UUID NOT NULL,
    "practitioner_id" UUID NOT NULL,
    "local_date" DATE NOT NULL,
    "type" "AvailabilityExceptionType" NOT NULL,
    "local_start_time" VARCHAR(5),
    "local_end_time" VARCHAR(5),
    "reason_code" VARCHAR(80) NOT NULL,
    "private_note" VARCHAR(500),
    "status" "AvailabilityExceptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "availability_exceptions_reason_not_blank" CHECK (length(btrim("reason_code")) > 0),
    CONSTRAINT "availability_exceptions_time_format" CHECK (
        ("local_start_time" IS NULL OR "local_start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
        AND ("local_end_time" IS NULL OR "local_end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
    ),
    CONSTRAINT "availability_exceptions_shape" CHECK (
        ("type" = 'CLOSED' AND "local_start_time" IS NULL AND "local_end_time" IS NULL)
        OR (
            "type" IN ('CUSTOM_HOURS', 'BLOCKED')
            AND "local_start_time" IS NOT NULL
            AND "local_end_time" IS NOT NULL
            AND "local_start_time" < "local_end_time"
        )
    )
);

CREATE INDEX "availability_rules_practitioner_status_weekday_idx"
    ON "availability_rules"("practitioner_id", "status", "weekday");
CREATE INDEX "availability_exceptions_practitioner_date_status_idx"
    ON "availability_exceptions"("practitioner_id", "local_date", "status");

ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_practitioner_id_fkey"
    FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_practitioner_id_fkey"
    FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
