import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { BookingConsentGateError } from "@/domain/consent/booking-consent";
import { createAppointmentHold } from "@/lib/booking/appointment-hold-service";
import {
  BookingRequestConflictError,
  createAppointmentRequest,
} from "@/lib/booking/appointment-request-service";
import { getDatabase } from "@/lib/db";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("Randevu talebi integration testleri için TEST_DATABASE_URL zorunludur.");
}

const parsedDatabaseUrl = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\//, ""));
if (!/(?:test|integration)/i.test(databaseName)) {
  throw new Error("Randevu talebi testleri yalnızca test/integration veritabanında çalışır.");
}

const pool = new Pool({ connectionString: testDatabaseUrl, max: 6 });
const fixture = {
  childClientId: randomUUID(),
  childConsentIds: [randomUUID(), randomUUID()] as const,
  clientId: randomUUID(),
  consentIds: [randomUUID(), randomUUID()] as const,
  documentIds: [randomUUID(), randomUUID()] as const,
  guardianId: randomUUID(),
  practitionerId: randomUUID(),
  serviceId: randomUUID(),
  userId: randomUUID(),
};
const requestNow = new Date("2031-06-01T09:00:00.000Z");
let firstPublicReference: string;

async function createHold(day: number) {
  return createAppointmentHold(
    {
      correlationId: `appointment-request-hold-${day}`,
      holdDurationMinutes: 10,
      practitionerId: fixture.practitionerId,
      serviceId: fixture.serviceId,
      startsAt: new Date(`2031-08-${String(day).padStart(2, "0")}T09:00:00.000Z`),
    },
    requestNow,
  );
}

function requestInput(
  hold: Awaited<ReturnType<typeof createHold>>,
  correlationId: string,
  consentIds: readonly string[] = fixture.consentIds,
) {
  return {
    clientId: fixture.clientId,
    consentIds: [...consentIds],
    correlationId,
    guardianId: null,
    holdId: hold.holdId,
    holderToken: hold.holderToken,
    requestNote: "Sentetik operasyon notu; sağlık ayrıntısı içermez.",
  };
}

beforeAll(async () => {
  const database = await pool.query<{ current_database: string }>("SELECT current_database()");
  expect(database.rows[0].current_database).toBe(databaseName);

  await pool.query(
    `INSERT INTO users (id, email, status, updated_at)
     VALUES ($1, $2, 'ACTIVE', NOW())`,
    [fixture.userId, `appointment-request-${fixture.userId}@example.test`],
  );
  await pool.query(
    `INSERT INTO practitioners (id, user_id, display_name, time_zone, updated_at)
     VALUES ($1, $2, 'Sentetik Talep Uzmanı', 'Europe/Istanbul', NOW())`,
    [fixture.practitionerId, fixture.userId],
  );
  await pool.query(
    `INSERT INTO services (
       id, slug, name, status, public_visible, approval_mode,
       default_duration_minutes, default_buffer_before_minutes,
       default_buffer_after_minutes, location_type, updated_at
     ) VALUES (
       $1, $2, 'Sentetik Randevu Talebi Hizmeti', 'ACTIVE', true, 'MANUAL',
       50, 5, 5, 'IN_PERSON', NOW()
     )`,
    [fixture.serviceId, `appointment-request-${fixture.serviceId}`],
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
      [randomUUID(), fixture.practitionerId, weekday],
    );
  }
  await pool.query(
    `INSERT INTO clients (id, type, first_name, last_name, status, updated_at)
     VALUES ($1, 'ADULT', 'Sentetik', 'Talep Danışanı', 'PROSPECTIVE', NOW())`,
    [fixture.clientId],
  );
  await pool.query(
    `INSERT INTO clients (id, type, first_name, last_name, status, updated_at)
     VALUES ($1, 'CHILD', 'Sentetik', 'Çocuk Danışan', 'PROSPECTIVE', NOW())`,
    [fixture.childClientId],
  );
  await pool.query(
    `INSERT INTO guardians (id, first_name, last_name, phone, updated_at)
     VALUES ($1, 'Sentetik', 'Beyan Veli', '+900000000001', NOW())`,
    [fixture.guardianId],
  );
  await pool.query(
    `INSERT INTO client_guardians (client_id, guardian_id, relationship)
     VALUES ($1, $2, 'PARENT_DECLARED')`,
    [fixture.childClientId, fixture.guardianId],
  );

  for (const [index, documentType] of ["PRIVACY_NOTICE", "BOOKING_TERMS"].entries()) {
    await pool.query(
      `INSERT INTO consent_documents (
         id, type, version, content_hash, effective_from
       ) VALUES ($1, $2, 'appointment-request-v1', $3, $4)`,
      [
        fixture.documentIds[index],
        documentType,
        `sha256:${String(index).repeat(64)}`,
        new Date("2030-01-01T00:00:00.000Z"),
      ],
    );
    await pool.query(
      `INSERT INTO consents (
         id, client_id, document_id, status, captured_at, capture_channel,
         evidence_metadata
       ) VALUES ($1, $2, $3, 'GRANTED', $4, 'WEB', $5)`,
      [
        fixture.consentIds[index],
        fixture.clientId,
        fixture.documentIds[index],
        requestNow,
        JSON.stringify({ synthetic: true }),
      ],
    );
    await pool.query(
      `INSERT INTO consents (
         id, client_id, granted_by_guardian_id, document_id, status,
         captured_at, capture_channel, evidence_metadata
       ) VALUES ($1, $2, $3, $4, 'GRANTED', $5, 'WEB', $6)`,
      [
        fixture.childConsentIds[index],
        fixture.childClientId,
        fixture.guardianId,
        fixture.documentIds[index],
        requestNow,
        JSON.stringify({ synthetic: true }),
      ],
    );
  }
});

