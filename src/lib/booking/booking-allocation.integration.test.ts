import { createHash, randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";

import { SlotConflictError } from "@/domain/booking/appointment-hold";
import { createAppointmentHold } from "@/lib/booking/appointment-hold-service";
import {
  AppointmentTransitionConflictError,
  transitionAppointment,
} from "@/lib/booking/appointment-transition-service";
import { getDatabase } from "@/lib/db";

type Owner = Readonly<{ id: string; type: "appointment" | "hold" }>;

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL gerçek PostgreSQL integration testleri için zorunludur.");
}

const parsedDatabaseUrl = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\//, ""));
if (!/(?:test|integration)/i.test(databaseName)) {
  throw new Error("Integration testleri yalnızca test/integration adlı veritabanında çalışabilir.");
}

const pool = new Pool({ connectionString: testDatabaseUrl, max: 8 });
const fixture = {
  clientId: randomUUID(),
  practitionerIds: [randomUUID(), randomUUID()] as const,
  serviceId: randomUUID(),
  userIds: [randomUUID(), randomUUID()] as const,
};

async function createHold(
  practitionerId: string,
  busyStartsAt: Date,
  busyEndsAt: Date,
): Promise<Owner> {
  const id = randomUUID();
  const startsAt = new Date(busyStartsAt.getTime() + 5 * 60_000);
  const endsAt = new Date(busyEndsAt.getTime() - 5 * 60_000);
  const tokenHash = createHash("sha256").update(id).digest("hex");

  await pool.query(
    `INSERT INTO appointment_holds (
      id, practitioner_id, service_id, starts_at, ends_at, busy_starts_at,
      busy_ends_at, expires_at, holder_token_hash, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [
      id,
      practitionerId,
      fixture.serviceId,
      startsAt,
      endsAt,
      busyStartsAt,
      busyEndsAt,
      new Date("2035-01-01T00:00:00.000Z"),
      tokenHash,
    ],
  );
  return { id, type: "hold" };
}

async function createAppointment(
  practitionerId: string,
  busyStartsAt: Date,
  busyEndsAt: Date,
): Promise<Owner> {
  const id = randomUUID();
  const startsAt = new Date(busyStartsAt.getTime() + 5 * 60_000);
  const endsAt = new Date(busyEndsAt.getTime() - 5 * 60_000);

  await pool.query(
    `INSERT INTO appointments (
      id, public_reference, client_id, practitioner_id, service_id, status,
      starts_at, ends_at, busy_starts_at, busy_ends_at, service_name_snapshot,
      duration_minutes_snapshot, buffer_before_minutes_snapshot,
      buffer_after_minutes_snapshot, location_type_snapshot, policy_snapshot,
      source, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, 'REQUESTED', $6, $7, $8, $9,
      'Sentetik integration hizmeti', 50, 5, 5, 'IN_PERSON', $10, 'WEB', NOW()
    )`,
    [
      id,
      `IT-${id.slice(0, 8)}`,
      fixture.clientId,
      practitionerId,
      fixture.serviceId,
      startsAt,
      endsAt,
      busyStartsAt,
      busyEndsAt,
      JSON.stringify({ synthetic: true }),
    ],
  );
  return { id, type: "appointment" };
}

async function insertAllocation(
  client: PoolClient,
  owner: Owner,
  practitionerId: string,
  busyStartsAt: Date,
  busyEndsAt: Date,
  allocationId = randomUUID(),
) {
  await client.query(
    `INSERT INTO booking_allocations (
      id, practitioner_id, hold_id, appointment_id, busy_starts_at, busy_ends_at
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      allocationId,
      practitionerId,
      owner.type === "hold" ? owner.id : null,
      owner.type === "appointment" ? owner.id : null,
      busyStartsAt,
      busyEndsAt,
    ],
  );
  return allocationId;
}

