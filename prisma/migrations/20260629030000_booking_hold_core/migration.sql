-- Additive booking-core migration. No existing table or column is removed.
-- Rollback (pre-production only): drop the new tables in reverse dependency order,
-- then the new enums. In production, prefer a forward-fix migration so hold and
-- appointment history is never deleted. Keep btree_gist if another object uses it.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE "PractitionerStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "AppointmentHoldStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'RELEASED');
CREATE TYPE "AppointmentStatus" AS ENUM (
    'REQUESTED',
    'PENDING_REVIEW',
    'CONFIRMED',
    'REJECTED',
    'RESCHEDULE_PROPOSED',
    'CANCELLED_BY_CLIENT',
    'CANCELLED_BY_PRACTITIONER',
    'COMPLETED',
    'NO_SHOW'
);
CREATE TYPE "AppointmentSource" AS ENUM ('WEB', 'ADMIN', 'PHONE');
CREATE TYPE "BookingAllocationStatus" AS ENUM ('ACTIVE', 'RELEASED');

CREATE TABLE "practitioners" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "time_zone" VARCHAR(80) NOT NULL,
    "status" "PractitionerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "practitioners_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "practitioners_display_name_not_blank" CHECK (length(btrim("display_name")) > 0),
    CONSTRAINT "practitioners_time_zone_not_blank" CHECK (length(btrim("time_zone")) > 0)
);

CREATE TABLE "appointment_holds" (
    "id" UUID NOT NULL,
    "practitioner_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "busy_starts_at" TIMESTAMPTZ(3) NOT NULL,
    "busy_ends_at" TIMESTAMPTZ(3) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "holder_token_hash" VARCHAR(64) NOT NULL,
    "status" "AppointmentHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "appointment_holds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_holds_time_order" CHECK (
        "busy_starts_at" <= "starts_at"
        AND "starts_at" < "ends_at"
        AND "ends_at" <= "busy_ends_at"
    ),
    CONSTRAINT "appointment_holds_expiry_after_creation" CHECK ("expires_at" > "created_at"),
    CONSTRAINT "appointment_holds_token_hash_format" CHECK ("holder_token_hash" ~ '^[0-9a-f]{64}$')
);

CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "public_reference" VARCHAR(32) NOT NULL,
    "client_id" UUID NOT NULL,
    "guardian_id" UUID,
    "practitioner_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "busy_starts_at" TIMESTAMPTZ(3) NOT NULL,
    "busy_ends_at" TIMESTAMPTZ(3) NOT NULL,
    "service_name_snapshot" VARCHAR(160) NOT NULL,
    "duration_minutes_snapshot" INTEGER NOT NULL,
    "buffer_before_minutes_snapshot" INTEGER NOT NULL,
    "buffer_after_minutes_snapshot" INTEGER NOT NULL,
    "location_type_snapshot" "LocationType" NOT NULL,
    "policy_snapshot" JSONB NOT NULL,
    "request_note" VARCHAR(500),
    "source" "AppointmentSource" NOT NULL,
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "cancellation_reason_code" VARCHAR(80),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointments_public_reference_not_blank" CHECK (length(btrim("public_reference")) > 0),
    CONSTRAINT "appointments_service_name_snapshot_not_blank" CHECK (length(btrim("service_name_snapshot")) > 0),
    CONSTRAINT "appointments_time_order" CHECK (
        "busy_starts_at" <= "starts_at"
        AND "starts_at" < "ends_at"
        AND "ends_at" <= "busy_ends_at"
    ),
    CONSTRAINT "appointments_duration_snapshot_range" CHECK ("duration_minutes_snapshot" BETWEEN 1 AND 1440),
    CONSTRAINT "appointments_buffer_before_snapshot_range" CHECK ("buffer_before_minutes_snapshot" BETWEEN 0 AND 1440),
    CONSTRAINT "appointments_buffer_after_snapshot_range" CHECK ("buffer_after_minutes_snapshot" BETWEEN 0 AND 1440),
    CONSTRAINT "appointments_approval_pair" CHECK (
        ("approved_by_user_id" IS NULL AND "approved_at" IS NULL)
        OR ("approved_by_user_id" IS NOT NULL AND "approved_at" IS NOT NULL)
    )
);

CREATE TABLE "booking_allocations" (
    "id" UUID NOT NULL,
    "practitioner_id" UUID NOT NULL,
    "hold_id" UUID,
    "appointment_id" UUID,
    "busy_starts_at" TIMESTAMPTZ(3) NOT NULL,
    "busy_ends_at" TIMESTAMPTZ(3) NOT NULL,
    "status" "BookingAllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "released_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_allocations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "booking_allocations_exactly_one_owner" CHECK (
        (("hold_id" IS NOT NULL)::integer + ("appointment_id" IS NOT NULL)::integer) = 1
    ),
    CONSTRAINT "booking_allocations_time_order" CHECK ("busy_starts_at" < "busy_ends_at"),
    CONSTRAINT "booking_allocations_release_state" CHECK (
        ("status" = 'ACTIVE' AND "released_at" IS NULL)
        OR ("status" = 'RELEASED' AND "released_at" IS NOT NULL)
    )
);

