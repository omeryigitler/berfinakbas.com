-- Additive finance operations core. Monetary values are signed minor units;
-- ledger and session-credit records are append-only. Existing data is unchanged.
-- Rollback is pre-production only: drop the new tables in reverse dependency
-- order and then the enums. In production use a forward-fix migration.

CREATE TYPE "PaymentMethodStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ClientPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "ClientPlanSource" AS ENUM ('CUSTOM', 'TEMPLATE');
CREATE TYPE "FinanceEntryType" AS ENUM ('ACCRUAL', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'REVERSAL');
CREATE TYPE "InvoiceStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'ISSUED', 'SENT_TO_ACCOUNTING', 'CANCELLED');
CREATE TYPE "SessionCreditEntryType" AS ENUM ('GRANT', 'CONSUME', 'RESTORE', 'EXPIRE', 'CORRECTION');

CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "PaymentMethodStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_methods_key_format" CHECK ("key" ~ '^[A-Z][A-Z0-9_]{1,79}$'),
    CONSTRAINT "payment_methods_name_not_blank" CHECK (length(btrim("name")) > 0)
);

CREATE TABLE "client_plans" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "source" "ClientPlanSource" NOT NULL DEFAULT 'CUSTOM',
    "status" "ClientPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "session_count" INTEGER NOT NULL,
    "session_duration_minutes" INTEGER NOT NULL,
    "total_amount_minor" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_until" DATE,
    "invoice_status" "InvoiceStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "invoice_reference" VARCHAR(160),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "client_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "client_plans_name_not_blank" CHECK (length(btrim("name")) > 0),
    CONSTRAINT "client_plans_session_count_range" CHECK ("session_count" BETWEEN 1 AND 1000),
    CONSTRAINT "client_plans_session_duration_range" CHECK ("session_duration_minutes" BETWEEN 5 AND 480),
    CONSTRAINT "client_plans_total_positive" CHECK ("total_amount_minor" > 0),
    CONSTRAINT "client_plans_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "client_plans_validity_order" CHECK ("valid_until" IS NULL OR "valid_until" >= "valid_from"),
    CONSTRAINT "client_plans_invoice_reference_not_blank" CHECK ("invoice_reference" IS NULL OR length(btrim("invoice_reference")) > 0)
);

CREATE TABLE "plan_installments" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "amount_due_minor" BIGINT NOT NULL,
    "due_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_installments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plan_installments_sequence_positive" CHECK ("sequence" > 0),
    CONSTRAINT "plan_installments_amount_positive" CHECK ("amount_due_minor" > 0)
);

CREATE TABLE "finance_ledger_entries" (
    "id" UUID NOT NULL,
    "idempotency_key" VARCHAR(120) NOT NULL,
    "client_id" UUID NOT NULL,
    "plan_id" UUID,
    "installment_id" UUID,
    "appointment_id" UUID,
    "payment_method_id" UUID,
    "type" "FinanceEntryType" NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "external_reference" VARCHAR(160),
    "note" VARCHAR(500),
    "reverses_entry_id" UUID,
    "actor_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finance_ledger_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "finance_ledger_entries_amount_nonzero" CHECK ("amount_minor" <> 0),
    CONSTRAINT "finance_ledger_entries_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "finance_ledger_entries_reference_not_blank" CHECK ("external_reference" IS NULL OR length(btrim("external_reference")) > 0),
    CONSTRAINT "finance_ledger_entries_note_not_blank" CHECK ("note" IS NULL OR length(btrim("note")) > 0),
    CONSTRAINT "finance_ledger_entries_type_sign" CHECK (
        ("type" = 'ACCRUAL' AND "amount_minor" > 0)
        OR ("type" = 'PAYMENT' AND "amount_minor" < 0)
        OR ("type" = 'REFUND' AND "amount_minor" > 0)
        OR "type" IN ('ADJUSTMENT', 'REVERSAL')
    ),
    CONSTRAINT "finance_ledger_entries_payment_method" CHECK (
        ("type" = 'PAYMENT' AND "payment_method_id" IS NOT NULL)
        OR ("type" <> 'PAYMENT' AND "payment_method_id" IS NULL)
    ),
    CONSTRAINT "finance_ledger_entries_payment_scope" CHECK (
        ("type" = 'PAYMENT' AND "plan_id" IS NOT NULL AND "installment_id" IS NOT NULL)
        OR "type" <> 'PAYMENT'
    ),
    CONSTRAINT "finance_ledger_entries_reversal_reference" CHECK (
        ("type" = 'REVERSAL' AND "reverses_entry_id" IS NOT NULL)
        OR ("type" <> 'REVERSAL' AND "reverses_entry_id" IS NULL)
    )
);

