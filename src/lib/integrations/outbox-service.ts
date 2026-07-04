import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";

const claimOutboxEventsSchema = z.object({
  leaseDurationMs: z
    .number()
    .int()
    .min(1_000)
    .max(15 * 60_000),
  limit: z.number().int().min(1).max(100),
  now: z.date(),
});

const eventMutationSchema = z.object({
  attemptCount: z.number().int().min(1),
  eventId: z.uuid(),
  now: z.date(),
});

const failOutboxEventSchema = eventMutationSchema.extend({
  errorCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_]+$/)
    .min(3)
    .max(120),
  maxAttempts: z.number().int().min(1).max(100),
  nextAttemptAt: z.date(),
});

export class OutboxEventStateConflictError extends Error {
  readonly code = "OUTBOX_EVENT_STATE_CONFLICT";

  constructor() {
    super("Outbox olayı başka bir worker tarafından işlendi veya durumu değişti.");
    this.name = "OutboxEventStateConflictError";
  }
}

export class OutboxRetryScheduleError extends Error {
  readonly code = "OUTBOX_RETRY_SCHEDULE_INVALID";

  constructor() {
    super("Outbox yeniden deneme zamanı gelecekte olmalıdır.");
    this.name = "OutboxRetryScheduleError";
  }
}

function eligibleOutboxWhere(now: Date, expiredLeaseAt: Date): Prisma.OutboxEventWhereInput {
  return {
    OR: [
      { nextAttemptAt: { lte: now }, status: { in: ["PENDING", "FAILED"] } },
      { lockedAt: { lte: expiredLeaseAt }, status: "PROCESSING" },
    ],
  };
}

const outboxEventSelection = {
  aggregateId: true,
  aggregateType: true,
  attemptCount: true,
  createdAt: true,
  eventType: true,
  id: true,
  idempotencyKey: true,
  payload: true,
} as const;

export type ClaimedOutboxEvent = Readonly<{
  aggregateId: string;
  aggregateType: string;
  attemptCount: number;
  createdAt: Date;
  eventType: string;
  id: string;
  idempotencyKey: string;
  lockedAt: Date;
  payload: unknown;
  status: "PROCESSING";
}>;

/**
 * Claims due events with optimistic conditional updates. Two workers may read
 * the same candidate, but only one can change its eligible state to PROCESSING.
 * Expired PROCESSING leases are claimable again after a worker crash.
 */
export async function claimOutboxEvents(input: unknown): Promise<ClaimedOutboxEvent[]> {
  const command = claimOutboxEventsSchema.parse(input);
  const database = getDatabase();
  const expiredLeaseAt = new Date(command.now.getTime() - command.leaseDurationMs);
  const eligibility = eligibleOutboxWhere(command.now, expiredLeaseAt);
  const candidates = await database.outboxEvent.findMany({
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: outboxEventSelection,
    take: command.limit,
    where: eligibility,
  });

  const claims = await Promise.all(
    candidates.map(async (candidate): Promise<ClaimedOutboxEvent | null> => {
      const claimed = await database.outboxEvent.updateMany({
        data: {
          attemptCount: { increment: 1 },
          lockedAt: command.now,
          processedAt: null,
          status: "PROCESSING",
        },
        where: { AND: [{ id: candidate.id }, eligibility] },
      });

      if (claimed.count !== 1) return null;
      return Object.freeze({
        aggregateId: candidate.aggregateId,
        aggregateType: candidate.aggregateType,
        attemptCount: candidate.attemptCount + 1,
        createdAt: candidate.createdAt,
        eventType: candidate.eventType,
        id: candidate.id,
        idempotencyKey: candidate.idempotencyKey,
        lockedAt: command.now,
        payload: candidate.payload,
        status: "PROCESSING" as const,
      });
    }),
  );

  return claims.filter((event) => event !== null);
}

export async function completeOutboxEvent(input: unknown): Promise<void> {
  const command = eventMutationSchema.parse(input);
  const database = getDatabase();
  const completed = await database.outboxEvent.updateMany({
    data: {
      lastErrorCode: null,
      lockedAt: null,
      processedAt: command.now,
      status: "SENT",
    },
    where: {
      attemptCount: command.attemptCount,
      id: command.eventId,
      status: "PROCESSING",
    },
  });

  if (completed.count !== 1) throw new OutboxEventStateConflictError();
}

export async function failOutboxEvent(input: unknown): Promise<"DEAD" | "FAILED"> {
  const command = failOutboxEventSchema.parse(input);
  const terminal = command.attemptCount >= command.maxAttempts;
  if (!terminal && command.nextAttemptAt <= command.now) {
    throw new OutboxRetryScheduleError();
  }

  const database = getDatabase();
  const failed = await database.outboxEvent.updateMany({
    data: {
      lastErrorCode: command.errorCode,
      lockedAt: null,
      ...(terminal
        ? { processedAt: command.now, status: "DEAD" as const }
        : { nextAttemptAt: command.nextAttemptAt, status: "FAILED" as const }),
    },
    where: {
      attemptCount: command.attemptCount,
      id: command.eventId,
      status: "PROCESSING",
    },
  });

  if (failed.count !== 1) throw new OutboxEventStateConflictError();
  return terminal ? "DEAD" : "FAILED";
}
