import { z } from "zod";

export type OutboxEventStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "DEAD";

export const outboxHealthResponseSchema = z.object({
  statusCounts: z.record(z.enum(["PENDING", "PROCESSING", "SENT", "FAILED", "DEAD"]), z.number()),
  totalEvents: z.number(),
  oldestPendingAt: z.string().datetime().nullable(),
  oldestFailedAt: z.string().datetime().nullable(),
  averageAttempts: z.number(),
  successRate: z.number().min(0).max(100),
});

export type OutboxHealthResponse = z.infer<typeof outboxHealthResponseSchema>;
