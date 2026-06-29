-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ApprovalMode" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "public_description" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "public_visible" BOOLEAN NOT NULL DEFAULT false,
    "approval_mode" "ApprovalMode" NOT NULL DEFAULT 'MANUAL',
    "default_duration_minutes" INTEGER NOT NULL,
    "default_buffer_before_minutes" INTEGER NOT NULL DEFAULT 0,
    "default_buffer_after_minutes" INTEGER NOT NULL DEFAULT 0,
    "location_type" "LocationType" NOT NULL DEFAULT 'IN_PERSON',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_policies" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "booking_min_notice_minutes" INTEGER NOT NULL DEFAULT 0,
    "booking_max_advance_days" INTEGER NOT NULL,
    "cancellation_window_minutes" INTEGER NOT NULL,
    "reschedule_window_minutes" INTEGER NOT NULL,
    "max_daily_appointments" INTEGER,
    "custom_form_schema" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_policies_pkey" PRIMARY KEY ("id")
);

-- Protect configurable booking values at the database boundary as well as in the application.
ALTER TABLE "services"
    ADD CONSTRAINT "services_slug_not_blank" CHECK (length(btrim("slug")) > 0),
    ADD CONSTRAINT "services_name_not_blank" CHECK (length(btrim("name")) > 0),
    ADD CONSTRAINT "services_duration_minutes_range" CHECK ("default_duration_minutes" BETWEEN 1 AND 1440),
    ADD CONSTRAINT "services_buffer_before_minutes_range" CHECK ("default_buffer_before_minutes" BETWEEN 0 AND 1440),
    ADD CONSTRAINT "services_buffer_after_minutes_range" CHECK ("default_buffer_after_minutes" BETWEEN 0 AND 1440);

ALTER TABLE "service_policies"
    ADD CONSTRAINT "service_policies_min_notice_non_negative" CHECK ("booking_min_notice_minutes" >= 0),
    ADD CONSTRAINT "service_policies_max_advance_days_range" CHECK ("booking_max_advance_days" BETWEEN 1 AND 730),
    ADD CONSTRAINT "service_policies_cancellation_window_non_negative" CHECK ("cancellation_window_minutes" >= 0),
    ADD CONSTRAINT "service_policies_reschedule_window_non_negative" CHECK ("reschedule_window_minutes" >= 0),
    ADD CONSTRAINT "service_policies_max_daily_appointments_positive" CHECK ("max_daily_appointments" IS NULL OR "max_daily_appointments" > 0);

-- CreateTable
CREATE TABLE "setting_change_logs" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(80),
    "setting_key" VARCHAR(120) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "actor_user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setting_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_type" VARCHAR(40) NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(80) NOT NULL,
    "before_summary" JSONB,
    "after_summary" JSONB,
    "reason" VARCHAR(500),
    "correlation_id" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_status_public_visible_sort_order_idx" ON "services"("status", "public_visible", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "service_policies_service_id_effective_from_key" ON "service_policies"("service_id", "effective_from");

-- CreateIndex
CREATE INDEX "setting_change_logs_entity_created_at_idx" ON "setting_change_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_correlation_id_idx" ON "audit_logs"("correlation_id");

-- AddForeignKey
ALTER TABLE "service_policies" ADD CONSTRAINT "service_policies_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
