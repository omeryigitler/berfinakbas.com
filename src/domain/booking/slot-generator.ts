const minuteInMilliseconds = 60_000;
const clockPattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type AvailabilityWindow = Readonly<{
  endTime: string;
  startTime: string;
}>;

export type BusyBlock = Readonly<{
  endsAt: Date;
  startsAt: Date;
}>;

export type SlotCandidate = Readonly<{
  blockEndsAt: Date;
  blockStartsAt: Date;
  endsAt: Date;
  startsAt: Date;
}>;

export type GenerateDailySlotsInput = Readonly<{
  bufferAfterMinutes: number;
  bufferBeforeMinutes: number;
  busyBlocks?: readonly BusyBlock[];
  durationMinutes: number;
  existingAppointmentsCount?: number;
  localDate: string;
  maxDailyAppointments?: number | null;
  minNoticeMinutes?: number;
  now?: Date;
  slotIncrementMinutes: number;
  timeZone: string;
  windows: readonly AvailabilityWindow[];
}>;

type LocalDateTime = Readonly<{
  day: number;
  hour: number;
  minute: number;
  month: number;
  year: number;
}>;

function assertIntegerInRange(name: string, value: number, minimum: number, maximum: number) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} ${minimum}-${maximum} aralığında tam sayı olmalıdır.`);
  }
}

function parseLocalDateTime(localDate: string, localTime: string): LocalDateTime {
  if (!datePattern.test(localDate) || !clockPattern.test(localTime)) {
    throw new RangeError("Yerel tarih ve saat YYYY-MM-DD ile HH:mm biçiminde olmalıdır.");
  }

  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day, hour, minute));

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    throw new RangeError("Yerel tarih geçerli bir takvim günü olmalıdır.");
  }

  return { day, hour, minute, month, year };
}

function getZonedParts(date: Date, timeZone: string): LocalDateTime {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    month: parts.month,
    year: parts.year,
  };
}

export function zonedDateTimeToUtc(localDate: string, localTime: string, timeZone: string): Date {
  const target = parseLocalDateTime(localDate, localTime);
  const targetAsUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
  );

  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(new Date(0));
  } catch {
    throw new RangeError("Geçerli bir IANA saat dilimi kullanılmalıdır.");
  }

  let candidate = targetAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const zoned = getZonedParts(new Date(candidate), timeZone);
    const zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute);
    const adjustment = targetAsUtc - zonedAsUtc;
    candidate += adjustment;
    if (adjustment === 0) break;
  }

  const result = new Date(candidate);
  const verified = getZonedParts(result, timeZone);
  if (
    verified.year !== target.year ||
    verified.month !== target.month ||
    verified.day !== target.day ||
    verified.hour !== target.hour ||
    verified.minute !== target.minute
  ) {
    throw new RangeError("Yerel saat, saat dilimi geçişi nedeniyle mevcut değildir.");
  }

  return result;
}

function overlaps(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date) {
  return leftStart < rightEnd && leftEnd > rightStart;
}

export function generateDailySlots(input: GenerateDailySlotsInput): SlotCandidate[] {
  assertIntegerInRange("Seans süresi", input.durationMinutes, 1, 1_440);
  assertIntegerInRange("Ön buffer", input.bufferBeforeMinutes, 0, 1_440);
  assertIntegerInRange("Son buffer", input.bufferAfterMinutes, 0, 1_440);
  assertIntegerInRange("Slot artışı", input.slotIncrementMinutes, 1, 1_440);

  const minNoticeMinutes = input.minNoticeMinutes ?? 0;
  const existingAppointmentsCount = input.existingAppointmentsCount ?? 0;
  assertIntegerInRange("Minimum bildirim", minNoticeMinutes, 0, 525_600);
  assertIntegerInRange("Mevcut randevu sayısı", existingAppointmentsCount, 0, 10_000);

  if (input.maxDailyAppointments != null) {
    assertIntegerInRange("Günlük kapasite", input.maxDailyAppointments, 1, 10_000);
    if (existingAppointmentsCount >= input.maxDailyAppointments) return [];
  }

  const busyBlocks = input.busyBlocks ?? [];
  for (const block of busyBlocks) {
    if (!(block.startsAt instanceof Date) || !(block.endsAt instanceof Date)) {
      throw new TypeError("Dolu zaman aralıkları Date olmalıdır.");
    }
    if (Number.isNaN(block.startsAt.valueOf()) || Number.isNaN(block.endsAt.valueOf())) {
      throw new RangeError("Dolu zaman aralıkları geçerli tarih içermelidir.");
    }
    if (block.endsAt <= block.startsAt) {
      throw new RangeError("Dolu zaman aralığının bitişi başlangıçtan sonra olmalıdır.");
    }
  }

  const minimumStart = input.now
    ? new Date(input.now.getTime() + minNoticeMinutes * minuteInMilliseconds)
    : null;
  const slots: SlotCandidate[] = [];
  const seenStarts = new Set<number>();

  for (const window of input.windows) {
    const windowStart = zonedDateTimeToUtc(input.localDate, window.startTime, input.timeZone);
    const windowEnd = zonedDateTimeToUtc(input.localDate, window.endTime, input.timeZone);
    if (windowEnd <= windowStart) {
      throw new RangeError("Çalışma aralığının bitişi başlangıçtan sonra olmalıdır.");
    }

    for (
      let startsAtMs = windowStart.getTime();
      startsAtMs < windowEnd.getTime();
      startsAtMs += input.slotIncrementMinutes * minuteInMilliseconds
    ) {
      const startsAt = new Date(startsAtMs);
      const endsAt = new Date(startsAtMs + input.durationMinutes * minuteInMilliseconds);
      const blockStartsAt = new Date(startsAtMs - input.bufferBeforeMinutes * minuteInMilliseconds);
      const blockEndsAt = new Date(
        endsAt.getTime() + input.bufferAfterMinutes * minuteInMilliseconds,
      );

      if (blockStartsAt < windowStart) continue;
      if (blockEndsAt > windowEnd) break;
      if (minimumStart && startsAt < minimumStart) continue;
      if (seenStarts.has(startsAtMs)) continue;

      const conflicts = busyBlocks.some((busy) =>
        overlaps(blockStartsAt, blockEndsAt, busy.startsAt, busy.endsAt),
      );
      if (conflicts) continue;

      seenStarts.add(startsAtMs);
      slots.push(Object.freeze({ blockEndsAt, blockStartsAt, endsAt, startsAt }));
    }
  }

  return slots.sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
}