async function expectConcurrentConflict(
  leftOwner: Owner,
  rightOwner: Owner,
  practitionerId: string,
  busyStartsAt: Date,
  busyEndsAt: Date,
) {
  const leftClient = await pool.connect();
  const rightClient = await pool.connect();
  const leftAllocationId = randomUUID();
  const rightAllocationId = randomUUID();

  try {
    await leftClient.query("BEGIN");
    await rightClient.query("BEGIN");
    await insertAllocation(
      leftClient,
      leftOwner,
      practitionerId,
      busyStartsAt,
      busyEndsAt,
      leftAllocationId,
    );

    const rightAttempt = insertAllocation(
      rightClient,
      rightOwner,
      practitionerId,
      busyStartsAt,
      busyEndsAt,
      rightAllocationId,
    ).then(
      () => ({ error: null }),
      (error: unknown) => ({ error }),
    );

    await leftClient.query("COMMIT");
    const { error } = await rightAttempt;
    await rightClient.query(error ? "ROLLBACK" : "COMMIT");

    expect(error).toMatchObject({
      code: "23P01",
      constraint: "booking_allocations_no_active_overlap",
    });

    const activeAllocations = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM booking_allocations
       WHERE id = ANY($1::uuid[]) AND status = 'ACTIVE'`,
      [[leftAllocationId, rightAllocationId]],
    );
    expect(Number(activeAllocations.rows[0].count)).toBe(1);
  } finally {
    leftClient.release();
    rightClient.release();
  }
}

beforeAll(async () => {
  const database = await pool.query<{ current_database: string }>("SELECT current_database()");
  expect(database.rows[0].current_database).toBe(databaseName);

  for (const [index, userId] of fixture.userIds.entries()) {
    await pool.query(
      `INSERT INTO users (id, email, status, updated_at)
       VALUES ($1, $2, 'ACTIVE', NOW())`,
      [userId, `integration-practitioner-${index}-${userId}@example.test`],
    );
    await pool.query(
      `INSERT INTO practitioners (id, user_id, display_name, time_zone, updated_at)
       VALUES ($1, $2, $3, 'Europe/Istanbul', NOW())`,
      [fixture.practitionerIds[index], userId, `Sentetik Uzman ${index + 1}`],
    );
  }

  await pool.query(
    `INSERT INTO services (
      id, slug, name, status, public_visible, approval_mode,
      default_duration_minutes, default_buffer_before_minutes,
      default_buffer_after_minutes, location_type, updated_at
    ) VALUES ($1, $2, 'Sentetik integration hizmeti', 'ACTIVE', true, 'MANUAL', 50, 5, 5, 'IN_PERSON', NOW())`,
    [fixture.serviceId, `integration-service-${fixture.serviceId}`],
  );
  await pool.query(
    `INSERT INTO service_policies (
      id, service_id, effective_from, booking_min_notice_minutes,
      booking_max_advance_days, cancellation_window_minutes,
      reschedule_window_minutes, max_daily_appointments
    ) VALUES ($1, $2, $3, 60, 730, 1440, 2880, 8)`,
    [randomUUID(), fixture.serviceId, new Date("2030-01-01T00:00:00.000Z")],
  );
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    await pool.query(
      `INSERT INTO availability_rules (
         id, practitioner_id, weekday, local_start_time, local_end_time,
         slot_increment_minutes, status, updated_at
       ) VALUES ($1, $2, $3, '09:00', '17:00', 5, 'ACTIVE', NOW())`,
      [randomUUID(), fixture.practitionerIds[0], weekday],
    );
  }
  await pool.query(
    `INSERT INTO clients (id, type, first_name, last_name, status, updated_at)
     VALUES ($1, 'ADULT', 'Sentetik', 'Danışan', 'ACTIVE', NOW())`,
    [fixture.clientId],
  );
});

afterAll(async () => {
  await pool.query(
    `DELETE FROM appointment_hold_status_logs
     WHERE hold_id IN (
       SELECT id FROM appointment_holds WHERE practitioner_id = ANY($1::uuid[])
     )`,
    [fixture.practitionerIds],
  );
  await pool.query(
    `DELETE FROM appointment_status_logs
     WHERE appointment_id IN (
       SELECT id FROM appointments WHERE practitioner_id = ANY($1::uuid[])
     )`,
    [fixture.practitionerIds],
  );
  await pool.query(`DELETE FROM booking_allocations WHERE practitioner_id = ANY($1::uuid[])`, [
    fixture.practitionerIds,
  ]);
  await pool.query(`DELETE FROM appointments WHERE practitioner_id = ANY($1::uuid[])`, [
    fixture.practitionerIds,
  ]);
  await pool.query(`DELETE FROM appointment_holds WHERE practitioner_id = ANY($1::uuid[])`, [
    fixture.practitionerIds,
  ]);
  await pool.query(
    `DELETE FROM audit_logs
     WHERE correlation_id LIKE 'application-hold-%'
        OR correlation_id LIKE 'application-appointment-transition-%'`,
  );
  await pool.query(`DELETE FROM clients WHERE id = $1`, [fixture.clientId]);
  await pool.query(`DELETE FROM availability_exceptions WHERE practitioner_id = ANY($1::uuid[])`, [
    fixture.practitionerIds,
  ]);
  await pool.query(`DELETE FROM availability_rules WHERE practitioner_id = ANY($1::uuid[])`, [
    fixture.practitionerIds,
  ]);
  await pool.query(`DELETE FROM practitioners WHERE id = ANY($1::uuid[])`, [
    fixture.practitionerIds,
  ]);
  await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [fixture.userIds]);
  await pool.query(`DELETE FROM service_policies WHERE service_id = $1`, [fixture.serviceId]);
  await pool.query(`DELETE FROM services WHERE id = $1`, [fixture.serviceId]);
  await getDatabase().$disconnect();
  await pool.end();
});

describe.sequential("booking allocation PostgreSQL integration", () => {
  it("has all migrations, btree_gist and the active overlap constraint", async () => {
    const migrations = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM _prisma_migrations
       WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
    );
    const extension = await pool.query(`SELECT 1 FROM pg_extension WHERE extname = 'btree_gist'`);
    const constraint = await pool.query(
      `SELECT 1 FROM pg_constraint WHERE conname = 'booking_allocations_no_active_overlap'`,
    );

    expect(Number(migrations.rows[0].count)).toBeGreaterThanOrEqual(5);
    expect(extension.rowCount).toBe(1);
    expect(constraint.rowCount).toBe(1);
  });

  it("allows only one of two concurrent holds for the same practitioner and range", async () => {
    const busyStartsAt = new Date("2031-07-01T08:55:00.000Z");
    const busyEndsAt = new Date("2031-07-01T09:55:00.000Z");
    const left = await createHold(fixture.practitionerIds[0], busyStartsAt, busyEndsAt);
    const right = await createHold(fixture.practitionerIds[0], busyStartsAt, busyEndsAt);

    await expectConcurrentConflict(
      left,
      right,
      fixture.practitionerIds[0],
      busyStartsAt,
      busyEndsAt,
    );
  });

  it("maps a concurrent application hold race to one safe slot conflict", async () => {
    const startsAt = new Date("2031-07-05T09:00:00.000Z");
    const now = new Date("2031-06-01T09:00:00.000Z");
    const results = await Promise.allSettled([
      createAppointmentHold(
        {
          correlationId: "application-hold-race-left",
          practitionerId: fixture.practitionerIds[0],
          serviceId: fixture.serviceId,
          startsAt,
        },
        now,
      ),
      createAppointmentHold(
        {
          correlationId: "application-hold-race-right",
          practitionerId: fixture.practitionerIds[0],
          serviceId: fixture.serviceId,
          startsAt,
        },
        now,
      ),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({ reason: { name: "SlotConflictError" } });

    const fulfilledHold = fulfilled[0];
    if (fulfilledHold.status !== "fulfilled") {
      throw new Error("Eşzamanlı hold yarışında kazanan hold bulunamadı.");
    }

    const activeAllocationCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM booking_allocations
       WHERE hold_id = $1 AND status = 'ACTIVE'`,
      [fulfilledHold.value.holdId],
    );
    expect(Number(activeAllocationCount.rows[0].count)).toBe(1);
  });

  it("rejects a database-blocked local slot without creating a hold or audit record", async () => {
    const localDate = new Date("2031-07-08T00:00:00.000Z");
    await pool.query(
      `INSERT INTO availability_exceptions (
         id, practitioner_id, local_date, type, local_start_time,
         local_end_time, reason_code, status, updated_at
       ) VALUES ($1, $2, $3, 'BLOCKED', '11:00', '13:00',
                 'SYNTHETIC_BLOCK', 'ACTIVE', NOW())`,
      [randomUUID(), fixture.practitionerIds[0], localDate],
    );

    await expect(
      createAppointmentHold(
        {
          correlationId: "application-hold-availability-blocked",
          practitionerId: fixture.practitionerIds[0],
          serviceId: fixture.serviceId,
          startsAt: new Date("2031-07-08T09:00:00.000Z"),
        },
        new Date("2031-06-01T09:00:00.000Z"),
      ),
    ).rejects.toBeInstanceOf(SlotConflictError);

    const holdCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM appointment_holds
       WHERE practitioner_id = $1 AND starts_at = $2`,
      [fixture.practitionerIds[0], new Date("2031-07-08T09:00:00.000Z")],
    );
    const auditCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM audit_logs
       WHERE correlation_id = 'application-hold-availability-blocked'`,
    );

    expect(Number(holdCount.rows[0].count)).toBe(0);
    expect(Number(auditCount.rows[0].count)).toBe(0);
  });

  it("allows only one of two different holds when one daily capacity remains", async () => {
    await pool.query(
      `UPDATE service_policies SET max_daily_appointments = 1 WHERE service_id = $1`,
      [fixture.serviceId],
    );

    try {
      const now = new Date("2031-06-01T09:00:00.000Z");
      const results = await Promise.allSettled([
        createAppointmentHold(
          {
            correlationId: "application-hold-capacity-left",
            practitionerId: fixture.practitionerIds[0],
            serviceId: fixture.serviceId,
            startsAt: new Date("2031-07-09T07:00:00.000Z"),
          },
          now,
        ),
        createAppointmentHold(
          {
            correlationId: "application-hold-capacity-right",
            practitionerId: fixture.practitionerIds[0],
            serviceId: fixture.serviceId,
            startsAt: new Date("2031-07-09T09:00:00.000Z"),
          },
          now,
        ),
      ]);
      const fulfilled = results.filter((result) => result.status === "fulfilled");
      const rejected = results.filter((result) => result.status === "rejected");
      const activeHoldCount = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM appointment_holds
         WHERE practitioner_id = $1
           AND starts_at >= $2 AND starts_at < $3
           AND status = 'ACTIVE' AND expires_at > $4`,
        [
          fixture.practitionerIds[0],
          new Date("2031-07-08T21:00:00.000Z"),
          new Date("2031-07-09T21:00:00.000Z"),
          now,
        ],
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]).toMatchObject({ reason: new SlotConflictError() });
      expect(Number(activeHoldCount.rows[0].count)).toBe(1);
    } finally {
      await pool.query(
        `UPDATE service_policies SET max_daily_appointments = 8 WHERE service_id = $1`,
        [fixture.serviceId],
      );
    }
  });

  it("persists appointment transitions, history, audit and allocation release atomically", async () => {
    const busyStartsAt = new Date("2031-07-06T08:55:00.000Z");
    const busyEndsAt = new Date("2031-07-06T09:55:00.000Z");
    const appointment = await createAppointment(
      fixture.practitionerIds[0],
      busyStartsAt,
      busyEndsAt,
    );
    const client = await pool.connect();
    await insertAllocation(
      client,
      appointment,
      fixture.practitionerIds[0],
      busyStartsAt,
      busyEndsAt,
    );
    client.release();

    await transitionAppointment({
      actorUserId: fixture.userIds[0],
      appointmentId: appointment.id,
      correlationId: "application-appointment-transition-review",
      reasonCode: "ADMIN_REVIEW_STARTED",
      toStatus: "PENDING_REVIEW",
    });
    const approvedAt = new Date("2031-06-01T09:00:00.000Z");
    await transitionAppointment(
      {
        actorUserId: fixture.userIds[0],
        appointmentId: appointment.id,
        correlationId: "application-appointment-transition-confirmed",
        reasonCode: "ADMIN_APPROVED",
        toStatus: "CONFIRMED",
      },
      approvedAt,
    );
    const cancelledAt = new Date("2031-06-02T09:00:00.000Z");
    await transitionAppointment(
      {
        actorUserId: fixture.userIds[0],
        appointmentId: appointment.id,
        correlationId: "application-appointment-transition-cancelled",
        reasonCode: "PRACTITIONER_UNAVAILABLE",
        toStatus: "CANCELLED_BY_PRACTITIONER",
      },
      cancelledAt,
    );

    const persisted = await pool.query<{
      approved_at: Date;
      approved_by_user_id: string;
      cancellation_reason_code: string;
      cancelled_at: Date;
      status: string;
    }>(
      `SELECT status, approved_at, approved_by_user_id, cancelled_at,
              cancellation_reason_code
       FROM appointments WHERE id = $1`,
      [appointment.id],
    );
    const history = await pool.query<{ to_status: string }>(
      `SELECT to_status FROM appointment_status_logs
       WHERE appointment_id = $1 ORDER BY created_at, id`,
      [appointment.id],
    );
    const audit = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM audit_logs
       WHERE correlation_id LIKE 'application-appointment-transition-%'
         AND entity_id = $1`,
      [appointment.id],
    );
    const allocation = await pool.query<{ released_at: Date; status: string }>(
      `SELECT status, released_at FROM booking_allocations WHERE appointment_id = $1`,
      [appointment.id],
    );

    expect(persisted.rows[0]).toMatchObject({
      approved_by_user_id: fixture.userIds[0],
      cancellation_reason_code: "PRACTITIONER_UNAVAILABLE",
      status: "CANCELLED_BY_PRACTITIONER",
    });
    expect(persisted.rows[0].approved_at).toEqual(approvedAt);
    expect(persisted.rows[0].cancelled_at).toEqual(cancelledAt);
    expect(history.rows.map((row) => row.to_status)).toEqual([
      "PENDING_REVIEW",
      "CONFIRMED",
      "CANCELLED_BY_PRACTITIONER",
    ]);
    expect(Number(audit.rows[0].count)).toBe(3);
    expect(allocation.rows[0]).toMatchObject({ status: "RELEASED" });
    expect(allocation.rows[0].released_at).toEqual(cancelledAt);
  });

  it("allows only one concurrent transition from the same appointment status", async () => {
    const appointment = await createAppointment(
      fixture.practitionerIds[0],
      new Date("2031-07-07T08:55:00.000Z"),
      new Date("2031-07-07T09:55:00.000Z"),
    );
    const results = await Promise.allSettled([
      transitionAppointment({
        actorUserId: fixture.userIds[0],
        appointmentId: appointment.id,
        correlationId: "application-appointment-transition-race-left",
        reasonCode: "ADMIN_REVIEW_STARTED",
        toStatus: "PENDING_REVIEW",
      }),
      transitionAppointment({
        actorUserId: fixture.userIds[1],
        appointmentId: appointment.id,
        correlationId: "application-appointment-transition-race-right",
        reasonCode: "ADMIN_REVIEW_STARTED",
        toStatus: "PENDING_REVIEW",
      }),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    const history = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM appointment_status_logs
       WHERE appointment_id = $1`,
      [appointment.id],
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({ reason: new AppointmentTransitionConflictError() });
    expect(Number(history.rows[0].count)).toBe(1);
  });

  it("allows only one concurrent hold or appointment for the same range", async () => {
    const busyStartsAt = new Date("2031-07-02T08:55:00.000Z");
    const busyEndsAt = new Date("2031-07-02T09:55:00.000Z");
    const hold = await createHold(fixture.practitionerIds[0], busyStartsAt, busyEndsAt);
    const appointment = await createAppointment(
      fixture.practitionerIds[0],
      busyStartsAt,
      busyEndsAt,
    );

    await expectConcurrentConflict(
      hold,
      appointment,
      fixture.practitionerIds[0],
      busyStartsAt,
      busyEndsAt,
    );
  });

  it("allows only one of two concurrent appointments for the same range", async () => {
    const busyStartsAt = new Date("2031-07-03T08:55:00.000Z");
    const busyEndsAt = new Date("2031-07-03T09:55:00.000Z");
    const left = await createAppointment(fixture.practitionerIds[0], busyStartsAt, busyEndsAt);
    const right = await createAppointment(fixture.practitionerIds[0], busyStartsAt, busyEndsAt);

    await expectConcurrentConflict(
      left,
      right,
      fixture.practitionerIds[0],
      busyStartsAt,
      busyEndsAt,
    );
  });

  it("allows the same range for different practitioners", async () => {
    const busyStartsAt = new Date("2031-07-04T08:55:00.000Z");
    const busyEndsAt = new Date("2031-07-04T09:55:00.000Z");
    const leftOwner = await createHold(fixture.practitionerIds[0], busyStartsAt, busyEndsAt);
    const rightOwner = await createHold(fixture.practitionerIds[1], busyStartsAt, busyEndsAt);
    const leftClient = await pool.connect();
    const rightClient = await pool.connect();

    try {
      await leftClient.query("BEGIN");
      await rightClient.query("BEGIN");
      await Promise.all([
        insertAllocation(
          leftClient,
          leftOwner,
          fixture.practitionerIds[0],
          busyStartsAt,
          busyEndsAt,
        ),
        insertAllocation(
          rightClient,
          rightOwner,
          fixture.practitionerIds[1],
          busyStartsAt,
          busyEndsAt,
        ),
      ]);
      await Promise.all([leftClient.query("COMMIT"), rightClient.query("COMMIT")]);
    } finally {
      leftClient.release();
      rightClient.release();
    }
  });
});
