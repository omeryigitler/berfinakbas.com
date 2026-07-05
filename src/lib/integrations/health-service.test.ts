import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock } = vi.hoisted(() => ({ getDatabaseMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import { getOutboxHealth } from "./health-service";

function createDatabase() {
  return {
    outboxEvent: {
      groupBy: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
  };
}

describe("outbox health service", () => {
  beforeEach(() => {
    getDatabaseMock.mockReset();
  });

  it("returns empty stats when no events exist", async () => {
    const database = createDatabase();
    database.outboxEvent.groupBy.mockResolvedValue([]);
    database.outboxEvent.findFirst.mockResolvedValue(null);
    database.outboxEvent.aggregate.mockResolvedValue({
      _avg: { attemptCount: null },
      _count: 0,
    });
    database.outboxEvent.count.mockResolvedValue(0);

    getDatabaseMock.mockReturnValue(database);

    const health = await getOutboxHealth();

    expect(health).toEqual({
      statusCounts: {
        PENDING: 0,
        PROCESSING: 0,
        SENT: 0,
        FAILED: 0,
        DEAD: 0,
      },
      totalEvents: 0,
      oldestPendingAt: null,
      oldestFailedAt: null,
      averageAttempts: 0,
      successRate: 0,
    });
  });

  it("calculates status counts and metrics correctly", async () => {
    const database = createDatabase();
    const pendingTime = new Date("2031-07-01T08:00:00.000Z");
    const failedTime = new Date("2031-07-01T09:00:00.000Z");

    database.outboxEvent.groupBy.mockResolvedValue([
      { status: "PENDING", _count: 5 },
      { status: "PROCESSING", _count: 2 },
      { status: "SENT", _count: 50 },
      { status: "FAILED", _count: 2 },
      { status: "DEAD", _count: 1 },
    ]);
    database.outboxEvent.findFirst.mockImplementation(async (query) => {
      if (query.where.status.in.includes("PENDING")) {
        return { createdAt: pendingTime };
      }
      if (query.where.status.in.includes("FAILED")) {
        return { createdAt: failedTime };
      }
      return null;
    });
    database.outboxEvent.aggregate.mockResolvedValue({
      _avg: { attemptCount: 1.5 },
      _count: 50,
    });
    database.outboxEvent.count.mockResolvedValue(60);

    getDatabaseMock.mockReturnValue(database);

    const health = await getOutboxHealth();

    expect(health).toEqual({
      statusCounts: {
        PENDING: 5,
        PROCESSING: 2,
        SENT: 50,
        FAILED: 2,
        DEAD: 1,
      },
      totalEvents: 60,
      oldestPendingAt: pendingTime.toISOString(),
      oldestFailedAt: failedTime.toISOString(),
      averageAttempts: 1.5,
      successRate: 83.33,
    });
  });

  it("handles missing oldest pending event", async () => {
    const database = createDatabase();
    const failedTime = new Date("2031-07-01T09:00:00.000Z");

    database.outboxEvent.groupBy.mockResolvedValue([
      { status: "SENT", _count: 10 },
      { status: "FAILED", _count: 1 },
    ]);
    database.outboxEvent.findFirst.mockImplementation(async (query) => {
      if (query.where.status.in.includes("PENDING")) {
        return null;
      }
      if (query.where.status.in.includes("FAILED")) {
        return { createdAt: failedTime };
      }
      return null;
    });
    database.outboxEvent.aggregate.mockResolvedValue({
      _avg: { attemptCount: 1.0 },
      _count: 10,
    });
    database.outboxEvent.count.mockResolvedValue(11);

    getDatabaseMock.mockReturnValue(database);

    const health = await getOutboxHealth();

    expect(health.oldestPendingAt).toBeNull();
    expect(health.oldestFailedAt).toEqual(failedTime.toISOString());
  });

  it("rounds success rate and average attempts correctly", async () => {
    const database = createDatabase();

    database.outboxEvent.groupBy.mockResolvedValue([
      { status: "SENT", _count: 33 },
      { status: "FAILED", _count: 1 },
    ]);
    database.outboxEvent.findFirst.mockResolvedValue(null);
    database.outboxEvent.aggregate.mockResolvedValue({
      _avg: { attemptCount: 1.333333 },
      _count: 33,
    });
    database.outboxEvent.count.mockResolvedValue(34);

    getDatabaseMock.mockReturnValue(database);

    const health = await getOutboxHealth();

    expect(health.successRate).toBe(97.06);
    expect(health.averageAttempts).toBe(1.33);
  });
});
