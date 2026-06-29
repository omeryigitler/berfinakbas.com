import { z } from "zod";

import {
  assertAppointmentTransition,
  type AppointmentStatus as DomainAppointmentStatus,
} from "@/domain/booking/appointment-status";
import { getDatabase } from "@/lib/db";

export const databaseAppointmentStatuses = [
  "REQUESTED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "REJECTED",
  "RESCHEDULE_PROPOSED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_PRACTITIONER",
  "COMPLETED",
  "NO_SHOW",
] as const;

type DatabaseAppointmentStatus = (typeof databaseAppointmentStatuses)[number];

const domainStatusByDatabaseStatus = {
  CANCELLED_BY_CLIENT: "cancelled_by_client",
  CANCELLED_BY_PRACTITIONER: "cancelled_by_practitioner",
  COMPLETED: "completed",
  CONFIRMED: "confirmed",
  NO_SHOW: "no_show",
  PENDING_REVIEW: "pending_review",
  REJECTED: "rejected",
  REQUESTED: "requested",
  RESCHEDULE_PROPOSED: "reschedule_proposed",
} satisfies Record<DatabaseAppointmentStatus, DomainAppointmentStatus>;

const allocationReleasingStatuses = new Set<DatabaseAppointmentStatus>([
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_PRACTITIONER",
  "REJECTED",
]);

export const transitionAppointmentSchema = z.object({
  actorUserId: z.uuid(),
  appointmentId: z.uuid(),
  correlationId: z.string().trim().min(1).max(80),
  note: z.string().trim().min(1).max(500).nullable().optional(),
  reasonCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_]+$/)
    .min(3)
    .max(80),
  toStatus: z.enum(databaseAppointmentStatuses),
});

export const transitionAppointmentRequestSchema = transitionAppointmentSchema.pick({
  note: true,
  reasonCode: true,
  toStatus: true,
});

export class AppointmentNotFoundError extends Error {
  readonly code = "APPOINTMENT_NOT_FOUND";

  constructor() {
    super("Randevu bulunamadı.");
    this.name = "AppointmentNotFoundError";
  }
}

export class AppointmentTransitionConflictError extends Error {
  readonly code = "APPOINTMENT_TRANSITION_CONFLICT";

  constructor() {
    super("Randevu durumu değişti veya istenen geçişe izin verilmiyor.");
    this.name = "AppointmentTransitionConflictError";
  }
}

export type TransitionedAppointment = Readonly<{
  appointmentId: string;
  fromStatus: DatabaseAppointmentStatus;
  toStatus: DatabaseAppointmentStatus;
}>;

export async function transitionAppointment(
  input: unknown,
  now = new Date(),
): Promise<TransitionedAppointment> {
  const command = transitionAppointmentSchema.parse(input);
  const database = getDatabase();

  return database.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.findUnique({
      select: { allocation: { select: { status: true } }, id: true, status: true },
      where: { id: command.appointmentId },
    });

    if (!appointment) throw new AppointmentNotFoundError();

    try {
      assertAppointmentTransition(
        domainStatusByDatabaseStatus[appointment.status],
        domainStatusByDatabaseStatus[command.toStatus],
      );
    } catch {
      throw new AppointmentTransitionConflictError();
    }
    if (command.toStatus === "CONFIRMED" && appointment.allocation?.status !== "ACTIVE") {
      throw new AppointmentTransitionConflictError();
    }

    const isCancellation =
      command.toStatus === "CANCELLED_BY_CLIENT" ||
      command.toStatus === "CANCELLED_BY_PRACTITIONER";
    const transition = await transaction.appointment.updateMany({
      data: {
        ...(command.toStatus === "CONFIRMED"
          ? { approvedAt: now, approvedByUserId: command.actorUserId }
          : {}),
        ...(isCancellation ? { cancellationReasonCode: command.reasonCode, cancelledAt: now } : {}),
        status: command.toStatus,
      },
      where: { id: appointment.id, status: appointment.status },
    });

    if (transition.count !== 1) throw new AppointmentTransitionConflictError();

    await transaction.appointmentStatusLog.create({
      data: {
        actorType: "USER",
        actorUserId: command.actorUserId,
        appointmentId: appointment.id,
        fromStatus: appointment.status,
        note: command.note ?? null,
        reasonCode: command.reasonCode,
        toStatus: command.toStatus,
      },
    });

    if (allocationReleasingStatuses.has(command.toStatus)) {
      await transaction.bookingAllocation.updateMany({
        data: { releasedAt: now, status: "RELEASED" },
        where: { appointmentId: appointment.id, status: "ACTIVE" },
      });
    }

    await transaction.auditLog.create({
      data: {
        action: "appointment.status_changed",
        actorType: "USER",
        actorUserId: command.actorUserId,
        afterSummary: { status: command.toStatus },
        beforeSummary: { status: appointment.status },
        correlationId: command.correlationId,
        entityId: appointment.id,
        entityType: "APPOINTMENT",
        reason: command.reasonCode,
      },
    });

    return Object.freeze({
      appointmentId: appointment.id,
      fromStatus: appointment.status,
      toStatus: command.toStatus,
    });
  });
}
