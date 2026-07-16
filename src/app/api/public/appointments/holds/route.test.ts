import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkPublicBotProtectionMock, createAppointmentHoldMock, getServerEnvironmentMock } =
  vi.hoisted(() => ({
    checkPublicBotProtectionMock: vi.fn(),
    createAppointmentHoldMock: vi.fn(),
    getServerEnvironmentMock: vi.fn(),
  }));

vi.mock("@/lib/booking/appointment-hold-service", () => ({
  createAppointmentHold: createAppointmentHoldMock,
}));
vi.mock("@/lib/env", () => ({
  getServerEnvironment: getServerEnvironmentMock,
}));
vi.mock("@/lib/security/public-bot-protection", () => ({
  checkPublicBotProtection: checkPublicBotProtectionMock,
}));

import {
  BookingResourceUnavailableError,
  SlotConflictError,
} from "@/domain/booking/appointment-hold";

import { POST } from "./route";

const validRequest = {
  practitionerId: "11111111-1111-4111-8111-111111111111",
  serviceId: "22222222-2222-4222-8222-222222222222",
  startsAt: "2031-07-01T09:00:00.000Z",
};

function request(
  body: BodyInit = JSON.stringify(validRequest),
  headers: Record<string, string> = {},
) {
  return new Request("https://berfinakbas.com/api/public/appointments/holds", {
    body,
    headers: {
      "content-type": "application/json; charset=utf-8",
      origin: "https://berfinakbas.com",
      "x-correlation-id": "public-hold-test",
      ...headers,
    },
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  checkPublicBotProtectionMock.mockResolvedValue("allowed");
  getServerEnvironmentMock.mockReturnValue({
    APP_URL: "https://berfinakbas.com",
    BOOKING_HOLD_DURATION_MINUTES: 8,
    BOOKING_PUBLIC_PRACTITIONER_ID: "11111111-1111-4111-8111-111111111111",
    PUBLIC_APPOINTMENT_HOLDS_ENABLED: true,
    PUBLIC_BOOKING_FLOW_ENABLED: true,
  });
});

describe("POST /api/public/appointments/holds", () => {
  it("fails closed before reading input or calling the service when disabled", async () => {
    getServerEnvironmentMock.mockReturnValue({
      APP_URL: "https://berfinakbas.com",
      BOOKING_HOLD_DURATION_MINUTES: 8,
      BOOKING_PUBLIC_PRACTITIONER_ID: "11111111-1111-4111-8111-111111111111",
      PUBLIC_APPOINTMENT_HOLDS_ENABLED: false,
      PUBLIC_BOOKING_FLOW_ENABLED: true,
    });

    const response = await POST(request("{", { origin: "https://attacker.example" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: "BOOKING_HOLDS_DISABLED",
      error: "Randevu saati ayırma şu anda kullanıma açık değil.",
    });
    expect(checkPublicBotProtectionMock).not.toHaveBeenCalled();
    expect(createAppointmentHoldMock).not.toHaveBeenCalled();
  });

  it("rejects a practitioner other than the explicitly public practitioner", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          ...validRequest,
          practitionerId: "99999999-9999-4999-8999-999999999999",
        }),
      ),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "BOOKING_RESOURCE_UNAVAILABLE",
    });
    expect(createAppointmentHoldMock).not.toHaveBeenCalled();
  });

  it("rejects an untrusted or missing origin before parsing the body", async () => {
    for (const origin of ["https://attacker.example", ""]) {
      const response = await POST(request("{", { origin }));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        code: "UNTRUSTED_ORIGIN",
      });
    }
    expect(checkPublicBotProtectionMock).not.toHaveBeenCalled();
    expect(createAppointmentHoldMock).not.toHaveBeenCalled();
  });

  it("requires an application/json content type", async () => {
    const response = await POST(
      request(JSON.stringify(validRequest), { "content-type": "text/plain" }),
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(createAppointmentHoldMock).not.toHaveBeenCalled();
  });

  it.each([
    ["blocked", 403, "AUTOMATED_REQUEST_REJECTED"],
    ["unavailable", 503, "BOT_PROTECTION_UNAVAILABLE"],
  ])("fails closed when BotID is %s", async (result, status, code) => {
    checkPublicBotProtectionMock.mockResolvedValue(result);

    const response = await POST(request("{"));

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ code });
    expect(createAppointmentHoldMock).not.toHaveBeenCalled();
  });

  it("rejects malformed and oversized JSON without calling the service", async () => {
    const malformedResponse = await POST(request("{"));
    const oversizedResponse = await POST(request(JSON.stringify({ value: "x".repeat(4_096) })));

    expect(malformedResponse.status).toBe(400);
    await expect(malformedResponse.json()).resolves.toMatchObject({
      code: "INVALID_JSON",
    });
    expect(oversizedResponse.status).toBe(413);
    await expect(oversizedResponse.json()).resolves.toMatchObject({
      code: "BODY_TOO_LARGE",
    });
    expect(createAppointmentHoldMock).not.toHaveBeenCalled();
  });

  it("rejects unknown or invalid fields with privacy-safe issue metadata", async () => {
    const response = await POST(
      request(JSON.stringify({ ...validRequest, clinicalNote: "gönderilmemeli" })),
    );

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result).toMatchObject({ code: "INVALID_REQUEST" });
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "unrecognized_keys" })]),
    );
    expect(JSON.stringify(result)).not.toContain("gönderilmemeli");
    expect(createAppointmentHoldMock).not.toHaveBeenCalled();
  });

  it("passes only validated data and a safe correlation id to the hold service", async () => {
    createAppointmentHoldMock.mockResolvedValue({
      endsAt: new Date("2031-07-01T09:50:00.000Z"),
      expiresAt: new Date("2031-07-01T08:08:00.000Z"),
      holdId: "33333333-3333-4333-8333-333333333333",
      holderToken: "synthetic-holder-token-that-is-long-enough",
      startsAt: new Date(validRequest.startsAt),
    });

    const response = await POST(request());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        endsAt: "2031-07-01T09:50:00.000Z",
        expiresAt: "2031-07-01T08:08:00.000Z",
        holdId: "33333333-3333-4333-8333-333333333333",
        holderToken: "synthetic-holder-token-that-is-long-enough",
        startsAt: validRequest.startsAt,
      },
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-correlation-id")).toBe("public-hold-test");
    expect(createAppointmentHoldMock).toHaveBeenCalledWith({
      ...validRequest,
      correlationId: "public-hold-test",
      startsAt: new Date(validRequest.startsAt),
    });
  });

  it("replaces an unsafe correlation id before it reaches the service", async () => {
    createAppointmentHoldMock.mockResolvedValue({
      endsAt: new Date("2031-07-01T09:50:00.000Z"),
      expiresAt: new Date("2031-07-01T08:08:00.000Z"),
      holdId: "33333333-3333-4333-8333-333333333333",
      holderToken: "synthetic-holder-token-that-is-long-enough",
      startsAt: new Date(validRequest.startsAt),
    });

    const response = await POST(request(undefined, { "x-correlation-id": "unsafe value" }));
    const generatedCorrelationId = response.headers.get("x-correlation-id");

    expect(generatedCorrelationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(createAppointmentHoldMock).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: generatedCorrelationId }),
    );
  });

  it.each([
    [new SlotConflictError(), "SLOT_CONFLICT"],
    [new BookingResourceUnavailableError(), "BOOKING_RESOURCE_UNAVAILABLE"],
  ])("maps booking conflicts to a safe response", async (error, code) => {
    createAppointmentHoldMock.mockRejectedValue(error);

    const response = await POST(request());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code });
  });
});
