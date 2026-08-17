-- Plan-level payments are intentionally simple: an administrator records that a
-- payment was received against a client plan. Payment method and installment are
-- optional metadata, not prerequisites for recording the payment.
--
-- Existing ledger rows remain valid. This is a forward-only constraint change;
-- no financial values or historical records are rewritten.

ALTER TABLE "finance_ledger_entries"
    DROP CONSTRAINT "finance_ledger_entries_payment_method";

ALTER TABLE "finance_ledger_entries"
    ADD CONSTRAINT "finance_ledger_entries_payment_method" CHECK (
        "type" = 'PAYMENT' OR "payment_method_id" IS NULL
    );

ALTER TABLE "finance_ledger_entries"
    DROP CONSTRAINT "finance_ledger_entries_payment_scope";

ALTER TABLE "finance_ledger_entries"
    ADD CONSTRAINT "finance_ledger_entries_payment_scope" CHECK (
        ("type" = 'PAYMENT' AND "plan_id" IS NOT NULL)
        OR "type" <> 'PAYMENT'
    );
