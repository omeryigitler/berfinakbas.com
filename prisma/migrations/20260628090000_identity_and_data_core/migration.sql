-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('SUPER_ADMIN', 'THERAPIST', 'ASSISTANT', 'FINANCE', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('ADULT', 'CHILD');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PROSPECTIVE', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'WITHDRAWN', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160),
    "email" VARCHAR(320),
    "email_verified" TIMESTAMPTZ(3),
    "image" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "mfa_enforced_at" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" VARCHAR(80),
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" VARCHAR(255),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" VARCHAR(320) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "key" "RoleKey" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by_user_id" UUID,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "type" "ClientType" NOT NULL,
    "first_name" VARCHAR(120) NOT NULL,
    "last_name" VARCHAR(120) NOT NULL,
    "preferred_name" VARCHAR(120),
    "phone" VARCHAR(40),
    "email" VARCHAR(320),
    "birth_year" INTEGER,
    "status" "ClientStatus" NOT NULL DEFAULT 'PROSPECTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(120) NOT NULL,
    "last_name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "email" VARCHAR(320),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_guardians" (
    "client_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "relationship" VARCHAR(80) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "authority_verified_at" TIMESTAMPTZ(3),
    "verification_note" VARCHAR(500),

    CONSTRAINT "client_guardians_pkey" PRIMARY KEY ("client_id", "guardian_id")
);

-- CreateTable
CREATE TABLE "consent_documents" (
    "id" UUID NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "version" VARCHAR(40) NOT NULL,
    "content_hash" VARCHAR(128) NOT NULL,
    "effective_from" TIMESTAMPTZ(3) NOT NULL,
    "retired_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "guardian_id" UUID,
    "document_id" UUID NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'GRANTED',
    "captured_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(3),
    "capture_channel" VARCHAR(40) NOT NULL,
    "evidence_metadata" JSONB,
    "actor_user_id" UUID,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- AddColumns
ALTER TABLE "service_policies" ADD COLUMN "created_by_user_id" UUID;

-- Application-level invariants also live at the database boundary.
ALTER TABLE "clients"
    ADD CONSTRAINT "clients_name_not_blank" CHECK (length(btrim("first_name")) > 0 AND length(btrim("last_name")) > 0),
    ADD CONSTRAINT "clients_birth_year_range" CHECK ("birth_year" IS NULL OR "birth_year" BETWEEN 1900 AND 2100);

ALTER TABLE "guardians"
    ADD CONSTRAINT "guardians_name_not_blank" CHECK (length(btrim("first_name")) > 0 AND length(btrim("last_name")) > 0),
    ADD CONSTRAINT "guardians_phone_not_blank" CHECK (length(btrim("phone")) > 0);

ALTER TABLE "client_guardians"
    ADD CONSTRAINT "client_guardians_relationship_not_blank" CHECK (length(btrim("relationship")) > 0);

ALTER TABLE "consent_documents"
    ADD CONSTRAINT "consent_documents_hash_not_blank" CHECK (length(btrim("content_hash")) > 0),
    ADD CONSTRAINT "consent_documents_retirement_order" CHECK ("retired_at" IS NULL OR "retired_at" > "effective_from");

ALTER TABLE "consents"
    ADD CONSTRAINT "consents_exactly_one_subject" CHECK (num_nonnulls("client_id", "guardian_id") = 1),
    ADD CONSTRAINT "consents_withdrawal_state" CHECK (
        ("status" = 'WITHDRAWN' AND "withdrawn_at" IS NOT NULL)
        OR ("status" <> 'WITHDRAWN' AND "withdrawn_at" IS NULL)
    );

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");
CREATE INDEX "clients_status_created_at_idx" ON "clients"("status", "created_at");
CREATE INDEX "client_guardians_guardian_id_idx" ON "client_guardians"("guardian_id");
CREATE UNIQUE INDEX "consent_documents_type_version_key" ON "consent_documents"("type", "version");
CREATE INDEX "consents_client_id_captured_at_idx" ON "consents"("client_id", "captured_at");
CREATE INDEX "consents_guardian_id_captured_at_idx" ON "consents"("guardian_id", "captured_at");
CREATE INDEX "consents_document_id_status_idx" ON "consents"("document_id", "status");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_guardians" ADD CONSTRAINT "client_guardians_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_guardians" ADD CONSTRAINT "client_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consents" ADD CONSTRAINT "consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consents" ADD CONSTRAINT "consents_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consents" ADD CONSTRAINT "consents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "consent_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consents" ADD CONSTRAINT "consents_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_policies" ADD CONSTRAINT "service_policies_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "setting_change_logs" ADD CONSTRAINT "setting_change_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
