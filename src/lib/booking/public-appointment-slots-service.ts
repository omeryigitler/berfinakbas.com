import { z } from "zod";

import {
  applyAvailabilityExceptions,
  AvailabilityResolutionConflictError,
  type AvailabilityExceptionInput,
} from "@/domain/booking/availability-rule";
import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import { generateDailySlots } from "@/domain/booking/slot-generator";
import {
  getZonedBookingDate,
  getZonedBookingDayRange,
} from "@/lib/booking/appointment-hold-availability";
import { getDatabase } from "@/lib/db";

const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidLocalDate(value: string): boolean {
  if (!localDatePattern.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return (
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day
  );
}

const localDateSchema = z
  .string()
  .regex(localDatePattern)
  .refine(isValidLocalDate, "Geçerli bir takvim tarihi kullanılmalıdır.");

export const publicAppointmentSlotsQuerySchema = z
  .object({
    localDate: localDateSchema,
    practitionerId: z.uuid(),
    serviceId: z.uuid(),
  })
  .strict();

export type PublicAppointmentSlot = Readonly<{
  endsAt: Date;
  startsAt: Date;
}>;

function localDateOrdinal(localDate: string): number {
  const [year, month, day] = localDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export async function listPublicAppointmentSlots(
  input: unknown,
  now = new Date(),
): Promise<readonly PublicAppointmentSlot[]> {
  const command = publicAppointmentSlotsQuerySchema.parse(input);
  const currentTime = z.date().parse(now);
  const database = getDatabase();

  const [practitioner, service] = await Promise.all([
    database.practitioner.findUnique({
      select: { status: true, timeZone: true },
      where: { id: command.practitionerId },
    }),
    database.service.findUnique({
      include: {
        policies: {
          orderBy: { effectiveFrom: "desc" },
          take: 1,
          where: { effectiveFrom: { lte: currentTime } },
        },
      },
      where: { id: command.serviceId },
    }),
  ]);

  if (
    practitioner?.status !== "ACTIVE" ||
    service?.status !== "ACTIVE" ||
    !service.publicVisible ||
    !service.policies[0]
  ) {
    throw new BookingResourceUnavailableError();
  }

  const policy = service.policies[0];
  const currentLocalDate = getZonedBookingDate(currentTime, practitioner.timeZone).localDate;
  const daysAhead = localDateOrdinal(command.localDate) - localDateOrdinal(currentLocalDate);
  if (daysAhead < 0 || daysAhead > policy.bookingMaxAdvanceDays) return Object.freeze([]);

  const requestedDateValue = new Date(`${command.localDate}T00:00:00.000Z`);
  const weekday = requestedDateValue.getUTCDay();
  const dayRange = getZonedBookingDayRange(command.localDate, practitioner.timeZone);

  const [rules, exceptions, busyAllocations, reservedBookingsCount] = await Promise.all([
    database.availabilityRule.findMany({
      orderBy: [{ localStartTime: "asc" }, { localEndTime: "asc" }, { id: "asc" }],
      select: {
        localEndTime: true,
        localStartTime: true,
        slotIncrementMinutes: true,
      },
      where: {
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: requestedDateValue } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: requestedDateValue } }] },
        ],
        practitionerId: command.practitionerId,
        status: "ACTIVE",
        weekday,
      },
    }),
    database.availabilityException.findMany({
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
        localDate: requestedDateValue,
        practitionerId: command.practitionerId,
        status: "ACTIVE",
      },
    }),
    database.bookingAllocation.findMany({
      orderBy: [{ busyStartsAt: "asc" }, { id: "asc" }],
      select: { busyEndsAt: true, busyStartsAt: true },
      where: {
        OR: [
          { appointmentId: { not: null } },
          { hold: { is: { expiresAt: { gt: currentTime }, status: "ACTIVE" } } },
        ],
        busyEndsAt: { gt: dayRange.startsAt },
        busyStartsAt: { lt: dayRange.endsAt },
        practitionerId: command.practitionerId,
        status: "ACTIVE",
      },
    }),
    database.bookingAllocation.count({
      where: {
        OR: [
          {
            appointment: {
              is: { startsAt: { gte: dayRange.startsAt, lt: dayRange.endsAt } },
            },
          },
          {
            hold: {
              is: {
                expiresAt: { gt: currentTime },
                startsAt: { gte: dayRange.startsAt, lt: dayRange.endsAt },
                status: "ACTIVE",
              },
            },
          },
        ],
        practitionerId: command.practitionerId,
        status: "ACTIVE",
      },
    }),
  ]);

  if (rules.length === 0) return Object.freeze([]);
  const slotIncrements = new Set(rules.map((rule) => rule.slotIncrementMinutes));
  if (slotIncrements.size !== 1) throw new BookingResourceUnavailableError();

  const resolvedExceptions = exceptions.map((exception): AvailabilityExceptionInput => {
    const common = {
      localDate: command.localDate,
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
        type: "CLOSED",
      };
    }
    if (exception.localStartTime === null || exception.localEndTime === null) {
      throw new BookingResourceUnavailableError();
    }
    return {
      ...common,
      localEndTime: exception.localEndTime,
      localStartTime: exception.localStartTime,
      type: exception.type,
    };
  });

  try {
    const windows = applyAvailabilityExceptions(
      command.localDate,
      rules.map((rule) => ({
        endTime: rule.localEndTime,
        startTime: rule.localStartTime,
      })),
      resolvedExceptions,
    );
    return Object.freeze(
      generateDailySlots({
        bufferAfterMinutes: service.defaultBufferAfterMinutes,
        bufferBeforeMinutes: service.defaultBufferBeforeMinutes,
        busyBlocks: busyAllocations.map((allocation) => ({
          endsAt: allocation.busyEndsAt,
          startsAt: allocation.busyStartsAt,
        })),
        durationMinutes: service.defaultDurationMinutes,
        existingAppointmentsCount: reservedBookingsCount,
        localDate: command.localDate,
        maxDailyAppointments: policy.maxDailyAppointments,
        minNoticeMinutes: policy.bookingMinNoticeMinutes,
        now: currentTime,
        slotIncrementMinutes: rules[0].slotIncrementMinutes,
        timeZone: practitioner.timeZone,
        windows,
      }).map((slot) => Object.freeze({ endsAt: slot.endsAt, startsAt: slot.startsAt })),
    );
  } catch (error) {
    if (error instanceof BookingResourceUnavailableError) throw error;
    if (error instanceof AvailabilityResolutionConflictError) {
      throw new BookingResourceUnavailableError();
    }
    if (error instanceof Error) throw new BookingResourceUnavailableError();
    throw error;
  }
}
