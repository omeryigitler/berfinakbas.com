import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  canManageAppointmentApiMock,
  getServerEnvironmentMock,
  transitionAppointmentMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  canManageAppointmentApiMock: vi.fn(),
  getServerEnvironmentMock: vi.fn(),
  transitionAppointmentMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/booking/appointment-api-access", () => ({
  canManageAppointmentApi: canManageAppointmentApiMock,
}));
vi.mock("@/lib/booking/appointment-transition-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/booking/appointment-transition-service")>()),
  transitionAppointment: transitionAppointmentMock,
}));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import {
  AppointmentDuplicateReviewRequiredError,
  AppointmentNotFoundError,
  AppointmentTransitionConflictError,
} from "@/lib/booking/appointment-transition-service";

import { PATCH } from "./route";

const appointmentId = "22222222-2222-4222-8222-222222222222";
const userId = "11111111-1111-4111-8111-111111111111";
const activeTherapist = { id: userId, roles: ["THERAPIST"], status: "ACTIVE" };
const validMutation = {
  note: "Sentetik durum geçiş notu",
  reasonCode: "ADMIN_REVIEW_STARTED",
  toStatus: "PENDING_REVIEW",
};

function request(body: BodyInit, origin = "https://berfinakbas.com") {
  return new Request(`https://berfinakbas.com/api/admin/appointments/${appointmentId}/status`, {
    body,
    headers: {
      "content-type": "application/json",
      origin,
      "x-correlation-id": "appointment-status-test",
    },
    method: "PATCH",
  });
}

function context(id = appointmentId) {
  return { params: Promise.resolve({ appointmentId: id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerEnvironmentMock.mockReturnValue({ APP_URL: "https://berfinakbas.com" });
  authMock.mockResolvedValue({ user: activeTherapist });
});

describe("PATCH /api/admin/appointments/[appointmentId]/status", () => {
  it.each([
    ["missing", null],
    ["suspended", { user: { ...activeTherapist, status: "SUSPENDED" } }],
  ])("rejects a %s session before reading request input", async (_label, session) => {
    authMock.mockResolvedValue(session);

    const response = await PATCH(request(JSON.stringify(validMutation)), context());

    expect(response.status).toBe(403);
    expect(canManageAppointmentApiMock).not.toHaveBeenCalled();
    expect(transitionAppointmentMock).not.toHaveBeenCalled();
  });

  it("rejects an untrusted origin before parsing identifiers or body", async () => {
    const response = await PATCH(
      request(JSON.stringify(validMutation), "https://attacker.example"),
      context(),
    );

    expect(response.status).toBe(403);
    expect(canManageAppointmentApiMock).not.toHaveBeenCalled();
  });

  it("returns a safe 400 response for an invalid appointment identifier", async () => {
    const response = await PATCH(request(JSON.stringify(validMutation)), context("not-a-uuid"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Randevu kimliği geçersiz." });
    expect(canManageAppointmentApiMock).not.toHaveBeenCalled();
  });

  it("returns a safe 400 response for malformed JSON", async () => {
    const response = await PATCH(request("{"), context());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "İstek gövdesi geçerli JSON olmalıdır.",
    });
    expect(canManageAppointmentApiMock).not.toHaveBeenCalled();
  });

  it("rejects invalid transition input before access checks or writes", async () => {
    const response = await PATCH(
      request(JSON.stringify({ ...validMutation, toStatus: "UNKNOWN" })),
      context(),
    );

    expect(response.status).toBe(400);
    expect(canManageAppointmentApiMock).not.toHaveBeenCalled();
    expect(transitionAppointmentMock).not.toHaveBeenCalled();
  });

  it("rejects another practitioner's appointment without calling the service", async () => {
    canManageAppointmentApiMock.mockResolvedValue(false);

    const response = await PATCH(request(JSON.stringify(validMutation)), context());

    expect(response.status).toBe(403);
    expect(canManageAppointmentApiMock).toHaveBeenCalledWith({
      appointmentId,
      roles: ["THERAPIST"],
      userId,
    });
    expect(transitionAppointmentMock).not.toHaveBeenCalled();
  });

  it("maps a missing appointment to a safe not-found response", async () => {
    canManageAppointmentApiMock.mockResolvedValue(true);
    transitionAppointmentMock.mockRejectedValue(new AppointmentNotFoundError());

    const response = await PATCH(request(JSON.stringify(validMutation)), context());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Randevu bulunamadı." });
  });

  it("maps an invalid or raced transition to a safe conflict response", async () => {
    canManageAppointmentApiMock.mockResolvedValue(true);
    transitionAppointmentMock.mockRejectedValue(new AppointmentTransitionConflictError());

    const response = await PATCH(request(JSON.stringify(validMutation)), context());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Randevu durumu değişti veya istenen geçişe izin verilmiyor.",
    });
  });

  it("returns a safe conflict when duplicate review is required", async () => {
    canManageAppointmentApiMock.mockResolvedValue(true);
    transitionAppointmentMock.mockRejectedValue(new AppointmentDuplicateReviewRequiredError());

    const response = await PATCH(request(JSON.stringify(validMutation)), context());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "DUPLICATE_REVIEW_REQUIRED",
      error: "Olası mükerrer danışan kaydı incelenmeden randevu onaylanamaz.",
    });
  });

  it("passes validated actor and correlation context to the transition service", async () => {
    const transition = {
      appointmentId,
      fromStatus: "REQUESTED",
      toStatus: "PENDING_REVIEW",
    };
    canManageAppointmentApiMock.mockResolvedValue(true);
    transitionAppointmentMock.mockResolvedValue(transition);

    const response = await PATCH(request(JSON.stringify(validMutation)), context());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: transition });
    expect(transitionAppointmentMock).toHaveBeenCalledWith({
      ...validMutation,
      actorUserId: userId,
      appointmentId,
      correlationId: "appointment-status-test",
    });
  });
});
