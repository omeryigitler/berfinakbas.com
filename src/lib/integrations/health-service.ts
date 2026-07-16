import { getDatabase } from "@/lib/db";
import type { OutboxHealthResponse } from "@/domain/integrations/health";

/**
 * Get health metrics for outbox events.
 * Returns safe aggregate statistics without exposing any personal or sensitive data.
 */
export async function getOutboxHealth(): Promise<OutboxHealthResponse> {
  const database = getDatabase();

  // Get status counts
  const statusCounts = await database.outboxEvent.groupBy({
    by: ["status"],
    _count: true,
  });

  // Get oldest pending/processing event
  const oldestPending = await database.outboxEvent.findFirst({
    where: {
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  // Get oldest failed/dead event
  const oldestFailed = await database.outboxEvent.findFirst({
    where: {
      status: {
        in: ["FAILED", "DEAD"],
      },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  // Get average attempts and sent count
  const metrics = await database.outboxEvent.aggregate({
    _avg: {
      attemptCount: true,
    },
    _count: true,
    where: {
      status: "SENT",
    },
  });

  const totalCount = await database.outboxEvent.count();
  const sentCount = metrics._count;
  const successRate = totalCount > 0 ? (sentCount / totalCount) * 100 : 0;

  const countMap: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 0,
    SENT: 0,
    FAILED: 0,
    DEAD: 0,
  };

  for (const group of statusCounts) {
    if (group.status in countMap) {
      countMap[group.status] = group._count;
    }
  }

  return {
    statusCounts: {
      PENDING: countMap.PENDING,
      PROCESSING: countMap.PROCESSING,
      SENT: countMap.SENT,
      FAILED: countMap.FAILED,
      DEAD: countMap.DEAD,
    },
    totalEvents: totalCount,
    oldestPendingAt: oldestPending?.createdAt?.toISOString() ?? null,
    oldestFailedAt: oldestFailed?.createdAt?.toISOString() ?? null,
    averageAttempts: Math.round((metrics._avg.attemptCount ?? 0) * 100) / 100,
    successRate: Math.round(successRate * 100) / 100,
  };
}
