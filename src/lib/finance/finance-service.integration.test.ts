import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import {
  createClientPlan,
  createPaymentMethod,
  FinanceConflictError,
  FinancePolicyViolationError,
  recordPayment,
  reversePayment,
  updateInvoiceStatus,
} from "@/lib/finance/finance-service";
import { getDatabase } from "@/lib/db";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl)
  throw new Error("Finans integration testleri için TEST_DATABASE_URL zorunludur.");
const databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.replace(/^\//, ""));
if (!/(?:test|integration)/i.test(databaseName))
  throw new Error("Finans testleri yalnızca test/integration veritabanında çalışır.");

const pool = new Pool({ connectionString: testDatabaseUrl, max: 3 });
const fixture = { clientId: randomUUID(), userId: randomUUID() };
const context = {
  actorUserId: fixture.userId,
  correlationId: "finance-integration",
  now: new Date("2031-07-01T09:00:00.000Z"),
};
let paymentMethodId: string;
let planId: string;
let installmentId: string;
let paymentEntryId: string;

beforeAll(async () => {
  await pool.query(
    `INSERT INTO users (id, email, status, updated_at) VALUES ($1, $2, 'ACTIVE', NOW())`,
    [fixture.userId, `finance-${fixture.userId}@example.test`],
  );
  await pool.query(
    `INSERT INTO clients (id, type, first_name, last_name, status, updated_at) VALUES ($1, 'ADULT', 'Sentetik', 'Finans Danışanı', 'ACTIVE', NOW())`,
    [fixture.clientId],
  );
});

afterAll(async () => {
  await pool.query(`DELETE FROM audit_logs WHERE correlation_id = 'finance-integration'`);
  await pool.query(
    `DELETE FROM session_credit_entries WHERE plan_id IN (SELECT id FROM client_plans WHERE client_id = $1)`,
    [fixture.clientId],
  );
  await pool.query(`DELETE FROM finance_ledger_entries WHERE client_id = $1`, [fixture.clientId]);
  await pool.query(
    `DELETE FROM plan_installments WHERE plan_id IN (SELECT id FROM client_plans WHERE client_id = $1)`,
    [fixture.clientId],
  );
  await pool.query(`DELETE FROM client_plans WHERE client_id = $1`, [fixture.clientId]);
  await pool.query(`DELETE FROM payment_methods WHERE created_by_user_id = $1`, [fixture.userId]);
  await pool.query(`DELETE FROM clients WHERE id = $1`, [fixture.clientId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [fixture.userId]);
  await getDatabase().$disconnect();
  await pool.end();
});

describe.sequential("finance operations PostgreSQL ledger", () => {
  it("creates a configurable payment method and balanced client plan atomically", async () => {
    const method = await createPaymentMethod(
      {
        action: "CREATE_PAYMENT_METHOD",
        key: `TRANSFER_${fixture.clientId.replaceAll("-", "").slice(0, 8).toUpperCase()}`,
        name: "Sentetik havale",
        reason: "Integration ödeme yöntemi ekleniyor.",
        sortOrder: 1,
      },
      context,
    );
    paymentMethodId = method.id;
    const planInput = {
      action: "CREATE_PLAN",
      clientId: fixture.clientId,
      currency: "TRY",
      idempotencyKey: `finance-plan-${fixture.clientId}`,
      installments: [
        { amountMinor: "60000", dueDate: "2031-07-01", sequence: 1 },
        { amountMinor: "40000", dueDate: "2031-08-01", sequence: 2 },
      ],
      invoiceStatus: "PENDING",
      name: "Sentetik 10 seans planı",
      reason: "Integration danışan planı oluşturuluyor.",
      sessionCount: 10,
      sessionDurationMinutes: 50,
      source: "CUSTOM",
      totalAmountMinor: "100000",
      validFrom: "2031-07-01",
      validUntil: "2031-12-31",
    };
    const [plan, repeatedPlan] = await Promise.all([
      createClientPlan(planInput, context),
      createClientPlan(planInput, context),
    ]);
    planId = plan.id;
    expect(repeatedPlan.id).toBe(plan.id);
    expect(plan.totalAmountMinor).toBe("100000");
    const state = await pool.query<{
      balance: string;
      installment_total: string;
      sessions: string;
    }>(
      `SELECT
         (SELECT COALESCE(SUM(amount_minor), 0)::text FROM finance_ledger_entries WHERE plan_id = $1) AS balance,
         (SELECT COALESCE(SUM(amount_due_minor), 0)::text FROM plan_installments WHERE plan_id = $1) AS installment_total,
         (SELECT COALESCE(SUM(quantity_delta), 0)::text FROM session_credit_entries WHERE plan_id = $1) AS sessions`,
      [plan.id],
    );
    const installment = await pool.query<{ id: string }>(
      `SELECT id FROM plan_installments WHERE plan_id = $1 AND sequence = 1`,
      [plan.id],
    );
    installmentId = installment.rows[0].id;
    expect(state.rows[0]).toEqual({
      balance: "100000",
      installment_total: "100000",
      sessions: "10",
    });
  });

  it("records the same payment request once and derives balance from ledger entries", async () => {
    const input = {
      action: "RECORD_PAYMENT",
      amountMinor: "30000",
      clientId: fixture.clientId,
      currency: "TRY",
      externalReference: "synthetic-bank-reference",
      idempotencyKey: `finance-payment-${fixture.clientId}`,
      installmentId,
      note: null,
      occurredAt: "2031-07-01T10:00:00.000Z",
      paymentMethodId,
      planId,
      reason: "Sentetik kısmi ödeme kaydediliyor.",
    };
    const [first, repeated] = await Promise.all([
      recordPayment(input, context),
      recordPayment(input, context),
    ]);
    paymentEntryId = first.id;
    expect(repeated.id).toBe(first.id);
    await expect(recordPayment({ ...input, amountMinor: "30001" }, context)).rejects.toBeInstanceOf(
      FinanceConflictError,
    );
    const state = await pool.query<{ balance: string; payment_count: string }>(
      `SELECT COALESCE(SUM(amount_minor), 0)::text AS balance,
              COUNT(*) FILTER (WHERE type = 'PAYMENT')::text AS payment_count
       FROM finance_ledger_entries WHERE plan_id = $1`,
      [planId],
    );
    expect(state.rows[0]).toEqual({ balance: "70000", payment_count: "1" });
  });

  it("rejects overpayment without writing a ledger entry", async () => {
    await expect(
      recordPayment(
        {
          action: "RECORD_PAYMENT",
          amountMinor: "70001",
          clientId: fixture.clientId,
          currency: "TRY",
          externalReference: null,
          idempotencyKey: `finance-overpayment-${fixture.clientId}`,
          installmentId,
          note: null,
          occurredAt: "2031-07-01T11:00:00.000Z",
          paymentMethodId,
          planId,
          reason: "Fazla ödeme reddi integration testi.",
        },
        context,
      ),
    ).rejects.toBeInstanceOf(FinancePolicyViolationError);
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM finance_ledger_entries WHERE idempotency_key = $1`,
      [`finance-overpayment-${fixture.clientId}`],
    );
    expect(count.rows[0].count).toBe("0");
  });

  it("updates invoice status with an audit trail", async () => {
    const updated = await updateInvoiceStatus(
      {
        action: "UPDATE_INVOICE_STATUS",
        invoiceReference: "SYNTHETIC-DOC-1",
        invoiceStatus: "ISSUED",
        planId,
        reason: "Sentetik belge düzenlendi olarak işaretleniyor.",
      },
      context,
    );
    expect(updated).toMatchObject({
      invoiceReference: "SYNTHETIC-DOC-1",
      invoiceStatus: "ISSUED",
    });
    const audit = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM audit_logs
       WHERE entity_id = $1 AND action = 'client_plan.invoice_status_changed'`,
      [planId],
    );
    expect(audit.rows[0].count).toBe("1");
  });

  it("reverses a payment exactly once instead of editing or deleting it", async () => {
    const input = {
      action: "REVERSE_PAYMENT",
      entryId: paymentEntryId,
      idempotencyKey: `finance-reversal-${fixture.clientId}`,
      reason: "Sentetik ödeme kaydı ters çevriliyor.",
    };
    const reversal = await reversePayment(input, context);
    const repeated = await reversePayment(input, context);
    expect(repeated.id).toBe(reversal.id);
    const state = await pool.query<{
      balance: string;
      original_count: string;
      reversal_count: string;
    }>(
      `SELECT COALESCE(SUM(amount_minor), 0)::text AS balance,
              COUNT(*) FILTER (WHERE id = $2)::text AS original_count,
              COUNT(*) FILTER (WHERE reverses_entry_id = $2)::text AS reversal_count
       FROM finance_ledger_entries WHERE plan_id = $1`,
      [planId, paymentEntryId],
    );
    expect(state.rows[0]).toEqual({ balance: "100000", original_count: "1", reversal_count: "1" });
  });
});
