import {
  assertMinimumBookingNotice,
  BookingResourceUnavailableError,
  prepareAppointmentHold,
  SlotConflictError,
} from "@/domain/booking/appointment-hold";
import { getDatabase } from "@/lib/db";
import { z } from "zod";

const ALLOCATION_CONFLICT_CONSTRAINT = "booking_allocations_no_active_overlap";

export type CreateAppointmentHoldInput = Readonly<{
  correlationId: string;
  holdDurationMinutes: number;
  practitionerId: string;
  serviceId: string;
  startsAt: Date;
}>;

const createAppointmentHoldInputSchema = z.object({
  correlationId: z.string().trim().min(1).max(80),
  holdDurationMinutes: z.number().int().min(1).max(1_440),
  practitionerId: z.uuid(),
  serviceId: z.uuid(),
  startsAt: z.date(),
});

export type CreatedAppointmentHold = Readonly<{
  endsAt: Date;
  expiresAt: Date;
  holdId: string;
  holderToken: string;
  startsAt: Date;
}>;

type DatabaseError = {
  code?: string;
  message?: string;
  meta?: unknown;
};

export function isAllocationConflictError(error: unknown): boolean {
  if (!(error instanceof Error) && (typeof error !== "object" || error === null)) return false;

  const databaseError = error as DatabaseError;
  const metadata = (() => {
    try {
      return JSON.stringify(databaseError.meta ?? "");
    } catch {
      return "";
    }
  })();

  return (
    databaseError.code === "23P01" ||
    databaseError.message?.includes(ALLOCATION_CONFLICT_CONSTRAINT) === true ||
    metadata.includes(ALLOCATION_CONFLICT_CONSTRAINT) ||
    metadata.includes("23P01")
  );
}

export async function createAppointmentHold(
  input: CreateAppointmentHoldInput,
  now = new Date(),
): Promise<CreatedAppointmentHold> {
  const command = createAppointmentHoldInputSchema.parse(input);
  const database = getDatabase();

  try {
    const result = await database.$transaction(
      async (transaction) => {
        const practitioner = await transaction.practitioner.findUnique({
          select: { id: true, status: true },
          where: { id: command.practitionerId },
        });
        const service = await transaction.service.findUnique({
          include: {
            policies: {
              orderBy: { effectiveFrom: "desc" },
              take: 1,
              where: { effectiveFrom: { lte: now } },
            },
          },
          where: { id: command.serviceId },
        });

        if (
          practitioner?.status !== "ACTIVE" ||
          service?.status !== "ACTIVE" ||
          !service.publicVisible ||
          !service.policies[0]
        ) {
          throw new BookingResourceUnavailableError();
        }

        assertMinimumBookingNotice(
          command.startsAt,
          now,
          service.policies[0].bookingMinNoticeMinutes,
        );

        const prepared = prepareAppointmentHold({
          bufferAfterMinutes: service.defaultBufferAfterMinutes,
          bufferBeforeMinutes: service.defaultBufferBeforeMinutes,
          durationMinutes: service.defaultDurationMinutes,
          holdDurationMinutes: command.holdDurationMinutes,
          now,
          startsAt: command.startsAt,
        });

        const staleHolds = await transaction.appointmentHold.findMany({
          select: { id: true },
          where: {
            expiresAt: { lte: now },
            practitionerId: command.practitionerId,
            status: "ACTIVE",
          },
        });

        for (const staleHold of staleHolds) {
          const transition = await transaction.appointmentHold.updateMany({
            data: { status: "EXPIRED" },
            where: { id: staleHold.id, status: "ACTIVE" },
          });
          if (transition.count === 0) continue;

          await transaction.bookingAllocation.updateMany({
            data: { releasedAt: now, status: "RELEASED" },
            where: { holdId: staleHold.id, status: "ACTIVE" },
          });
          await transaction.appointmentHoldStatusLog.create({
            data: {
              actorType: "SYSTEM",
              fromStatus: "ACTIVE",
              holdId: staleHold.id,
              reasonCode: "HOLD_TTL_EXPIRED",
              toStatus: "EXPIRED",
            },
          });
          await transaction.auditLog.create({
            data: {
              action: "appointment_hold.expired",
              actorType: "SYSTEM",
              afterSummary: { status: "EXPIRED" },
              beforeSummary: { status: "ACTIVE" },
              correlationId: command.correlationId,
              entityId: staleHold.id,
              entityType: "APPOINTMENT_HOLD",
              reason: "HOLD_TTL_EXPIRED",
            },
          });
        }

        const hold = await transaction.appointmentHold.create({
          data: {
            busyEndsAt: prepared.busyEndsAt,
            busyStartsAt: prepared.busyStartsAt,
            createdAt: now,
            endsAt: prepared.endsAt,
            expiresAt: prepared.expiresAt,
            holderTokenHash: prepared.holderTokenHash,
            practitionerId: command.practitionerId,
            serviceId: command.serviceId,
            startsAt: prepared.startsAt,
          },
        });

        await transaction.appointmentHoldStatusLog.create({
          data: {
            actorType: "CLIENT",
            holdId: hold.id,
            reasonCode: "PUBLIC_SLOT_SELECTED",
            toStatus: "ACTIVE",
          },
        });
        await transaction.bookingAllocation.create({
          data: {
            busyEndsAt: prepared.busyEndsAt,
            busyStartsAt: prepared.busyStartsAt,
            holdId: hold.id,
            practitionerId: command.practitionerId,
          },
        });
        await transaction.auditLog.create({
          data: {
            action: "appointment_hold.created",
            actorType: "CLIENT",
            afterSummary: {
              expiresAt: prepared.expiresAt.toISOString(),
              serviceId: command.serviceId,
              startsAt: prepared.startsAt.toISOString(),
              status: "ACTIVE",
            },
            correlationId: command.correlationId,
            entityId: hold.id,
            entityType: "APPOINTMENT_HOLD",
            reason: "PUBLIC_SLOT_SELECTED",
          },
        });

        return { hold, holderToken: prepared.holderToken };
      },
      { isolationLevel: "Serializable" },
    );

    return Object.freeze({
      endsAt: result.hold.endsAt,
      expiresAt: result.hold.expiresAt,
      holdId: result.hold.id,
      holderToken: result.holderToken,
      startsAt: result.hold.startsAt,
    });
  } catch (error) {
    if (isAllocationConflictError(error)) throw new SlotConflictError();
    throw error;
  }
}
