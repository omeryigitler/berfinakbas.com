import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAppointmentRequestMock, getServerEnvironmentMock } = vi.hoisted(() => ({
  createAppointmentRequestMock: vi.fn(),
  getServerEnvironmentMock: vi.fn(),
}));

vi.mock("@/lib/booking/appointment-request-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/booking/appointment-request-service")>()),
  createAppointmentRequest: createAppointmentRequestMock,
}));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import { BookingConsentGateError } from "@/domain/consent/booking-consent";
import {
  AppointmentHoldUnavailableError,
  BookingRequestConflictError,
} from "@/lib/booking/appointment-request-service";

import { POST } from "./route";

const validRequest = {
  clientId: "11111111-1111-4111-8111-111111111111",
  consentIds: ["22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333"],
  guardianId: null,
  holdId: "44444444-4444-4444-8444-444444444444",
  holderToken: "synthetic-holder-token-that-is-long-enough",
  requestNote: null,
};

function request(
  body: BodyInit = JSON.stringify(validRequest),
  headers: Record<string, string> = {},
) {
  return new Request("https://berfinakbas.com/api/public/appointments/requests", {
    body,
    headers: {
      "content-type": "application/json; charset=utf-8",
      origin: "https://berfinakbas.com",
      "x-correlation-id": "public-request-test",
      ...headers,
    },
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerEnvironmentMock.mockReturnValue({
    APP_URL: "https://berfinakbas.com",
    BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: ["EXPLICIT_CONSENT_RECORDING"],
    PUBLIC_APPOINTMENT_REQUESTS_ENABLED: true,
  });
});

describe("POST /api/public/appointments/requests", () => {
  it("fails closed before reading input or calling the service when disabled", async () => {
    getServerEnvironmentMock.mockReturnValue({
      APP_URL: "https://berfinakbas.com",
      BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: [],
      PUBLIC_APPOINTMENT_REQUESTS_ENABLED: false,
    });

    const response = await POST(request("{", { origin: "https://attacker.example" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: "BOOKING_REQUESTS_DISABLED",
      error: "Randevu talebi şu anda kullanıma açık değil.",
    });
    expect(createAppointmentRequestMock).not.toHaveBeenCalled();
  });

  it("rejects an untrusted or missing origin before parsing the body", async () => {
    for (const origin of ["https://attacker.example", ""]) {
      const response = await POST(request("{", { origin }));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({ code: "UNTRUSTED_ORIGIN" });
    }
    expect(createAppointmentRequestMock).not.toHaveBeenCalled();
  });

  it("requires an application/json content type", async () => {
    const response = await POST(
      request(JSON.stringify(validRequest), { "content-type": "text/plain" }),
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
    expect(createAppointmentRequestMock).not.toHaveBeenCalled();
  });

  it("rejects malformed and oversized JSON without calling the service", async () => {
    const malformedResponse = await POST(request("{"));
    const oversizedResponse = await POST(request(JSON.stringify({ value: "x".repeat(16_384) })));

    expect(malformedResponse.status).toBe(400);
    await expect(malformedResponse.json()).resolves.toMatchObject({ code: "INVALID_JSON" });
    expect(oversizedResponse.status).toBe(413);
    await expect(oversizedResponse.json()).resolves.toMatchObject({ code: "BODY_TOO_LARGE" });
    expect(createAppointmentRequestMock).not.toHaveBeenCalled();
  });

  it("rejects unknown or invalid fields with privacy-safe issue metadata", async () => {
    const response = await POST(
      request(JSON.stringify({ ...validRequest, clinicalHistory: "gönderilmemeli" })),
    );

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result).toMatchObject({ code: "INVALID_REQUEST" });
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "unrecognized_keys" })]),
    );
    expect(JSON.stringify(result)).not.toContain("gönderilmemeli");
    expect(createAppointmentRequestMock).not.toHaveBeenCalled();
  });

  it("passes only validated data and server-owned policy to the atomic service", async () => {
    const created = {
      appointmentId: "55555555-5555-4555-8555-555555555555",
      publicReference: "BR-ABC12345",
      status: "REQUESTED",
    };
    createAppointmentRequestMock.mockResolvedValue(created);

    const response = await POST(request());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: created });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-correlation-id")).toBe("public-request-test");
    expect(createAppointmentRequestMock).toHaveBeenCalledWith(
      { ...validRequest, correlationId: "public-request-test" },
      { requiredExplicitConsentDocumentTypes: ["EXPLICIT_CONSENT_RECORDING"] },
    );
  });

  it("replaces an unsafe correlation id before it reaches the service", async () => {
    createAppointmentRequestMock.mockResolvedValue({
      appointmentId: "55555555-5555-4555-8555-555555555555",
      publicReference: "BR-ABC12345",
      status: "REQUESTED",
    });

    const response = await POST(request(undefined, { "x-correlation-id": "unsafe value" }));
    const generatedCorrelationId = response.headers.get("x-correlation-id");

    expect(generatedCorrelationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(createAppointmentRequestMock).toHaveBeenCalledWith(
      { ...validRequest, correlationId: generatedCorrelationId },
      expect.any(Object),
    );
  });

  it.each([
    [new AppointmentHoldUnavailableError(), "HOLD_UNAVAILABLE"],
    [new BookingRequestConflictError(), "BOOKING_REQUEST_CONFLICT"],
    [new BookingResourceUnavailableError(), "BOOKING_RESOURCE_UNAVAILABLE"],
  ])("maps booking conflicts to a safe response", async (error, code) => {
    createAppointmentRequestMock.mockRejectedValue(error);

    const response = await POST(request());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code });
  });

  it("returns structured consent issues without request or identity data", async () => {
    createAppointmentRequestMock.mockRejectedValue(
      new BookingConsentGateError([{ code: "MISSING_DOCUMENT", documentType: "BOOKING_TERMS" }]),
    );

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(422);
    expect(result).toEqual({
      code: "BOOKING_CONSENT_GATE_FAILED",
      error: "Randevu için gerekli bilgilendirme, rıza veya veli doğrulaması eksik.",
      issues: [{ code: "MISSING_DOCUMENT", documentType: "BOOKING_TERMS" }],
    });
    expect(JSON.stringify(result)).not.toContain(validRequest.clientId);
    expect(JSON.stringify(result)).not.toContain(validRequest.holderToken);
  });
});