CREATE TABLE "appointment_hold_status_logs" (
    "id" UUID NOT NULL,
    "hold_id" UUID NOT NULL,
    "from_status" "AppointmentHoldStatus",
    "to_status" "AppointmentHoldStatus" NOT NULL,
    "reason_code" VARCHAR(80) NOT NULL,
    "actor_type" VARCHAR(40) NOT NULL,
    "actor_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointment_hold_status_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_hold_status_logs_reason_not_blank" CHECK (length(btrim("reason_code")) > 0),
    CONSTRAINT "appointment_hold_status_logs_actor_not_blank" CHECK (length(btrim("actor_type")) > 0)
);

CREATE TABLE "appointment_status_logs" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "from_status" "AppointmentStatus",
    "to_status" "AppointmentStatus" NOT NULL,
    "reason_code" VARCHAR(80) NOT NULL,
    "note" VARCHAR(500),
    "actor_type" VARCHAR(40) NOT NULL,
    "actor_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointment_status_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_status_logs_reason_not_blank" CHECK (length(btrim("reason_code")) > 0),
    CONSTRAINT "appointment_status_logs_actor_not_blank" CHECK (length(btrim("actor_type")) > 0)
);

CREATE UNIQUE INDEX "practitioners_user_id_key" ON "practitioners"("user_id");
CREATE INDEX "practitioners_status_idx" ON "practitioners"("status");
CREATE UNIQUE INDEX "appointment_holds_holder_token_hash_key" ON "appointment_holds"("holder_token_hash");
CREATE INDEX "appointment_holds_practitioner_starts_expires_idx" ON "appointment_holds"("practitioner_id", "starts_at", "expires_at");
CREATE INDEX "appointment_holds_status_expires_idx" ON "appointment_holds"("status", "expires_at");
CREATE UNIQUE INDEX "appointments_public_reference_key" ON "appointments"("public_reference");
CREATE INDEX "appointments_practitioner_starts_idx" ON "appointments"("practitioner_id", "starts_at");
CREATE INDEX "appointments_client_starts_idx" ON "appointments"("client_id", "starts_at" DESC);
CREATE INDEX "appointments_status_starts_idx" ON "appointments"("status", "starts_at");
CREATE UNIQUE INDEX "booking_allocations_hold_id_key" ON "booking_allocations"("hold_id");
CREATE UNIQUE INDEX "booking_allocations_appointment_id_key" ON "booking_allocations"("appointment_id");
CREATE INDEX "booking_allocations_practitioner_busy_idx" ON "booking_allocations"("practitioner_id", "busy_starts_at", "busy_ends_at");
CREATE INDEX "booking_allocations_status_released_idx" ON "booking_allocations"("status", "released_at");
CREATE INDEX "appointment_hold_status_logs_hold_created_idx" ON "appointment_hold_status_logs"("hold_id", "created_at");
CREATE INDEX "appointment_status_logs_appointment_created_idx" ON "appointment_status_logs"("appointment_id", "created_at");

ALTER TABLE "booking_allocations"
    ADD CONSTRAINT "booking_allocations_no_active_overlap"
    EXCLUDE USING gist (
        "practitioner_id" WITH =,
        tstzrange("busy_starts_at", "busy_ends_at", '[)') WITH &&
    ) WHERE ("status" = 'ACTIVE');

ALTER TABLE "practitioners" ADD CONSTRAINT "practitioners_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_holds" ADD CONSTRAINT "appointment_holds_practitioner_id_fkey"
    FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_holds" ADD CONSTRAINT "appointment_holds_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_guardian_id_fkey"
    FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_practitioner_id_fkey"
    FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_approved_by_user_id_fkey"
    FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_practitioner_id_fkey"
    FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_hold_id_fkey"
    FOREIGN KEY ("hold_id") REFERENCES "appointment_holds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_hold_status_logs" ADD CONSTRAINT "appointment_hold_status_logs_hold_id_fkey"
    FOREIGN KEY ("hold_id") REFERENCES "appointment_holds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_hold_status_logs" ADD CONSTRAINT "appointment_hold_status_logs_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointment_status_logs" ADD CONSTRAINT "appointment_status_logs_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_status_logs" ADD CONSTRAINT "appointment_status_logs_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
