export type ZonedDateTimeFailureReason = "AMBIGUOUS" | "INVALID" | "NONEXISTENT";

export type ZonedDateTimeResult =
  | Readonly<{ date: Date; ok: true }>
  | Readonly<{ ok: false; reason: ZonedDateTimeFailureReason }>;

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
const ambiguityOffsetsMinutes = [-120, -90, -60, -30, 30, 60, 90, 120] as const;

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
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
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

export function formatDateTimeInputInZone(
  date: Date,
  timeZone: string,
): Readonly<{ date: string; time: string }> {
  const parts = partsAt(date, timeZone);
  return {
    date: `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    time: `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
  };
}

export function resolveZonedDateTime(input: {
  date: string;
  time: string;
  timeZone: string;
}): ZonedDateTimeResult {
  const desired = parseLocalDateTime(input.date, input.time);
  if (!desired) return { ok: false, reason: "INVALID" };

  try {
    let candidate = new Date(partsEpoch(desired));
    const desiredEpoch = partsEpoch(desired);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const actual = partsAt(candidate, input.timeZone);
      const delta = desiredEpoch - partsEpoch(actual);
      if (delta === 0) break;
      candidate = new Date(candidate.getTime() + delta);
    }

    if (!sameMinute(partsAt(candidate, input.timeZone), desired)) {
      return { ok: false, reason: "NONEXISTENT" };
    }

    const ambiguous = ambiguityOffsetsMinutes.some((minutes) => {
      const alternate = new Date(candidate.getTime() + minutes * 60_000);
      return sameMinute(partsAt(alternate, input.timeZone), desired);
    });
    if (ambiguous) return { ok: false, reason: "AMBIGUOUS" };

    return { date: candidate, ok: true };
  } catch {
    return { ok: false, reason: "INVALID" };
  }
}
