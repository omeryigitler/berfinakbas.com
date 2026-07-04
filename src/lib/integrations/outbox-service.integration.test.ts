import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";

import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  OutboxEventStateConflictError,
} from "@/lib/integrations/outbox-service";
import { getDatabase } from "@/lib/db";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL outbox integration testleri için zorunludur.");
}

const parsedDatabaseUrl = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\//, ""));
if (!/(?:test|integration)/i.test(databaseName)) {
  throw new Error("Integration testleri yalnızca test/integration adlı veritabanında çalışabilir.");
}

const pool = new Pool({ connectionString: testDatabaseUrl, max: 4 });
const workerNow = new Date("2020-01-01T00:00:00.000Z");

async function insertEvent(
  overrides: Partial<{
    attemptCount: number;
    id: string;
    idempotencyKey: string;
    lockedAt: Date | null;
    status: "PENDING" | "PROCESSING";
  }> = {},
) {
  const event = {
    attemptCount: overrides.attemptCount ?? 0,
    id: overrides.id ?? randomUUID(),
    idempotencyKey: overrides.idempotencyKey ?? `outbox-integration:${randomUUID()}`,
    lockedAt: overrides.lockedAt ?? null,
    status: overrides.status ?? "PENDING",
  };

  await pool.query(
    `INSERT INTO outbox_events (
       id, aggregate_type, aggregate_id, event_type, payload,
       idempotency_key, status, attempt_count, next_attempt_at,
       locked_at, created_at, updated_at
     ) VALUES ($1, 'OUTBOX_TEST', $2, 'SYNTHETIC_EVENT', $3, $4, $5, $6,
       '2019-01-01T00:00:00.000Z', $7, '2019-01-01T00:00:00.000Z',
       '2019-01-01T00:00:00.000Z')`,
    [
      event.id,
      randomUUID(),
      JSON.stringify({ synthetic: true }),
      event.idempotencyKey,
      event.status,
      event.attemptCount,
      event.lockedAt,
    ],
  );
  return event;
}

beforeEach(async () => {
  await pool.query(`DELETE FROM outbox_events WHERE aggregate_type = 'OUTBOX_TEST'`);
});

afterAll(async () => {
  await pool.query(`DELETE FROM outbox_events WHERE aggregate_type = 'OUTBOX_TEST'`);
  await getDatabase().$disconnect();
  await pool.end();
});

describe.sequential("outbox PostgreSQL lifecycle", () => {
  it("allows only one worker to claim a due event", async () => {
    const event = await insertEvent();
    const claims = await Promise.all([
      claimOutboxEvents({ leaseDurationMs: 30_000, limit: 1, now: workerNow }),
      claimOutboxEvents({ leaseDurationMs: 30_000, limit: 1, now: workerNow }),
    ]);

    expect(claims.flat()).toHaveLength(1);
    expect(claims.flat()[0]).toMatchObject({ attemptCount: 1, id: event.id });

    const persisted = await pool.query<{
      attempt_count: number;
      locked_at: Date;
      status: string;
    }>(`SELECT status, attempt_count, locked_at FROM outbox_events WHERE id = $1`, [event.id]);
    expect(persisted.rows[0]).toMatchObject({ attempt_count: 1, status: "PROCESSING" });
    expect(persisted.rows[0].locked_at).toEqual(workerNow);
  });

  it("retries after the scheduled time and completes without duplicating the event", async () => {
    const event = await insertEvent();
    const [firstClaim] = await claimOutboxEvents({
      leaseDurationMs: 30_000,
      limit: 1,
      now: workerNow,
    });
    const retryAt = new Date("2020-01-01T00:01:00.000Z");

    await expect(
      failOutboxEvent({
        attemptCount: firstClaim.attemptCount,
        errorCode: "SYNTHETIC_TEMPORARY_ERROR",
        eventId: firstClaim.id,
        maxAttempts: 3,
        nextAttemptAt: retryAt,
        now: workerNow,
      }),
    ).resolves.toBe("FAILED");
    await expect(
      claimOutboxEvents({ leaseDurationMs: 30_000, limit: 1, now: workerNow }),
    ).resolves.toEqual([]);

    const [secondClaim] = await claimOutboxEvents({
      leaseDurationMs: 30_000,
      limit: 1,
      now: retryAt,
    });
    expect(secondClaim).toMatchObject({ attemptCount: 2, id: event.id });

    await completeOutboxEvent({
      attemptCount: secondClaim.attemptCount,
      eventId: event.id,
      now: retryAt,
    });
    const persisted = await pool.query<{
      attempt_count: number;
      count: string;
      status: string;
    }>(
      `SELECT MIN(status::text) AS status, MIN(attempt_count)::int AS attempt_count,
              COUNT(*)::text AS count
       FROM outbox_events WHERE idempotency_key = $1`,
      [event.idempotencyKey],
    );
    expect(persisted.rows[0]).toEqual({ attempt_count: 2, count: "1", status: "SENT" });
  });

  it("recovers an expired processing lease and dead-letters at the supplied limit", async () => {
    const event = await insertEvent({
      attemptCount: 1,
      lockedAt: new Date("2019-01-01T00:00:00.000Z"),
      status: "PROCESSING",
    });
    const [claim] = await claimOutboxEvents({
      leaseDurationMs: 30_000,
      limit: 1,
      now: workerNow,
    });
    expect(claim).toMatchObject({ attemptCount: 2, id: event.id });

    await expect(
      completeOutboxEvent({ attemptCount: 1, eventId: event.id, now: workerNow }),
    ).rejects.toBeInstanceOf(OutboxEventStateConflictError);

    await expect(
      failOutboxEvent({
        attemptCount: claim.attemptCount,
        errorCode: "SYNTHETIC_PERMANENT_ERROR",
        eventId: event.id,
        maxAttempts: 2,
        nextAttemptAt: workerNow,
        now: workerNow,
      }),
    ).resolves.toBe("DEAD");

    const persisted = await pool.query<{ locked_at: Date | null; status: string }>(
      `SELECT status, locked_at FROM outbox_events WHERE id = $1`,
      [event.id],
    );
    expect(persisted.rows[0]).toEqual({ locked_at: null, status: "DEAD" });
  });

  it("enforces idempotency keys in PostgreSQL", async () => {
    const idempotencyKey = `outbox-integration:${randomUUID()}`;
    await insertEvent({ idempotencyKey });

    await expect(insertEvent({ idempotencyKey })).rejects.toMatchObject({ code: "23505" });
  });
});
