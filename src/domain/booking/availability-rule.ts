import { z } from "zod";

import type { AvailabilityWindow } from "./slot-generator";

const clockPattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
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

const clockSchema = z
  .string()
  .regex(clockPattern, "Saat HH:mm biçiminde ve 00:00-23:59 aralığında olmalıdır.");
const localDateSchema = z
  .string()
  .regex(localDatePattern, "Tarih YYYY-MM-DD biçiminde olmalıdır.")
  .refine(isValidLocalDate, "Geçerli bir takvim tarihi kullanılmalıdır.");

export const availabilityRuleSchema = z
  .object({
    localEndTime: clockSchema,
    localStartTime: clockSchema,
    practitionerId: z.uuid(),
    slotIncrementMinutes: z.number().int().min(1).max(1_440),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    validFrom: localDateSchema.nullable().default(null),
    validUntil: localDateSchema.nullable().default(null),
    weekday: z.number().int().min(0).max(6),
  })
  .superRefine((value, context) => {
    if (value.localStartTime >= value.localEndTime) {
      context.addIssue({
        code: "custom",
        message: "Çalışma aralığının bitişi başlangıçtan sonra olmalıdır.",
        path: ["localEndTime"],
      });
    }

    if (value.validFrom && value.validUntil && value.validFrom > value.validUntil) {
      context.addIssue({
        code: "custom",
        message: "Geçerlilik bitiş tarihi başlangıç tarihinden önce olamaz.",
        path: ["validUntil"],
      });
    }
  });

const availabilityExceptionBaseSchema = z.object({
  localDate: localDateSchema,
  practitionerId: z.uuid(),
  privateNote: z.string().trim().max(500).nullable().default(null),
  reasonCode: z.string().trim().min(1).max(80),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const closedExceptionSchema = availabilityExceptionBaseSchema.extend({
  localEndTime: z.null().default(null),
  localStartTime: z.null().default(null),
  type: z.literal("CLOSED"),
});

const timedExceptionSchema = availabilityExceptionBaseSchema
  .extend({
    localEndTime: clockSchema,
    localStartTime: clockSchema,
    type: z.enum(["CUSTOM_HOURS", "BLOCKED"]),
  })
  .superRefine((value, context) => {
    if (value.localStartTime >= value.localEndTime) {
      context.addIssue({
        code: "custom",
        message: "İstisna aralığının bitişi başlangıçtan sonra olmalıdır.",
        path: ["localEndTime"],
      });
    }
  });

export const availabilityExceptionSchema = z.union([closedExceptionSchema, timedExceptionSchema]);

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
export type AvailabilityExceptionInput = z.infer<typeof availabilityExceptionSchema>;
type TimedAvailabilityException = AvailabilityExceptionInput & {
  localEndTime: string;
  localStartTime: string;
  type: "CUSTOM_HOURS" | "BLOCKED";
};

export class AvailabilityResolutionConflictError extends Error {
  readonly code = "AVAILABILITY_RESOLUTION_CONFLICT";

  constructor() {
    super(
      "Aynı gün için farklı istisna tipleri birlikte çözümlenemiyor; admin incelemesi gerekli.",
    );
    this.name = "AvailabilityResolutionConflictError";
  }
}

function clockToMinutes(clock: string): number {
  const parsed = clockSchema.parse(clock);
  const [hour, minute] = parsed.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToClock(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function normalizeWindows(windows: readonly AvailabilityWindow[]): AvailabilityWindow[] {
  const ranges = windows
    .map((window) => {
      const start = clockToMinutes(window.startTime);
      const end = clockToMinutes(window.endTime);
      if (start >= end) {
        throw new RangeError("Çalışma aralığının bitişi başlangıçtan sonra olmalıdır.");
      }
      return { end, start };
    })
    .sort((left, right) => left.start - right.start || left.end - right.end);

  const merged: Array<{ end: number; start: number }> = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  return merged.map((range) => ({
    endTime: minutesToClock(range.end),
    startTime: minutesToClock(range.start),
  }));
}

export function applyAvailabilityExceptions(
  localDate: string,
  baseWindows: readonly AvailabilityWindow[],
  exceptions: readonly AvailabilityExceptionInput[],
): AvailabilityWindow[] {
  const requestedDate = localDateSchema.parse(localDate);
  const activeExceptions = exceptions
    .map((exception) => availabilityExceptionSchema.parse(exception))
    .filter((exception) => exception.status === "ACTIVE" && exception.localDate === requestedDate);

  if (activeExceptions.length === 0) return normalizeWindows(baseWindows);

  const exceptionTypes = new Set(activeExceptions.map((exception) => exception.type));
  if (exceptionTypes.size > 1) throw new AvailabilityResolutionConflictError();

  const exceptionType = activeExceptions[0].type;
  if (exceptionType === "CLOSED") return [];

  const timedExceptions = activeExceptions.filter(
    (exception): exception is TimedAvailabilityException =>
      exception.type === "CUSTOM_HOURS" || exception.type === "BLOCKED",
  );
  const exceptionWindows = timedExceptions.map((exception) => ({
    endTime: exception.localEndTime,
    startTime: exception.localStartTime,
  }));

  if (exceptionType === "CUSTOM_HOURS") return normalizeWindows(exceptionWindows);

  let availableRanges = normalizeWindows(baseWindows).map((window) => ({
    end: clockToMinutes(window.endTime),
    start: clockToMinutes(window.startTime),
  }));

  for (const blocked of exceptionWindows) {
    const blockedStart = clockToMinutes(blocked.startTime);
    const blockedEnd = clockToMinutes(blocked.endTime);
    availableRanges = availableRanges.flatMap((available) => {
      if (blockedEnd <= available.start || blockedStart >= available.end) return [available];

      const fragments: Array<{ end: number; start: number }> = [];
      if (blockedStart > available.start) {
        fragments.push({ end: blockedStart, start: available.start });
      }
      if (blockedEnd < available.end) {
        fragments.push({ end: available.end, start: blockedEnd });
      }
      return fragments;
    });
  }

  return availableRanges.map((range) => ({
    endTime: minutesToClock(range.end),
    startTime: minutesToClock(range.start),
  }));
}