afterAll(async () => {
  await pool.query(
    `DELETE FROM appointment_consents
     WHERE appointment_id IN (
       SELECT id FROM appointments WHERE practitioner_id = $1
     )`,
    [fixture.practitionerId],
  );
  await pool.query(
    `DELETE FROM appointment_status_logs
     WHERE appointment_id IN (
       SELECT id FROM appointments WHERE practitioner_id = $1
     )`,
    [fixture.practitionerId],
  );
  await pool.query(
    `DELETE FROM appointment_hold_status_logs
     WHERE hold_id IN (
       SELECT id FROM appointment_holds WHERE practitioner_id = $1
     )`,
    [fixture.practitionerId],
  );
  await pool.query(`DELETE FROM booking_allocations WHERE practitioner_id = $1`, [
    fixture.practitionerId,
  ]);
  await pool.query(`DELETE FROM appointments WHERE practitioner_id = $1`, [fixture.practitionerId]);
  await pool.query(`DELETE FROM appointment_holds WHERE practitioner_id = $1`, [
    fixture.practitionerId,
  ]);
  await pool.query(`DELETE FROM audit_logs WHERE correlation_id LIKE 'appointment-request-%'`);
  await pool.query(`DELETE FROM consents WHERE id = ANY($1::uuid[])`, [
    [...fixture.consentIds, ...fixture.childConsentIds],
  ]);
  await pool.query(`DELETE FROM consent_documents WHERE id = ANY($1::uuid[])`, [
    fixture.documentIds,
  ]);
  await pool.query(`DELETE FROM client_guardians WHERE client_id = $1`, [fixture.childClientId]);
  await pool.query(`DELETE FROM guardians WHERE id = $1`, [fixture.guardianId]);
  await pool.query(`DELETE FROM clients WHERE id = ANY($1::uuid[])`, [
    [fixture.clientId, fixture.childClientId],
  ]);
  await pool.query(`DELETE FROM service_policies WHERE service_id = $1`, [fixture.serviceId]);
  await pool.query(`DELETE FROM services WHERE id = $1`, [fixture.serviceId]);
  await pool.query(`DELETE FROM availability_rules WHERE practitioner_id = $1`, [
    fixture.practitionerId,
  ]);
  await pool.query(`DELETE FROM practitioners WHERE id = $1`, [fixture.practitionerId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [fixture.userId]);
  await getDatabase().$disconnect();
  await pool.end();
});

describe.sequential("appointment request PostgreSQL transaction", () => {
  it("atomically consumes a hold and links the requested appointment to consent evidence", async () => {
    const hold = await createHold(1);
    const result = await createAppointmentRequest(
      requestInput(hold, "appointment-request-success"),
      { now: requestNow },
    );
    firstPublicReference = result.publicReference;

    const appointment = await pool.query<{
      duration_minutes_snapshot: number;
      request_note: string;
      status: string;
    }>(
      `SELECT status, duration_minutes_snapshot, request_note
       FROM appointments WHERE id = $1`,
      [result.appointmentId],
    );
    const holdState = await pool.query<{ status: string }>(
      `SELECT status FROM appointment_holds WHERE id = $1`,
      [hold.holdId],
    );
    const allocation = await pool.query<{
      appointment_id: string;
      hold_id: string | null;
      status: string;
    }>(
      `SELECT appointment_id, hold_id, status
       FROM booking_allocations WHERE appointment_id = $1`,
      [result.appointmentId],
    );
    const consentLinks = await pool.query<{ consent_id: string }>(
      `SELECT consent_id FROM appointment_consents
       WHERE appointment_id = $1 ORDER BY consent_id`,
      [result.appointmentId],
    );
    const statusHistory = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM appointment_status_logs WHERE appointment_id = $1`,
      [result.appointmentId],
    );
    const audit = await pool.query<{ after_summary: unknown }>(
      `SELECT after_summary FROM audit_logs
       WHERE correlation_id = 'appointment-request-success'
       ORDER BY action`,
    );

    expect(result).toMatchObject({ status: "REQUESTED" });
    expect(result.publicReference).toMatch(/^BR-[A-F0-9]{20}$/);
    expect(appointment.rows[0]).toEqual({
      duration_minutes_snapshot: 50,
      request_note: "Sentetik operasyon notu; sağlık ayrıntısı içermez.",
      status: "REQUESTED",
    });
    expect(holdState.rows[0].status).toBe("CONSUMED");
    expect(allocation.rows[0]).toEqual({
      appointment_id: result.appointmentId,
      hold_id: null,
      status: "ACTIVE",
    });
    expect(consentLinks.rows.map((row) => row.consent_id).sort()).toEqual(
      [...fixture.consentIds].sort(),
    );
    expect(Number(statusHistory.rows[0].count)).toBe(1);
    expect(JSON.stringify(audit.rows)).not.toContain(hold.holderToken);
    expect(JSON.stringify(audit.rows)).not.toContain("Talep Danışanı");

    await expect(
      pool.query(
        `INSERT INTO appointment_consents (appointment_id, consent_id)
         VALUES ($1, $2)`,
        [result.appointmentId, fixture.consentIds[0]],
      ),
    ).rejects.toMatchObject({ code: "23505", constraint: "appointment_consents_pkey" });
    await expect(
      pool.query(`DELETE FROM consents WHERE id = $1`, [fixture.consentIds[0]]),
    ).rejects.toMatchObject({
      code: "23503",
      constraint: "appointment_consents_consent_id_fkey",
    });
  });

  it("allows only one of two concurrent requests to consume the same hold", async () => {
    const hold = await createHold(2);
    const results = await Promise.allSettled([
      createAppointmentRequest(requestInput(hold, "appointment-request-race-left"), {
        now: requestNow,
      }),
      createAppointmentRequest(requestInput(hold, "appointment-request-race-right"), {
        now: requestNow,
      }),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    const appointmentCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM appointments
       WHERE practitioner_id = $1 AND starts_at = $2`,
      [fixture.practitionerId, hold.startsAt],
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({ reason: new BookingRequestConflictError() });
    expect(Number(appointmentCount.rows[0].count)).toBe(1);
  });

  it("creates a child request with its declared guardian and matching grantor evidence", async () => {
    const hold = await createHold(5);
    const result = await createAppointmentRequest(
      {
        ...requestInput(hold, "appointment-request-child", fixture.childConsentIds),
        clientId: fixture.childClientId,
        guardianId: fixture.guardianId,
      },
      { now: requestNow },
    );
    const appointment = await pool.query<{ client_id: string; guardian_id: string }>(
      `SELECT client_id, guardian_id FROM appointments WHERE id = $1`,
      [result.appointmentId],
    );

    expect(appointment.rows[0]).toEqual({
      client_id: fixture.childClientId,
      guardian_id: fixture.guardianId,
    });
  });

  it("leaves the hold and allocation active when appointment creation rolls back", async () => {
    const hold = await createHold(3);

    await expect(
      createAppointmentRequest(requestInput(hold, "appointment-request-rollback"), {
        now: requestNow,
        referenceFactory: () => firstPublicReference,
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    const state = await pool.query<{ allocation_status: string; hold_status: string }>(
      `SELECT h.status AS hold_status, a.status AS allocation_status
       FROM appointment_holds h
       JOIN booking_allocations a ON a.hold_id = h.id
       WHERE h.id = $1`,
      [hold.holdId],
    );
    expect(state.rows[0]).toEqual({ allocation_status: "ACTIVE", hold_status: "ACTIVE" });
  });

  it("fails closed on missing consent without consuming the hold", async () => {
    const hold = await createHold(4);

    await expect(
      createAppointmentRequest(
        requestInput(hold, "appointment-request-missing-consent", [fixture.consentIds[0]]),
        { now: requestNow },
      ),
    ).rejects.toBeInstanceOf(BookingConsentGateError);

    const state = await pool.query<{ status: string }>(
      `SELECT status FROM appointment_holds WHERE id = $1`,
      [hold.holdId],
    );
    expect(state.rows[0].status).toBe("ACTIVE");
  });

  it("rejects consent evidence belonging to another client without consuming the hold", async () => {
    const hold = await createHold(6);

    await expect(
      createAppointmentRequest(
        requestInput(hold, "appointment-request-consent-idor", [
          ...fixture.consentIds,
          fixture.childConsentIds[0],
        ]),
        { now: requestNow },
      ),
    ).rejects.toMatchObject({
      code: "BOOKING_CONSENT_GATE_FAILED",
      issues: [{ code: "DOCUMENT_SUBJECT_MISMATCH" }],
    });

    const state = await pool.query<{ status: string }>(
      `SELECT status FROM appointment_holds WHERE id = $1`,
      [hold.holdId],
    );
    expect(state.rows[0].status).toBe("ACTIVE");
  });
});
