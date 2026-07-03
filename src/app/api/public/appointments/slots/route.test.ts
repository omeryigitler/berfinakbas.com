import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerEnvironmentMock, listPublicAppointmentSlotsMock } = vi.hoisted(() => ({
  getServerEnvironmentMock: vi.fn(),
  listPublicAppointmentSlotsMock: vi.fn(),
}));

vi.mock("@/lib/booking/public-appointment-slots-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/booking/public-appointment-slots-service")>()),
  listPublicAppointmentSlots: listPublicAppointmentSlotsMock,
}));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";

import { GET } from "./route";

const validQuery =
  "localDate=2031-06-02&practitionerId=11111111-1111-4111-8111-111111111111" +
  "&serviceId=22222222-2222-4222-8222-222222222222";

function request(query = validQuery, correlationId = "public-slots-test") {
  return new Request(`https://berfinakbas.com/api/public/appointments/slots?${query}`, {
    headers: { "x-correlation-id": correlationId },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerEnvironmentMock.mockReturnValue({
    BOOKING_PUBLIC_PRACTITIONER_ID: "11111111-1111-4111-8111-111111111111",
    PUBLIC_APPOINTMENT_SLOTS_ENABLED: true,
    PUBLIC_BOOKING_FLOW_ENABLED: true,
  });
});

describe("GET /api/public/appointments/slots", () => {
  it("fails closed before validating input or calling the service when disabled", async () => {
    getServerEnvironmentMock.mockReturnValue({
      BOOKING_PUBLIC_PRACTITIONER_ID: "11111111-1111-4111-8111-111111111111",
      PUBLIC_APPOINTMENT_SLOTS_ENABLED: false,
      PUBLIC_BOOKING_FLOW_ENABLED: true,
    });

    const response = await GET(request("unexpected=secret"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: "BOOKING_SLOTS_DISABLED",
      error: "Randevu saatleri şu anda kullanıma açık değil.",
    });
    expect(listPublicAppointmentSlotsMock).not.toHaveBeenCalled();
  });

  it("rejects a practitioner other than the explicitly public practitioner", async () => {
    const response = await GET(
      request(
        validQuery.replace(
          "11111111-1111-4111-8111-111111111111",
          "99999999-9999-4999-8999-999999999999",
        ),
      ),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "BOOKING_RESOURCE_UNAVAILABLE",
    });
    expect(listPublicAppointmentSlotsMock).not.toHaveBeenCalled();
  });

  it.each([
    ["localDate=2031-02-30", "invalid calendar date"],
    [`${validQuery}&unexpected=secret`, "unknown field"],
    [`${validQuery}&localDate=2031-06-03`, "duplicate field"],
  ])("rejects an invalid strict query: %s", async (query) => {
    const response = await GET(request(query));

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result).toMatchObject({ code: "INVALID_REQUEST" });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(listPublicAppointmentSlotsMock).not.toHaveBeenCalled();
  });

  it("returns only UTC start and end times without caching", async () => {
    listPublicAppointmentSlotsMock.mockResolvedValue([
      {
        endsAt: new Date("2031-06-02T07:20:00.000Z"),
        startsAt: new Date("2031-06-02T06:30:00.000Z"),
      },
    ]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          endsAt: "2031-06-02T07:20:00.000Z",
          startsAt: "2031-06-02T06:30:00.000Z",
        },
      ],
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-correlation-id")).toBe("public-slots-test");
    expect(listPublicAppointmentSlotsMock).toHaveBeenCalledWith({
      localDate: "2031-06-02",
      practitionerId: "11111111-1111-4111-8111-111111111111",
      serviceId: "22222222-2222-4222-8222-222222222222",
    });
  });

  it("replaces an unsafe correlation id", async () => {
    listPublicAppointmentSlotsMock.mockResolvedValue([]);

    const response = await GET(request(validQuery, "unsafe value"));
    const correlationId = response.headers.get("x-correlation-id");

    expect(correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("maps unavailable or ambiguous booking configuration to a safe error", async () => {
    listPublicAppointmentSlotsMock.mockRejectedValue(new BookingResourceUnavailableError());

    const response = await GET(request());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "BOOKING_RESOURCE_UNAVAILABLE",
    });
  });
});
