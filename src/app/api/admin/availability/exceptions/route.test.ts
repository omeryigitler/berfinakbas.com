import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  canAccessAvailabilityApiMock,
  createAvailabilityExceptionMock,
  getDatabaseMock,
  getServerEnvironmentMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  canAccessAvailabilityApiMock: vi.fn(),
  createAvailabilityExceptionMock: vi.fn(),
  getDatabaseMock: vi.fn(),
  getServerEnvironmentMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/availability/availability-api-access", () => ({
  canAccessAvailabilityApi: canAccessAvailabilityApiMock,
}));
vi.mock("@/lib/availability/availability-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/availability/availability-service")>()),
  createAvailabilityException: createAvailabilityExceptionMock,
}));
vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import { AvailabilityPractitionerUnavailableError } from "@/lib/availability/availability-service";

import { GET, POST } from "./route";

const practitionerId = "00000000-0000-4000-8000-000000000001";
const userId = "11111111-1111-4111-8111-111111111111";
const activeTherapist = {
  id: userId,
  roles: ["THERAPIST"],
  status: "ACTIVE",
};
const validMutation = {
  exception: {
    localDate: "2026-07-15",
    localEndTime: "13:00",
    localStartTime: "12:00",
    practitionerId,
    privateNote: null,
    reasonCode: "ADMIN_BLOCK",
    status: "ACTIVE",
    type: "BLOCKED",
  },
  reason: "Öğle saatine sentetik takvim bloğu ekleniyor.",
};

function getRequest(id = practitionerId) {
  return new Request(
    `https://berfinakbas.com/api/admin/availability/exceptions?practitionerId=${id}`,
  );
}

function postRequest(body: BodyInit, origin = "https://berfinakbas.com") {
  return new Request("https://berfinakbas.com/api/admin/availability/exceptions", {
    body,
    headers: {
      "content-type": "application/json",
      origin,
      "x-correlation-id": "exceptions-test-correlation",
    },
    method: "POST",
  });
}

function createDatabase() {
  return {
    availabilityException: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerEnvironmentMock.mockReturnValue({ APP_URL: "https://berfinakbas.com" });
});

describe("GET /api/admin/availability/exceptions", () => {
  it("rejects a missing or inactive session before parsing input", async () => {
    authMock.mockResolvedValue({ user: { ...activeTherapist, status: "SUSPENDED" } });

    const response = await GET(getRequest());

    expect(response.status).toBe(403);
    expect(canAccessAvailabilityApiMock).not.toHaveBeenCalled();
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid practitioner identifier", async () => {
    authMock.mockResolvedValue({ user: activeTherapist });

    const response = await GET(getRequest("not-a-uuid"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Uzman kimliği geçersiz." });
    expect(canAccessAvailabilityApiMock).not.toHaveBeenCalled();
  });

  it("rejects access outside the role and practitioner boundary", async () => {
    authMock.mockResolvedValue({ user: activeTherapist });
    canAccessAvailabilityApiMock.mockResolvedValue(false);

    const response = await GET(getRequest());

    expect(response.status).toBe(403);
    expect(canAccessAvailabilityApiMock).toHaveBeenCalledWith({
      mode: "read",
      practitionerId,
      roles: ["THERAPIST"],
      userId,
    });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it("returns ordered exceptions after access is granted", async () => {
    const database = createDatabase();
    const exceptions = [{ id: "exception-1", localDate: "2026-07-15", type: "BLOCKED" }];
    database.availabilityException.findMany.mockResolvedValue(exceptions);
    authMock.mockResolvedValue({ user: activeTherapist });
    canAccessAvailabilityApiMock.mockResolvedValue(true);
    getDatabaseMock.mockReturnValue(database);

    const response = await GET(getRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: exceptions });
    expect(database.availabilityException.findMany).toHaveBeenCalledWith({
      orderBy: [{ localDate: "asc" }, { localStartTime: "asc" }, { createdAt: "asc" }],
      where: { practitionerId },
    });
  });
});

describe("POST /api/admin/availability/exceptions", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: activeTherapist });
  });

  it("rejects an untrusted origin before parsing the body", async () => {
    const response = await POST(
      postRequest(JSON.stringify(validMutation), "https://attacker.example"),
    );

    expect(response.status).toBe(403);
    expect(canAccessAvailabilityApiMock).not.toHaveBeenCalled();
    expect(createAvailabilityExceptionMock).not.toHaveBeenCalled();
  });

  it("returns a safe 400 response for malformed JSON", async () => {
    const response = await POST(postRequest("{"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "İstek gövdesi geçerli JSON olmalıdır.",
    });
    expect(canAccessAvailabilityApiMock).not.toHaveBeenCalled();
  });

  it("rejects invalid exception input without checking access or writing", async () => {
    const invalidMutation = {
      ...validMutation,
      exception: { ...validMutation.exception, localEndTime: "11:00" },
    };

    const response = await POST(postRequest(JSON.stringify(invalidMutation)));

    expect(response.status).toBe(400);
    expect(canAccessAvailabilityApiMock).not.toHaveBeenCalled();
    expect(createAvailabilityExceptionMock).not.toHaveBeenCalled();
  });

  it("rejects a valid mutation outside the practitioner boundary", async () => {
    canAccessAvailabilityApiMock.mockResolvedValue(false);

    const response = await POST(postRequest(JSON.stringify(validMutation)));

    expect(response.status).toBe(403);
    expect(canAccessAvailabilityApiMock).toHaveBeenCalledWith({
      mode: "manage",
      practitionerId,
      roles: ["THERAPIST"],
      userId,
    });
    expect(createAvailabilityExceptionMock).not.toHaveBeenCalled();
  });

  it("maps an unavailable practitioner to a safe conflict response", async () => {
    canAccessAvailabilityApiMock.mockResolvedValue(true);
    createAvailabilityExceptionMock.mockRejectedValue(
      new AvailabilityPractitionerUnavailableError(),
    );

    const response = await POST(postRequest(JSON.stringify(validMutation)));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Uzman çalışma takvimi değişikliği için uygun değil.",
    });
  });

  it("passes validated actor and correlation context to the service", async () => {
    const createdException = { id: "exception-1", ...validMutation.exception };
    canAccessAvailabilityApiMock.mockResolvedValue(true);
    createAvailabilityExceptionMock.mockResolvedValue(createdException);

    const response = await POST(postRequest(JSON.stringify(validMutation)));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: createdException });
    expect(createAvailabilityExceptionMock).toHaveBeenCalledWith({
      actorUserId: userId,
      correlationId: "exceptions-test-correlation",
      exception: validMutation.exception,
      reason: validMutation.reason,
    });
  });
});
