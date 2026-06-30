import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("Consent integration testleri için TEST_DATABASE_URL zorunludur.");
}

const parsedDatabaseUrl = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\//, ""));
if (!/(?:test|integration)/i.test(databaseName)) {
  throw new Error("Consent integration testleri yalnızca test/integration veritabanında çalışır.");
}

const pool = new Pool({ connectionString: testDatabaseUrl, max: 2 });
const fixture = {
  clientId: randomUUID(),
  consentId: randomUUID(),
  documentId: randomUUID(),
  guardianId: randomUUID(),
};

beforeAll(async () => {
  await pool.query(
    `INSERT INTO clients (id, type, first_name, last_name, status, updated_at)
     VALUES ($1, 'CHILD', 'Sentetik', 'Çocuk', 'PROSPECTIVE', NOW())`,
    [fixture.clientId],
  );
  await pool.query(
    `INSERT INTO guardians (id, first_name, last_name, phone, updated_at)
     VALUES ($1, 'Sentetik', 'Veli', '+900000000000', NOW())`,
    [fixture.guardianId],
  );
  await pool.query(
    `INSERT INTO client_guardians (
       client_id, guardian_id, relationship, authority_verified_at, verification_note
     ) VALUES ($1, $2, 'PARENT', NOW(), 'Sentetik doğrulama')`,
    [fixture.clientId, fixture.guardianId],
  );
  await pool.query(
    `INSERT INTO consent_documents (
       id, type, version, content_hash, effective_from
     ) VALUES ($1, 'PRIVACY_NOTICE', 'integration-v1', $2, NOW())`,
    [fixture.documentId, `sha256:${"0".repeat(64)}`],
  );
});

afterAll(async () => {
  await pool.query(`DELETE FROM consents WHERE document_id = $1`, [fixture.documentId]);
  await pool.query(`DELETE FROM consent_documents WHERE id = $1`, [fixture.documentId]);
  await pool.query(`DELETE FROM client_guardians WHERE client_id = $1`, [fixture.clientId]);
  await pool.query(`DELETE FROM guardians WHERE id = $1`, [fixture.guardianId]);
  await pool.query(`DELETE FROM clients WHERE id = $1`, [fixture.clientId]);
  await pool.end();
});

describe.sequential("consent guardian PostgreSQL integrity", () => {
  it("stores a child as subject and the declaring guardian as a separate grantor", async () => {
    await pool.query(
      `INSERT INTO consents (
         id, client_id, granted_by_guardian_id, document_id,
         capture_channel, evidence_metadata
       ) VALUES ($1, $2, $3, $4, 'WEB', $5)`,
      [
        fixture.consentId,
        fixture.clientId,
        fixture.guardianId,
        fixture.documentId,
        JSON.stringify({ synthetic: true }),
      ],
    );

    const persisted = await pool.query<{
      client_id: string;
      granted_by_guardian_id: string;
      guardian_id: string | null;
    }>(
      `SELECT client_id, guardian_id, granted_by_guardian_id
       FROM consents WHERE id = $1`,
      [fixture.consentId],
    );

    expect(persisted.rows[0]).toEqual({
      client_id: fixture.clientId,
      granted_by_guardian_id: fixture.guardianId,
      guardian_id: null,
    });
  });

  it("rejects a guardian grantor when the consent subject is not a client", async () => {
    const invalidConsentId = randomUUID();
    const attempt = pool.query(
      `INSERT INTO consents (
         id, guardian_id, granted_by_guardian_id, document_id, capture_channel
       ) VALUES ($1, $2, $2, $3, 'WEB')`,
      [invalidConsentId, fixture.guardianId, fixture.documentId],
    );

    await expect(attempt).rejects.toMatchObject({
      code: "23514",
      constraint: "consents_guardian_grantor_requires_client",
    });
  });
});
