export type ZonedDateTimeFailureReason = "AMBIGUOUS" | "INVALID" | "NONEXISTENT";

export type ZonedDateTimeResult =
  Readonly<{ date: Date; ok: true }> | Readonly<{ ok: false; reason: ZonedDateTimeFailureReason }>;

export type ZonedRange = Readonly<{ end: Date; start: Date }>;

type DateTimeParts = Readonly<{
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
}>;

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

function partsAt(date: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return {
    day: Number(values.get("day")),
    hour: Number(values.get("hour")),
    minute: Number(values.get("minute")),
    month: Number(values.get("month")),
    second: Number(values.get("second")),
    year: Number(values.get("year")),
  };
}

function partsEpoch(parts: DateTimeParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function sameMinute(left: DateTimeParts, right: DateTimeParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

function parseLocalDateTime(date: string, time: string): DateTimeParts | null {
  const dateMatch = datePattern.exec(date);
  const timeMatch = timePattern.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const parts: DateTimeParts = {
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    month: Number(dateMatch[2]),
    second: 0,
    year: Number(dateMatch[1]),
  };
  const roundTrip = new Date(partsEpoch(parts));
  if (
    roundTrip.getUTCFullYear() !== parts.year ||
    roundTrip.getUTCMonth() + 1 !== parts.month ||
    roundTrip.getUTCDate() !== parts.day
  ) {
    return null;
  }

  return parts;
}

function dateKey(parts: Pick<DateTimeParts, "day" | "month" | "year">): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function timeKey(parts: Pick<DateTimeParts, "hour" | "minute">): string {
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function calendarShift(date: string, days: number): string {
  const match = datePattern.exec(date);
  if (!match) throw new Error("Takvim tarihi geçersiz.");
  const shifted = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days),
  );
  return shifted.toISOString().slice(0, 10);
}

function startOfCalendarMonth(date: string): string {
  const match = datePattern.exec(date);
  if (!match) throw new Error("Takvim tarihi geçersiz.");
  return `${match[1]}-${match[2]}-01`;
}

function startOfNextCalendarMonth(date: string): string {
  const match = datePattern.exec(date);
  if (!match) throw new Error("Takvim tarihi geçersiz.");
  return new Date(Date.UTC(Number(match[1]), Number(match[2]), 1)).toISOString().slice(0, 10);
}

function zonedDateTimeCandidates(desired: DateTimeParts, timeZone: string): Date[] {
  let candidate = new Date(partsEpoch(desired));
  const desiredEpoch = partsEpoch(desired);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = partsAt(candidate, timeZone);
    const delta = desiredEpoch - partsEpoch(actual);
    if (delta === 0) break;
    candidate = new Date(candidate.getTime() + delta);
  }

  const matches = new Map<number, Date>();
  for (let minutes = -180; minutes <= 180; minutes += 15) {
    const alternate = new Date(candidate.getTime() + minutes * 60_000);
    if (sameMinute(partsAt(alternate, timeZone), desired)) {
      matches.set(alternate.getTime(), alternate);
    }
  }
  return [...matches.values()].sort((left, right) => left.getTime() - right.getTime());
}

function resolveZonedBoundary(date: string, timeZone: string): Date {
  for (let minuteOfDay = 0; minuteOfDay < 240; minuteOfDay += 1) {
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    const desired = parseLocalDateTime(
      date,
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
    if (!desired) break;
    const candidates = zonedDateTimeCandidates(desired, timeZone);
    if (candidates.length > 0) return candidates[0];
  }
  throw new Error(`Saat diliminde gün başlangıcı çözümlenemedi: ${timeZone} ${date}`);
}

export function formatDateTimeInputInZone(
  date: Date,
  timeZone: string,
): Readonly<{ date: string; time: string }> {
  const parts = partsAt(date, timeZone);
  return { date: dateKey(parts), time: timeKey(parts) };
}

export function resolveZonedDateTime(input: {
  date: string;
  time: string;
  timeZone: string;
}): ZonedDateTimeResult {
  const desired = parseLocalDateTime(input.date, input.time);
  if (!desired) return { ok: false, reason: "INVALID" };

  try {
    const candidates = zonedDateTimeCandidates(desired, input.timeZone);
    if (candidates.length === 0) return { ok: false, reason: "NONEXISTENT" };
    if (candidates.length > 1) return { ok: false, reason: "AMBIGUOUS" };
    return { date: candidates[0], ok: true };
  } catch {
    return { ok: false, reason: "INVALID" };
  }
}

export function getZonedDayRange(reference: Date, timeZone: string): ZonedRange {
  const localDate = dateKey(partsAt(reference, timeZone));
  return {
    end: resolveZonedBoundary(calendarShift(localDate, 1), timeZone),
    start: resolveZonedBoundary(localDate, timeZone),
  };
}

export function getZonedMonthRange(reference: Date, timeZone: string): ZonedRange {
  const localDate = dateKey(partsAt(reference, timeZone));
  const monthStart = startOfCalendarMonth(localDate);
  return {
    end: resolveZonedBoundary(startOfNextCalendarMonth(localDate), timeZone),
    start: resolveZonedBoundary(monthStart, timeZone),
  };
}

export function getZonedWeekRange(reference: Date, timeZone: string): ZonedRange {
  const localDate = dateKey(partsAt(reference, timeZone));
  const [year, month, day] = localDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  const weekStart = calendarShift(localDate, -daysSinceMonday);
  return {
    end: resolveZonedBoundary(calendarShift(weekStart, 7), timeZone),
    start: resolveZonedBoundary(weekStart, timeZone),
  };
}
