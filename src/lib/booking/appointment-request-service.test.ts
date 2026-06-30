import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock } = vi.hoisted(() => ({ getDatabaseMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import {
  createAppointmentRequest,
  createPublicAppointmentReference,
} from "./appointment-request-service";

const validInput = {
  clientId: "11111111-1111-4111-8111-111111111111",
  consentIds: ["22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333"],
  correlationId: "sentetik-request",
  guardianId: null,
  holdId: "44444444-4444-4444-8444-444444444444",
  holderToken: "sentetik-holder-token-en-az-otuz-iki-karakter",
  requestNote: null,
};

beforeEach(() => {
  getDatabaseMock.mockReset();
});

describe("appointment request boundary", () => {
  it("creates non-sequential public references without exposing database IDs", () => {
    const left = createPublicAppointmentReference();
    const right = createPublicAppointmentReference();

    expect(left).toMatch(/^BR-[A-F0-9]{20}$/);
    expect(right).toMatch(/^BR-[A-F0-9]{20}$/);
    expect(left).not.toBe(right);
  });

  it("rejects duplicate consent IDs before opening a transaction", async () => {
    await expect(
      createAppointmentRequest({
        ...validInput,
        consentIds: [validInput.consentIds[0], validInput.consentIds[0]],
      }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it("rejects invalid server-side explicit-consent configuration before a transaction", async () => {
    await expect(
      createAppointmentRequest(validInput, {
        requiredExplicitConsentDocumentTypes: ["not-safe"],
      }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });
});
