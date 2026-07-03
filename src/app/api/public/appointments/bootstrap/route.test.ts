import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicBookingBootstrapMock, getServerEnvironmentMock } = vi.hoisted(() => ({
  getPublicBookingBootstrapMock: vi.fn(),
  getServerEnvironmentMock: vi.fn(),
}));

vi.mock("@/lib/booking/public-booking-service", () => ({
  getPublicBookingBootstrap: getPublicBookingBootstrapMock,
}));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";

import { GET } from "./route";

const practitionerId = "11111111-1111-4111-8111-111111111111";

function request() {
  return new Request("https://berfinakbas.com/api/public/appointments/bootstrap", {
    headers: { "x-correlation-id": "bootstrap-test" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerEnvironmentMock.mockReturnValue({
    BOOKING_HOLD_DURATION_MINUTES: 8,
    BOOKING_PUBLIC_PRACTITIONER_ID: practitionerId,
    BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: [],
    PUBLIC_APPOINTMENT_HOLDS_ENABLED: true,
    PUBLIC_APPOINTMENT_REQUESTS_ENABLED: true,
    PUBLIC_APPOINTMENT_SLOTS_ENABLED: true,
    PUBLIC_BOOKING_FLOW_ENABLED: true,
  });
});

describe("GET /api/public/appointments/bootstrap", () => {
  it("fails closed unless the complete public flow is configured", async () => {
    getServerEnvironmentMock.mockReturnValue({
      BOOKING_HOLD_DURATION_MINUTES: 8,
      BOOKING_PUBLIC_PRACTITIONER_ID: practitionerId,
      BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: [],
      PUBLIC_APPOINTMENT_HOLDS_ENABLED: true,
      PUBLIC_APPOINTMENT_REQUESTS_ENABLED: false,
      PUBLIC_APPOINTMENT_SLOTS_ENABLED: true,
      PUBLIC_BOOKING_FLOW_ENABLED: true,
    });

    const response = await GET(request());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: "BOOKING_FLOW_DISABLED" });
    expect(getPublicBookingBootstrapMock).not.toHaveBeenCalled();
  });

  it("returns public service, practitioner, and approved document presentation data", async () => {
    const bootstrap = {
      consentDocuments: [
        {
          content: "Synthetic privacy notice.",
          contentHash: "synthetic-hash",
          id: "22222222-2222-4222-8222-222222222222",
          title: "Aydınlatma metni",
          type: "PRIVACY_NOTICE",
          version: "test-v1",
        },
      ],
      practitioner: { displayName: "Test Uzmanı", id: practitionerId, timeZone: "Europe/Istanbul" },
      services: [],
    };
    getPublicBookingBootstrapMock.mockResolvedValue(bootstrap);

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: bootstrap });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-correlation-id")).toBe("bootstrap-test");
    expect(getPublicBookingBootstrapMock).toHaveBeenCalledWith(practitionerId, []);
  });

  it("maps missing or ambiguous public configuration to a safe response", async () => {
    getPublicBookingBootstrapMock.mockRejectedValue(new BookingResourceUnavailableError());

    const response = await GET(request());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "BOOKING_RESOURCE_UNAVAILABLE",
    });
  });
});
