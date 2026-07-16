import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthMock, getDatabaseMock } = vi.hoisted(() => ({
  getAuthMock: vi.fn(),
  getDatabaseMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: getAuthMock }));
vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import { GET } from "./route";

function createMockSession(roles: readonly string[] = ["SUPER_ADMIN"]) {
  return {
    user: {
      id: "user-1",
      email: "admin@example.com",
      status: "ACTIVE" as const,
      roles: roles as readonly string[],
      createdAt: new Date(),
    },
  };
}

describe("GET /api/admin/health/outbox", () => {
  beforeEach(() => {
    getAuthMock.mockReset();
    getDatabaseMock.mockReset();
  });

  it("returns 401 when user is not authenticated", async () => {
    getAuthMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when user status is not ACTIVE", async () => {
    getAuthMock.mockResolvedValue({
      user: {
        ...createMockSession().user,
        status: "INVITED",
      },
    });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 403 when user lacks technical-health:read permission", async () => {
    getAuthMock.mockResolvedValue(createMockSession(["ASSISTANT"]));

    const response = await GET();

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("FORBIDDEN");
  });

  it("returns health data with SUPER_ADMIN role", async () => {
    getAuthMock.mockResolvedValue(createMockSession(["SUPER_ADMIN"]));
    const database = {
      outboxEvent: {
        groupBy: vi.fn().mockResolvedValue([
          { status: "SENT", _count: 100 },
          { status: "FAILED", _count: 2 },
        ]),
        findFirst: vi.fn().mockResolvedValue(null),
        aggregate: vi.fn().mockResolvedValue({
          _avg: { attemptCount: 1.1 },
          _count: 100,
        }),
        count: vi.fn().mockResolvedValue(102),
      },
    };
    getDatabaseMock.mockReturnValue(database);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body.data).toEqual({
      statusCounts: {
        PENDING: 0,
        PROCESSING: 0,
        SENT: 100,
        FAILED: 2,
        DEAD: 0,
      },
      totalEvents: 102,
      oldestPendingAt: null,
      oldestFailedAt: null,
      averageAttempts: 1.1,
      successRate: 98.04,
    });
  });

  it("returns health data with DEVELOPER role", async () => {
    getAuthMock.mockResolvedValue(createMockSession(["DEVELOPER"]));
    const database = {
      outboxEvent: {
        groupBy: vi.fn().mockResolvedValue([
          { status: "SENT", _count: 50 },
          { status: "PENDING", _count: 3 },
        ]),
        findFirst: vi.fn().mockResolvedValue(null),
        aggregate: vi.fn().mockResolvedValue({
          _avg: { attemptCount: 1.0 },
          _count: 50,
        }),
        count: vi.fn().mockResolvedValue(53),
      },
    };
    getDatabaseMock.mockReturnValue(database);

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.totalEvents).toBe(53);
  });
});
