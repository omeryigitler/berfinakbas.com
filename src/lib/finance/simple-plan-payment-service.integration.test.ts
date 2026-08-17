import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { createClientPlan } from "@/lib/finance/finance-service";
import { recordSimplePlanPayment } from "@/lib/finance/simple-plan-payment-service";
import { getDatabase } from "@/lib/db";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("Simple payment integration testi için TEST_DATABASE_URL zorunludur.");
const databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.replace(/^\//, ""));
if (!/(?:test|integration)/i.test(databaseName)) {
  throw new Error("Simple payment testleri yalnızca test/integration veritabanında çalışır.");
}

const pool = new Pool({ connectionString: testDatabaseUrl, max: 2 });
const fixture = { clientId: randomUUID(), userId: randomUUID() };
const context = { actorUserId: fixture.userId, correlationId: "simple-payment-integration" };
const planIds: string[] = [];

beforeAll(async () => {
  await pool.query(
    `INSERT INTO users (id, email, status, updated_at) VALUES ($1, $2, 'ACTIVE', NOW())`,
    [fixture.userId, `simple-payment-${fixture.userId}@example.test`],
  );
  await pool.query(
    `INSERT INTO clients (id, type, first_name, last_name, status, updated_at) VALUES ($1, 'ADULT', 'Basit', 'Ödeme', 'ACTIVE', NOW())`,
    [fixture.clientId],
  );
});

afterAll(async () => {
  await pool.query(`DELETE FROM audit_logs WHERE actor_user_id = $1`, [fixture.userId]);
  await pool.query(`DELETE FROM session_credit_entries WHERE plan_id = ANY($1::uuid[])`, [planIds]);
  await pool.query(`DELETE FROM finance_ledger_entries WHERE client_id = $1`, [fixture.clientId]);
  await pool.query(`DELETE FROM plan_installments WHERE plan_id = ANY($1::uuid[])`, [planIds]);
  await pool.query(`DELETE FROM client_plans WHERE client_id = $1`, [fixture.clientId]);
  await pool.query(`DELETE FROM clients WHERE id = $1`, [fixture.clientId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [fixture.userId]);
  await getDatabase().$disconnect();
  await pool.end();
});

async function createPlan(name: string, amountMinor: string, key: string) {
  const plan = await createClientPlan(
    {
      action: "CREATE_PLAN",
      clientId: fixture.clientId,
      currency: "TRY",
      idempotencyKey: key,
      installments: [{ amountMinor, dueDate: "2031-07-01", sequence: 1 }],
      name,
      reason: "Basit ödeme integration planı oluşturuluyor.",
      sessionCount: 5,
      sessionDurationMinutes: 45,
      totalAmountMinor: amountMinor,
      validFrom: "2031-07-01",
      validUntil: null,
    },
    { ...context, now: new Date("2031-07-01T09:00:00.000Z") },
  );
  planIds.push(plan.id);
  return plan;
}

describe.sequential("simple plan payments", () => {
  it("allows a second active plan while the first still has debt", async () => {
    const first = await createPlan(
      "İlk aktif plan",
      "100000",
      `simple-plan-a-${fixture.clientId}`,
    );
    const second = await createPlan(
      "Yeni aktif plan",
      "50000",
      `simple-plan-b-${fixture.clientId}`,
    );
    expect(first.status).toBe("ACTIVE");
    expect(second.status).toBe("ACTIVE");
  });

  it("records plan-level payments without a payment method or installment", async () => {
    const firstPlanId = planIds[0];
    const payment = await recordSimplePlanPayment(
      {
        amountMinor: "40000",
        clientId: fixture.clientId,
        idempotencyKey: `simple-payment-a-${fixture.clientId}`,
        note: "İlk plan ödemesi",
        occurredOn: "2031-07-02",
        planId: firstPlanId,
      },
      context,
    );
    expect(payment.remainingMinor).toBe("60000");
    const stored = await pool.query<{
      installment_id: string | null;
      payment_method_id: string | null;
    }>(
      `SELECT installment_id, payment_method_id FROM finance_ledger_entries WHERE id = $1`,
      [payment.id],
    );
    expect(stored.rows[0]).toEqual({ installment_id: null, payment_method_id: null });
  });

  it("can pay the newer plan independently and blocks payments after a plan is fully paid", async () => {
    const secondPlanId = planIds[1];
    const paid = await recordSimplePlanPayment(
      {
        amountMinor: "50000",
        clientId: fixture.clientId,
        idempotencyKey: `simple-payment-b-${fixture.clientId}`,
        note: "Yeni plan tamamen ödendi",
        occurredOn: "2031-07-03",
        planId: secondPlanId,
      },
      context,
    );
    expect(paid.remainingMinor).toBe("0");

    await expect(
      recordSimplePlanPayment(
        {
          amountMinor: "100",
          clientId: fixture.clientId,
          idempotencyKey: `simple-payment-b-extra-${fixture.clientId}`,
          note: null,
          occurredOn: "2031-07-04",
          planId: secondPlanId,
        },
        context,
      ),
    ).rejects.toThrow("Bu planın kalan ödemesi yok.");
  });
});
