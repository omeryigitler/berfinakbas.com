-- CreateTable
CREATE TABLE "client_documents" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "url" VARCHAR(1000),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contact_logs" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "channel" VARCHAR(40) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "result" VARCHAR(200),
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_contact_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_documents_client_created_idx" ON "client_documents"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "client_contact_logs_client_occurred_idx" ON "client_contact_logs"("client_id", "occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contact_logs" ADD CONSTRAINT "client_contact_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contact_logs" ADD CONSTRAINT "client_contact_logs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