CREATE TABLE "session_credit_entries" (
    "id" UUID NOT NULL,
    "idempotency_key" VARCHAR(120) NOT NULL,
    "plan_id" UUID NOT NULL,
    "appointment_id" UUID,
    "type" "SessionCreditEntryType" NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "reason_code" VARCHAR(80) NOT NULL,
    "reverses_entry_id" UUID,
    "actor_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_credit_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_credit_entries_quantity_nonzero" CHECK ("quantity_delta" <> 0),
    CONSTRAINT "session_credit_entries_reason_not_blank" CHECK (length(btrim("reason_code")) > 0),
    CONSTRAINT "session_credit_entries_type_sign" CHECK (
        ("type" IN ('GRANT', 'RESTORE') AND "quantity_delta" > 0)
        OR ("type" IN ('CONSUME', 'EXPIRE') AND "quantity_delta" < 0)
        OR "type" = 'CORRECTION'
    )
);

CREATE UNIQUE INDEX "payment_methods_key_key" ON "payment_methods"("key");
CREATE INDEX "payment_methods_status_sort_order_idx" ON "payment_methods"("status", "sort_order");
CREATE INDEX "client_plans_client_status_created_idx" ON "client_plans"("client_id", "status", "created_at");
CREATE INDEX "client_plans_status_valid_until_idx" ON "client_plans"("status", "valid_until");
CREATE UNIQUE INDEX "plan_installments_plan_sequence_key" ON "plan_installments"("plan_id", "sequence");
CREATE INDEX "plan_installments_due_date_idx" ON "plan_installments"("due_date");
CREATE UNIQUE INDEX "finance_ledger_entries_idempotency_key_key" ON "finance_ledger_entries"("idempotency_key");
CREATE UNIQUE INDEX "finance_ledger_entries_reverses_entry_id_key" ON "finance_ledger_entries"("reverses_entry_id");
CREATE INDEX "finance_ledger_entries_client_occurred_idx" ON "finance_ledger_entries"("client_id", "occurred_at" DESC);
CREATE INDEX "finance_ledger_entries_plan_occurred_idx" ON "finance_ledger_entries"("plan_id", "occurred_at");
CREATE INDEX "finance_ledger_entries_installment_occurred_idx" ON "finance_ledger_entries"("installment_id", "occurred_at");
CREATE UNIQUE INDEX "session_credit_entries_idempotency_key_key" ON "session_credit_entries"("idempotency_key");
CREATE UNIQUE INDEX "session_credit_entries_reverses_entry_id_key" ON "session_credit_entries"("reverses_entry_id");
CREATE INDEX "session_credit_entries_plan_created_idx" ON "session_credit_entries"("plan_id", "created_at");
CREATE INDEX "session_credit_entries_appointment_idx" ON "session_credit_entries"("appointment_id");
CREATE UNIQUE INDEX "session_credit_entries_plan_appointment_consume_key"
    ON "session_credit_entries"("plan_id", "appointment_id")
    WHERE "type" = 'CONSUME' AND "appointment_id" IS NOT NULL;

ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_plans" ADD CONSTRAINT "client_plans_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_plans" ADD CONSTRAINT "client_plans_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_installments" ADD CONSTRAINT "plan_installments_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "client_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "client_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_installment_id_fkey"
    FOREIGN KEY ("installment_id") REFERENCES "plan_installments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_payment_method_id_fkey"
    FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_ledger_entries" ADD CONSTRAINT "finance_ledger_entries_reverses_entry_id_fkey"
    FOREIGN KEY ("reverses_entry_id") REFERENCES "finance_ledger_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_credit_entries" ADD CONSTRAINT "session_credit_entries_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "client_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_credit_entries" ADD CONSTRAINT "session_credit_entries_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_credit_entries" ADD CONSTRAINT "session_credit_entries_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_credit_entries" ADD CONSTRAINT "session_credit_entries_reverses_entry_id_fkey"
    FOREIGN KEY ("reverses_entry_id") REFERENCES "session_credit_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
