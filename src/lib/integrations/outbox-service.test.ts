import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock } = vi.hoisted(() => ({ getDatabaseMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  OutboxEventStateConflictError,
  OutboxRetryScheduleError,
} from "./outbox-service";

const eventId = "11111111-1111-4111-8111-111111111111";
const now = new Date("2031-07-01T09:00:00.000Z");

function candidate(overrides: Partial<{ attemptCount: number }> = {}) {
  return {
    aggregateId: "22222222-2222-4222-8222-222222222222",
    aggregateType: "APPOINTMENT",
    attemptCount: overrides.attemptCount ?? 0,
    createdAt: new Date("2031-07-01T08:00:00.000Z"),
    eventType: "APPOINTMENT_STATUS_CHANGED",
    id: eventId,
    idempotencyKey: "appointment-status-log:synthetic",
    payload: { appointmentId: "22222222-2222-4222-8222-222222222222" },
  };
}

function createDatabase() {
  return {
    outboxEvent: {
      findMany: vi.fn().mockResolvedValue([candidate()]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

describe("outbox worker lifecycle", () => {
  beforeEach(() => {
    getDatabaseMock.mockReset();
  });

  it("validates claim bounds before accessing the database", async () => {
    await expect(
      claimOutboxEvents({ leaseDurationMs: 30_000, limit: 0, now }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it("claims due or expired-lease events with an atomic conditional update", async () => {
    const database = createDatabase();
    getDatabaseMock.mockReturnValue(database);

    await expect(claimOutboxEvents({ leaseDurationMs: 30_000, limit: 10, now })).resolves.toEqual([
      expect.objectContaining({
        attemptCount: 1,
        id: eventId,
        lockedAt: now,
        status: "PROCESSING",
      }),
    ]);
    expect(database.outboxEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        where: {
          OR: [
            { nextAttemptAt: { lte: now }, status: { in: ["PENDING", "FAILED"] } },
            {
              lockedAt: { lte: new Date("2031-07-01T08:59:30.000Z") },
              status: "PROCESSING",
            },
          ],
        },
      }),
    );
    expect(database.outboxEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attemptCount: { increment: 1 },
          lockedAt: now,
          status: "PROCESSING",
        }),
      }),
    );
  });

  it("drops a candidate when another worker wins the claim", async () => {
    const database = createDatabase();
    database.outboxEvent.updateMany.mockResolvedValue({ count: 0 });
    getDatabaseMock.mockReturnValue(database);

    await expect(claimOutboxEvents({ leaseDurationMs: 30_000, limit: 1, now })).resolves.toEqual(
      [],
    );
  });

  it("marks only a processing event as sent", async () => {
    const database = createDatabase();
    getDatabaseMock.mockReturnValue(database);

    await expect(completeOutboxEvent({ attemptCount: 1, eventId, now })).resolves.toBeUndefined();
    expect(database.outboxEvent.updateMany).toHaveBeenCalledWith({
      data: {
        lastErrorCode: null,
        lockedAt: null,
        processedAt: now,
        status: "SENT",
      },
      where: { attemptCount: 1, id: eventId, status: "PROCESSING" },
    });
  });

  it("schedules retry without inventing the retry policy", async () => {
    const database = createDatabase();
    const nextAttemptAt = new Date("2031-07-01T09:01:00.000Z");
    getDatabaseMock.mockReturnValue(database);

    await expect(
      failOutboxEvent({
        attemptCount: 1,
        errorCode: "PROVIDER_TEMPORARY_ERROR",
        eventId,
        maxAttempts: 3,
        nextAttemptAt,
        now,
      }),
    ).resolves.toBe("FAILED");
    expect(database.outboxEvent.updateMany).toHaveBeenCalledWith({
      data: {
        lastErrorCode: "PROVIDER_TEMPORARY_ERROR",
        lockedAt: null,
        nextAttemptAt,
        status: "FAILED",
      },
      where: { attemptCount: 1, id: eventId, status: "PROCESSING" },
    });
  });

  it("moves an event to dead letter at the caller-approved attempt limit", async () => {
    const database = createDatabase();
    getDatabaseMock.mockReturnValue(database);

    await expect(
      failOutboxEvent({
        attemptCount: 3,
        errorCode: "PROVIDER_REJECTED",
        eventId,
        maxAttempts: 3,
        nextAttemptAt: now,
        now,
      }),
    ).resolves.toBe("DEAD");
    expect(database.outboxEvent.updateMany).toHaveBeenCalledWith({
      data: {
        lastErrorCode: "PROVIDER_REJECTED",
        lockedAt: null,
        processedAt: now,
        status: "DEAD",
      },
      where: { attemptCount: 3, id: eventId, status: "PROCESSING" },
    });
  });

  it("rejects stale completion and non-future retries", async () => {
    const database = createDatabase();
    database.outboxEvent.updateMany.mockResolvedValue({ count: 0 });
    getDatabaseMock.mockReturnValue(database);

    await expect(completeOutboxEvent({ attemptCount: 1, eventId, now })).rejects.toBeInstanceOf(
      OutboxEventStateConflictError,
    );

    database.outboxEvent.updateMany.mockResolvedValue({ count: 1 });
    await expect(
      failOutboxEvent({
        attemptCount: 1,
        errorCode: "PROVIDER_TEMPORARY_ERROR",
        eventId,
        maxAttempts: 3,
        nextAttemptAt: now,
        now,
      }),
    ).rejects.toBeInstanceOf(OutboxRetryScheduleError);
  });
});
