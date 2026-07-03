import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerEnvironmentMock, submitPublicBookingRequestMock } = vi.hoisted(() => ({
  getServerEnvironmentMock: vi.fn(),
  submitPublicBookingRequestMock: vi.fn(),
}));

vi.mock("@/lib/booking/public-booking-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/booking/public-booking-service")>()),
  submitPublicBookingRequest: submitPublicBookingRequestMock,
}));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import { BookingConsentGateError } from "@/domain/consent/booking-consent";
import {
  AppointmentHoldUnavailableError,
  BookingRequestConflictError,
} from "@/lib/booking/appointment-request-service";

import { POST } from "./route";

const publicPractitionerId = "11111111-1111-4111-8111-111111111111";
const validRequest = {
  acknowledgedDocumentIds: [
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
  ],
  holdId: "44444444-4444-4444-8444-444444444444",
  holderToken: "synthetic-holder-token-that-is-long-enough",
  subject: {
    email: "adult@example.test",
    firstName: "Test",
    lastName: "Adult",
    phone: "+90 555 000 00 00",
    type: "ADULT",
  },
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
    BOOKING_PUBLIC_PRACTITIONER_ID: publicPractitionerId,
    BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: ["EXPLICIT_CONSENT_RECORDING"],
    PUBLIC_APPOINTMENT_REQUESTS_ENABLED: true,
    PUBLIC_BOOKING_FLOW_ENABLED: true,
  });
});

describe("POST /api/public/appointments/requests", () => {
  it("fails closed before reading input or calling the service when disabled", async () => {
    getServerEnvironmentMock.mockReturnValue({
      APP_URL: "https://berfinakbas.com",
      BOOKING_PUBLIC_PRACTITIONER_ID: publicPractitionerId,
      BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: [],
      PUBLIC_APPOINTMENT_REQUESTS_ENABLED: true,
      PUBLIC_BOOKING_FLOW_ENABLED: false,
    });

    const response = await POST(request("{", { origin: "https://attacker.example" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: "BOOKING_REQUESTS_DISABLED" });
    expect(submitPublicBookingRequestMock).not.toHaveBeenCalled();
  });

  it("rejects an untrusted or missing origin before parsing the body", async () => {
    for (const origin of ["https://attacker.example", ""]) {
      const response = await POST(request("{", { origin }));
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({ code: "UNTRUSTED_ORIGIN" });
    }
    expect(submitPublicBookingRequestMock).not.toHaveBeenCalled();
  });

  it("requires JSON and enforces the body size limit", async () => {
    const mediaResponse = await POST(
      request(JSON.stringify(validRequest), { "content-type": "text/plain" }),
    );
    const oversizedResponse = await POST(request(JSON.stringify({ value: "x".repeat(16_384) })));

    expect(mediaResponse.status).toBe(415);
    expect(oversizedResponse.status).toBe(413);
    expect(submitPublicBookingRequestMock).not.toHaveBeenCalled();
  });

  it("rejects malformed, unknown, or unnecessary sensitive fields", async () => {
    const malformedResponse = await POST(request("{"));
    const unknownResponse = await POST(
      request(JSON.stringify({ ...validRequest, clinicalHistory: "gönderilmemeli" })),
    );

    expect(malformedResponse.status).toBe(400);
    const result = await unknownResponse.json();
    expect(unknownResponse.status).toBe(400);
    expect(result).toMatchObject({ code: "INVALID_REQUEST" });
    expect(JSON.stringify(result)).not.toContain("gönderilmemeli");
    expect(submitPublicBookingRequestMock).not.toHaveBeenCalled();
  });

  it("passes only validated intake data and server-owned policy to the atomic service", async () => {
    const created = {
      appointmentId: "55555555-5555-4555-8555-555555555555",
      publicReference: "BR-ABC12345",
      status: "REQUESTED",
    };
    submitPublicBookingRequestMock.mockResolvedValue(created);

    const response = await POST(request());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: created });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(submitPublicBookingRequestMock).toHaveBeenCalledWith(
      { ...validRequest, correlationId: "public-request-test" },
      {
        publicPractitionerId,
        requiredExplicitConsentDocumentTypes: ["EXPLICIT_CONSENT_RECORDING"],
      },
    );
  });

  it.each([
    [new AppointmentHoldUnavailableError(), "HOLD_UNAVAILABLE"],
    [new BookingRequestConflictError(), "BOOKING_REQUEST_CONFLICT"],
    [new BookingResourceUnavailableError(), "BOOKING_RESOURCE_UNAVAILABLE"],
  ])("maps booking conflicts to a safe response", async (error, code) => {
    submitPublicBookingRequestMock.mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code });
  });

  it("returns consent issues without identity or token data", async () => {
    submitPublicBookingRequestMock.mockRejectedValue(
      new BookingConsentGateError([{ code: "MISSING_DOCUMENT", documentType: "BOOKING_TERMS" }]),
    );

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(422);
    expect(result).toMatchObject({ code: "BOOKING_CONSENT_GATE_FAILED" });
    expect(JSON.stringify(result)).not.toContain(validRequest.subject.firstName);
    expect(JSON.stringify(result)).not.toContain(validRequest.holderToken);
  });
});
