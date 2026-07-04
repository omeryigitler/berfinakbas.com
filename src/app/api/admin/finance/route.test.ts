import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, executeFinanceOperationMock, getFinanceOverviewMock, getServerEnvironmentMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    executeFinanceOperationMock: vi.fn(),
    getFinanceOverviewMock: vi.fn(),
    getServerEnvironmentMock: vi.fn(),
  }));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));
vi.mock("@/lib/finance/finance-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/finance/finance-service")>()),
  executeFinanceOperation: executeFinanceOperationMock,
  getFinanceOverview: getFinanceOverviewMock,
}));

import { FinancePolicyViolationError } from "@/lib/finance/finance-service";
import { GET, POST } from "./route";

const financeUser = {
  id: "11111111-1111-4111-8111-111111111111",
  roles: ["FINANCE"],
  status: "ACTIVE",
};
const validMethod = {
  action: "CREATE_PAYMENT_METHOD",
  key: "BANK_TRANSFER",
  name: "Banka havalesi",
  reason: "Onaylı ödeme yöntemi kataloğa ekleniyor.",
  sortOrder: 1,
};

function post(body: BodyInit = JSON.stringify(validMethod), origin = "https://berfinakbas.com") {
  return new Request("https://berfinakbas.com/api/admin/finance", {
    body,
    headers: {
      "content-type": "application/json",
      origin,
      "x-correlation-id": "finance-route-test",
    },
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  executeFinanceOperationMock.mockResolvedValue({ id: "22222222-2222-4222-8222-222222222222" });
  getServerEnvironmentMock.mockReturnValue({ APP_URL: "https://berfinakbas.com" });
});

describe("GET /api/admin/finance", () => {
  it("rejects users without finance read permission", async () => {
    authMock.mockResolvedValue({ user: { ...financeUser, roles: ["ASSISTANT"] } });
    const response = await GET(new Request("https://berfinakbas.com/api/admin/finance"));
    expect(response.status).toBe(403);
    expect(getFinanceOverviewMock).not.toHaveBeenCalled();
  });

  it("returns no-store finance overview for a validated filter", async () => {
    authMock.mockResolvedValue({ user: financeUser });
    getFinanceOverviewMock.mockResolvedValue({ clients: [], paymentMethods: [], plans: [] });
    const response = await GET(
      new Request("https://berfinakbas.com/api/admin/finance?status=OVERDUE"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getFinanceOverviewMock).toHaveBeenCalledWith({ status: "OVERDUE" });
  });

  it("rejects duplicate or unknown filters", async () => {
    authMock.mockResolvedValue({ user: financeUser });
    for (const query of ["status=ALL&status=OVERDUE", "unexpected=value"]) {
      const response = await GET(new Request(`https://berfinakbas.com/api/admin/finance?${query}`));
      expect(response.status).toBe(400);
    }
    expect(getFinanceOverviewMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/finance", () => {
  it("rejects users without finance manage permission before input", async () => {
    authMock.mockResolvedValue({ user: { ...financeUser, roles: ["THERAPIST"] } });
    const response = await POST(post("{"));
    expect(response.status).toBe(403);
    expect(executeFinanceOperationMock).not.toHaveBeenCalled();
  });

  it("enforces trusted origin, JSON, and strict operation fields", async () => {
    authMock.mockResolvedValue({ user: financeUser });
    expect((await POST(post(undefined, "https://attacker.example"))).status).toBe(403);
    const unsupported = new Request("https://berfinakbas.com/api/admin/finance", {
      body: JSON.stringify(validMethod),
      headers: { "content-type": "text/plain", origin: "https://berfinakbas.com" },
      method: "POST",
    });
    expect((await POST(unsupported)).status).toBe(415);
    expect((await POST(post(JSON.stringify(validMethod), "https://berfinakbas.com"))).status).toBe(
      201,
    );
    const invalid = await POST(
      post(JSON.stringify({ ...validMethod, clinicalNote: "not accepted" })),
    );
    expect(invalid.status).toBe(400);
  });

  it("rejects oversized request bodies before parsing", async () => {
    authMock.mockResolvedValue({ user: financeUser });
    const request = new Request("https://berfinakbas.com/api/admin/finance", {
      body: JSON.stringify({ value: "x".repeat(33 * 1_024) }),
      headers: {
        "content-length": String(33 * 1_024),
        "content-type": "application/json",
        origin: "https://berfinakbas.com",
      },
      method: "POST",
    });
    expect((await POST(request)).status).toBe(413);
    expect(executeFinanceOperationMock).not.toHaveBeenCalled();
  });

  it("dispatches validated finance operation with server-owned actor context", async () => {
    authMock.mockResolvedValue({ user: financeUser });
    executeFinanceOperationMock.mockResolvedValue({ id: "22222222-2222-4222-8222-222222222222" });
    const response = await POST(post());
    expect(response.status).toBe(201);
    expect(executeFinanceOperationMock).toHaveBeenCalledWith(validMethod, {
      actorUserId: financeUser.id,
      correlationId: "finance-route-test",
    });
  });

  it("maps policy violations without echoing request data", async () => {
    authMock.mockResolvedValue({ user: financeUser });
    executeFinanceOperationMock.mockRejectedValue(new FinancePolicyViolationError());
    const response = await POST(post());
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ code: "FINANCE_POLICY_VIOLATION" });
  });
});
