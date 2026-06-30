import {
  BookingResourceUnavailableError,
  prepareAppointmentHold,
  SlotConflictError,
} from "@/domain/booking/appointment-hold";
import {
  assertAppointmentHoldAvailability,
  getZonedBookingDate,
  getZonedBookingDayRange,
} from "@/lib/booking/appointment-hold-availability";
import { getDatabase } from "@/lib/db";
import { z } from "zod";

const ALLOCATION_CONFLICT_CONSTRAINT = "booking_allocations_no_active_overlap";
const MAX_TRANSACTION_ATTEMPTS = 3;

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
  cause?: unknown;
  code?: string;
  message?: string;
  meta?: unknown;
};

function getDatabaseErrorDetails(error: unknown): string {
  if (!(error instanceof Error) && (typeof error !== "object" || error === null)) return "";

  const databaseError = error as DatabaseError;
  const cause =
    typeof databaseError.cause === "object" && databaseError.cause !== null
      ? (databaseError.cause as DatabaseError)
      : null;
  const serialized = (() => {
    try {
      return JSON.stringify({ cause: databaseError.cause, meta: databaseError.meta });
    } catch {
      return "";
    }
  })();

  return [databaseError.code, databaseError.message, cause?.code, cause?.message, serialized]
    .filter(Boolean)
    .join(" ");
}

export function isAllocationConflictError(error: unknown): boolean {
  if (!(error instanceof Error) && (typeof error !== "object" || error === null)) return false;

  const details = getDatabaseErrorDetails(error);

  return details.includes("23P01") || details.includes(ALLOCATION_CONFLICT_CONSTRAINT);
}

export function isRetryableTransactionError(error: unknown): boolean {
  const details = getDatabaseErrorDetails(error).toLowerCase();
  return (
    details.includes("40p01") ||
    details.includes("40001") ||
    details.includes("deadlock detected") ||
    details.includes("serialization failure")
  );
}

export async function createAppointmentHold(
  input: CreateAppointmentHoldInput,
  now = new Date(),
): Promise<CreatedAppointmentHold> {
  const command = createAppointmentHoldInputSchema.parse(input);
  const database = getDatabase();

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      const result = await database.$transaction(
        async (transaction) => {
          const practitioner = await transaction.practitioner.findUnique({
            select: { id: true, status: true, timeZone: true },
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

          const bookingDate = getZonedBookingDate(command.startsAt, practitioner.timeZone);
          const bookingDateValue = new Date(`${bookingDate.localDate}T00:00:00.000Z`);
          const bookingDayRange = getZonedBookingDayRange(
            bookingDate.localDate,
            practitioner.timeZone,
          );
          const availabilityRules = await transaction.availabilityRule.findMany({
            orderBy: [{ localStartTime: "asc" }, { localEndTime: "asc" }, { id: "asc" }],
            select: {
              localEndTime: true,
              localStartTime: true,
              slotIncrementMinutes: true,
            },
            where: {
              AND: [
                { OR: [{ validFrom: null }, { validFrom: { lte: bookingDateValue } }] },
                { OR: [{ validUntil: null }, { validUntil: { gte: bookingDateValue } }] },
              ],
              practitionerId: command.practitionerId,
              status: "ACTIVE",
              weekday: bookingDate.weekday,
            },
          });
          const availabilityExceptions = await transaction.availabilityException.findMany({
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: {
              localEndTime: true,
              localStartTime: true,
              practitionerId: true,
              reasonCode: true,
              status: true,
              type: true,
            },
            where: {
              localDate: bookingDateValue,
              practitionerId: command.practitionerId,
              status: "ACTIVE",
            },
          });
          const reservedBookingsCount = await transaction.bookingAllocation.count({
            where: {
              OR: [
                {
                  appointment: {
                    is: {
                      startsAt: { gte: bookingDayRange.startsAt, lt: bookingDayRange.endsAt },
                    },
                  },
                },
                {
                  hold: {
                    is: {
                      expiresAt: { gt: now },
                      startsAt: { gte: bookingDayRange.startsAt, lt: bookingDayRange.endsAt },
                      status: "ACTIVE",
                    },
                  },
                },
              ],
              practitionerId: command.practitionerId,
              status: "ACTIVE",
            },
          });
          const resolvedExceptions = availabilityExceptions.map((exception) => {
            const common = {
              localDate: bookingDate.localDate,
              practitionerId: exception.practitionerId,
              privateNote: null,
              reasonCode: exception.reasonCode,
              status: "ACTIVE" as const,
            };
            if (exception.type === "CLOSED") {
              return {
                ...common,
                localEndTime: null,
                localStartTime: null,
                type: "CLOSED" as const,
              };
            }
            if (exception.localEndTime === null || exception.localStartTime === null) {
              throw new BookingResourceUnavailableError();
            }
            return {
              ...common,
              localEndTime: exception.localEndTime,
              localStartTime: exception.localStartTime,
              type: exception.type,
            };
          });

          assertAppointmentHoldAvailability({
            bookingMaxAdvanceDays: service.policies[0].bookingMaxAdvanceDays,
            bookingMinNoticeMinutes: service.policies[0].bookingMinNoticeMinutes,
            bufferAfterMinutes: service.defaultBufferAfterMinutes,
            bufferBeforeMinutes: service.defaultBufferBeforeMinutes,
            durationMinutes: service.defaultDurationMinutes,
            exceptions: resolvedExceptions,
            maxDailyAppointments: service.policies[0].maxDailyAppointments,
            now,
            reservedBookingsCount,
            rules: availabilityRules,
            startsAt: command.startsAt,
            timeZone: practitioner.timeZone,
          });

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
      if (isRetryableTransactionError(error) && attempt < MAX_TRANSACTION_ATTEMPTS) continue;
      throw error;
    }
  }

  throw new Error("Randevu hold transaction deneme sınırı beklenmedik biçimde aşıldı.");
}
