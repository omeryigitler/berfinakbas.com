import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  canManageAppointmentApiMock,
  getServerEnvironmentMock,
  resolveAppointmentDuplicateReviewMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  canManageAppointmentApiMock: vi.fn(),
  getServerEnvironmentMock: vi.fn(),
  resolveAppointmentDuplicateReviewMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/booking/appointment-api-access", () => ({
  canManageAppointmentApi: canManageAppointmentApiMock,
}));
vi.mock("@/lib/clients/appointment-duplicate-review-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/clients/appointment-duplicate-review-service")>()),
  resolveAppointmentDuplicateReview: resolveAppointmentDuplicateReviewMock,
}));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import {
  DuplicateReviewConflictError,
  DuplicateReviewNotFoundError,
} from "@/lib/clients/appointment-duplicate-review-service";

import { PATCH } from "./route";

const appointmentId = "22222222-2222-4222-8222-222222222222";
const userId = "11111111-1111-4111-8111-111111111111";

function request(body: BodyInit, origin = "https://berfinakbas.com") {
  return new Request(
    `https://berfinakbas.com/api/admin/appointments/${appointmentId}/duplicate-review`,
    {
      body,
      headers: { "content-type": "application/json", origin },
      method: "PATCH",
    },
  );
}

function context(id = appointmentId) {
  return { params: Promise.resolve({ appointmentId: id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({
    user: { id: userId, roles: ["THERAPIST"], status: "ACTIVE" },
  });
  getServerEnvironmentMock.mockReturnValue({ APP_URL: "https://berfinakbas.com" });
});

describe("PATCH duplicate review", () => {
  it("rejects missing sessions and untrusted origins before writes", async () => {
    authMock.mockResolvedValue(null);
    expect((await PATCH(request("{}"), context())).status).toBe(403);

    authMock.mockResolvedValue({
      user: { id: userId, roles: ["THERAPIST"], status: "ACTIVE" },
    });
    expect((await PATCH(request("{}", "https://attacker.example"), context())).status).toBe(403);
    expect(resolveAppointmentDuplicateReviewMock).not.toHaveBeenCalled();
  });

  it("rejects invalid identifiers and decisions", async () => {
    expect(
      (await PATCH(request(JSON.stringify({ action: "KEEP_SEPARATE" })), context("bad"))).status,
    ).toBe(400);
    expect(
      (await PATCH(request(JSON.stringify({ action: "LINK_EXISTING" })), context())).status,
    ).toBe(400);
    expect(canManageAppointmentApiMock).not.toHaveBeenCalled();
  });

  it("checks appointment scope before resolving the review", async () => {
    canManageAppointmentApiMock.mockResolvedValue(false);

    const response = await PATCH(request(JSON.stringify({ action: "KEEP_SEPARATE" })), context());

    expect(response.status).toBe(403);
    expect(resolveAppointmentDuplicateReviewMock).not.toHaveBeenCalled();
  });

  it("passes a validated explicit decision to the service", async () => {
    const resolution = {
      appointmentId,
      clientId: "33333333-3333-4333-8333-333333333333",
      status: "LINKED_EXISTING",
      targetClientId: "33333333-3333-4333-8333-333333333333",
    };
    canManageAppointmentApiMock.mockResolvedValue(true);
    resolveAppointmentDuplicateReviewMock.mockResolvedValue(resolution);

    const response = await PATCH(
      request(
        JSON.stringify({
          action: "LINK_EXISTING",
          targetClientId: resolution.targetClientId,
        }),
      ),
      context(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: resolution });
    expect(resolveAppointmentDuplicateReviewMock).toHaveBeenCalledWith({
      action: "LINK_EXISTING",
      actorUserId: userId,
      appointmentId,
      correlationId: expect.any(String),
      targetClientId: resolution.targetClientId,
    });
  });

  it.each([
    [new DuplicateReviewNotFoundError(), 404],
    [new DuplicateReviewConflictError(), 409],
  ])("maps safe service errors", async (error, status) => {
    canManageAppointmentApiMock.mockResolvedValue(true);
    resolveAppointmentDuplicateReviewMock.mockRejectedValue(error);

    const response = await PATCH(request(JSON.stringify({ action: "KEEP_SEPARATE" })), context());

    expect(response.status).toBe(status);
  });
});
