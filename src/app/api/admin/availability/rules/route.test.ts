import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  canAccessAvailabilityApiMock,
  createAvailabilityRuleMock,
  getDatabaseMock,
  getServerEnvironmentMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  canAccessAvailabilityApiMock: vi.fn(),
  createAvailabilityRuleMock: vi.fn(),
  getDatabaseMock: vi.fn(),
  getServerEnvironmentMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/availability/availability-api-access", () => ({
  canAccessAvailabilityApi: canAccessAvailabilityApiMock,
}));
vi.mock("@/lib/availability/availability-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/availability/availability-service")>()),
  createAvailabilityRule: createAvailabilityRuleMock,
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
  reason: "Haftalık çalışma saatleri tanımlanıyor.",
  rule: {
    localEndTime: "17:00",
    localStartTime: "09:00",
    practitionerId,
    slotIncrementMinutes: 15,
    validFrom: "2026-07-01",
    validUntil: null,
    weekday: 1,
  },
};

function getRequest(id = practitionerId) {
  return new Request(`https://berfinakbas.com/api/admin/availability/rules?practitionerId=${id}`);
}

function postRequest(body: BodyInit, origin = "https://berfinakbas.com") {
  return new Request("https://berfinakbas.com/api/admin/availability/rules", {
    body,
    headers: {
      "content-type": "application/json",
      origin,
      "x-correlation-id": "rules-test-correlation",
    },
    method: "POST",
  });
}

function createDatabase() {
  return {
    availabilityRule: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerEnvironmentMock.mockReturnValue({ APP_URL: "https://berfinakbas.com" });
});

describe("GET /api/admin/availability/rules", () => {
  it("rejects a missing or inactive session before parsing input", async () => {
    authMock.mockResolvedValue(null);

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

  it("returns ordered rules after access is granted", async () => {
    const database = createDatabase();
    const rules = [{ id: "rule-1", localStartTime: "09:00", weekday: 1 }];
    database.availabilityRule.findMany.mockResolvedValue(rules);
    authMock.mockResolvedValue({ user: activeTherapist });
    canAccessAvailabilityApiMock.mockResolvedValue(true);
    getDatabaseMock.mockReturnValue(database);

    const response = await GET(getRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: rules });
    expect(database.availabilityRule.findMany).toHaveBeenCalledWith({
      orderBy: [{ weekday: "asc" }, { localStartTime: "asc" }, { createdAt: "asc" }],
      where: { practitionerId },
    });
  });
});

describe("POST /api/admin/availability/rules", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: activeTherapist });
  });

  it("rejects an untrusted origin before parsing the body", async () => {
    const response = await POST(
      postRequest(JSON.stringify(validMutation), "https://attacker.example"),
    );

    expect(response.status).toBe(403);
    expect(canAccessAvailabilityApiMock).not.toHaveBeenCalled();
    expect(createAvailabilityRuleMock).not.toHaveBeenCalled();
  });

  it("returns a safe 400 response for malformed JSON", async () => {
    const response = await POST(postRequest("{"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "İstek gövdesi geçerli JSON olmalıdır.",
    });
    expect(canAccessAvailabilityApiMock).not.toHaveBeenCalled();
  });

  it("rejects invalid rule input without checking access or writing", async () => {
    const response = await POST(
      postRequest(
        JSON.stringify({ ...validMutation, rule: { ...validMutation.rule, weekday: 8 } }),
      ),
    );

    expect(response.status).toBe(400);
    expect(canAccessAvailabilityApiMock).not.toHaveBeenCalled();
    expect(createAvailabilityRuleMock).not.toHaveBeenCalled();
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
    expect(createAvailabilityRuleMock).not.toHaveBeenCalled();
  });

  it("maps an unavailable practitioner to a safe conflict response", async () => {
    canAccessAvailabilityApiMock.mockResolvedValue(true);
    createAvailabilityRuleMock.mockRejectedValue(new AvailabilityPractitionerUnavailableError());

    const response = await POST(postRequest(JSON.stringify(validMutation)));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Uzman çalışma takvimi değişikliği için uygun değil.",
    });
  });

  it("passes validated actor and correlation context to the service", async () => {
    const createdRule = { id: "rule-1", ...validMutation.rule, status: "ACTIVE" };
    canAccessAvailabilityApiMock.mockResolvedValue(true);
    createAvailabilityRuleMock.mockResolvedValue(createdRule);

    const response = await POST(postRequest(JSON.stringify(validMutation)));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: createdRule });
    expect(createAvailabilityRuleMock).toHaveBeenCalledWith({
      actorUserId: userId,
      correlationId: "rules-test-correlation",
      reason: validMutation.reason,
      rule: { ...validMutation.rule, status: "ACTIVE" },
    });
  });
});
