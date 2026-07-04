import type { Prisma } from "@/generated/prisma/client";

export const appointmentStatusChangedEventType = "APPOINTMENT_STATUS_CHANGED";

type AppointmentStatusChangedInput = Readonly<{
  appointmentId: string;
  fromStatus: string | null;
  occurredAt: Date;
  statusLogId: string;
  toStatus: string;
}>;

/**
 * Adds a provider-neutral domain event to the caller's transaction.
 * The payload intentionally contains identifiers and status metadata only;
 * workers must load authorized contact/calendar data when they process it.
 */
export async function enqueueAppointmentStatusChangedEvent(
  transaction: Prisma.TransactionClient,
  input: AppointmentStatusChangedInput,
) {
  return transaction.outboxEvent.create({
    data: {
      aggregateId: input.appointmentId,
      aggregateType: "APPOINTMENT",
      eventType: appointmentStatusChangedEventType,
      idempotencyKey: `appointment-status-log:${input.statusLogId}`,
      payload: {
        appointmentId: input.appointmentId,
        fromStatus: input.fromStatus,
        occurredAt: input.occurredAt.toISOString(),
        statusLogId: input.statusLogId,
        toStatus: input.toStatus,
      },
    },
    select: { id: true },
  });
}
