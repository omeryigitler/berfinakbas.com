import {
  applyAvailabilityExceptions,
  AvailabilityResolutionConflictError,
  type AvailabilityExceptionInput,
} from "@/domain/booking/availability-rule";
import {
  BookingResourceUnavailableError,
  SlotConflictError,
} from "@/domain/booking/appointment-hold";
import { generateDailySlots, zonedDateTimeToUtc } from "@/domain/booking/slot-generator";

const MILLISECONDS_PER_DAY = 86_400_000;

export type AppointmentHoldAvailabilityRule = Readonly<{
  localEndTime: string;
  localStartTime: string;
  slotIncrementMinutes: number;
}>;

export type AssertAppointmentHoldAvailabilityInput = Readonly<{
  bookingMaxAdvanceDays: number;
  bookingMinNoticeMinutes: number;
  bufferAfterMinutes: number;
  bufferBeforeMinutes: number;
  durationMinutes: number;
  reservedBookingsCount: number;
  exceptions: readonly AvailabilityExceptionInput[];
  maxDailyAppointments: number | null;
  now: Date;
  rules: readonly AppointmentHoldAvailabilityRule[];
  startsAt: Date;
  timeZone: string;
}>;

type ZonedBookingDate = Readonly<{
  localDate: string;
  weekday: number;
}>;

function assertValidDate(value: Date): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new BookingResourceUnavailableError();
  }
}

function formatLocalDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function parseLocalDate(localDate: string): { day: number; month: number; year: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) throw new BookingResourceUnavailableError();

  return { day: Number(match[3]), month: Number(match[2]), year: Number(match[1]) };
}

function localDateOrdinal(localDate: string): number {
  const { day, month, year } = parseLocalDate(localDate);
  return Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;
}

function addLocalDays(localDate: string, days: number): string {
  const { day, month, year } = parseLocalDate(localDate);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return formatLocalDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
}

export function getZonedBookingDate(value: Date, timeZone: string): ZonedBookingDate {
  assertValidDate(value);

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    });
    const parts = Object.fromEntries(
      formatter
        .formatToParts(value)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
    const localDate = formatLocalDate(parts.year, parts.month, parts.day);
    const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();

    return Object.freeze({ localDate, weekday });
  } catch {
    throw new BookingResourceUnavailableError();
  }
}

export function getZonedBookingDayRange(
  localDate: string,
  timeZone: string,
): Readonly<{ endsAt: Date; startsAt: Date }> {
  try {
    return Object.freeze({
      endsAt: zonedDateTimeToUtc(addLocalDays(localDate, 1), "00:00", timeZone),
      startsAt: zonedDateTimeToUtc(localDate, "00:00", timeZone),
    });
  } catch {
    throw new BookingResourceUnavailableError();
  }
}

export function assertAppointmentHoldAvailability(
  input: AssertAppointmentHoldAvailabilityInput,
): void {
  assertValidDate(input.now);
  assertValidDate(input.startsAt);

  const requestedDay = getZonedBookingDate(input.startsAt, input.timeZone);
  const currentDay = getZonedBookingDate(input.now, input.timeZone);
  const daysAhead =
    localDateOrdinal(requestedDay.localDate) - localDateOrdinal(currentDay.localDate);

  if (!Number.isInteger(input.bookingMaxAdvanceDays) || input.bookingMaxAdvanceDays < 0) {
    throw new BookingResourceUnavailableError();
  }
  if (daysAhead > input.bookingMaxAdvanceDays) throw new SlotConflictError();

  if (input.rules.length === 0) throw new SlotConflictError();

  const slotIncrements = new Set(input.rules.map((rule) => rule.slotIncrementMinutes));
  if (slotIncrements.size !== 1) throw new BookingResourceUnavailableError();
  const slotIncrementMinutes = input.rules[0].slotIncrementMinutes;

  try {
    const windows = applyAvailabilityExceptions(
      requestedDay.localDate,
      input.rules.map((rule) => ({
        endTime: rule.localEndTime,
        startTime: rule.localStartTime,
      })),
      input.exceptions,
    );
    const candidates = generateDailySlots({
      bufferAfterMinutes: input.bufferAfterMinutes,
      bufferBeforeMinutes: input.bufferBeforeMinutes,
      durationMinutes: input.durationMinutes,
      existingAppointmentsCount: input.reservedBookingsCount,
      localDate: requestedDay.localDate,
      maxDailyAppointments: input.maxDailyAppointments,
      minNoticeMinutes: input.bookingMinNoticeMinutes,
      now: input.now,
      slotIncrementMinutes,
      timeZone: input.timeZone,
      windows,
    });

    if (
      !candidates.some((candidate) => candidate.startsAt.getTime() === input.startsAt.getTime())
    ) {
      throw new SlotConflictError();
    }
  } catch (error) {
    if (error instanceof SlotConflictError) throw error;
    if (error instanceof AvailabilityResolutionConflictError) {
      throw new BookingResourceUnavailableError();
    }
    if (error instanceof Error) throw new BookingResourceUnavailableError();
    throw error;
  }
}
