export type AppointmentBlockInput = {
  bufferAfterMinutes: number;
  bufferBeforeMinutes: number;
  durationMinutes: number;
  startsAt: Date;
};

export type AppointmentBlock = {
  busyEndsAt: Date;
  busyStartsAt: Date;
  endsAt: Date;
  startsAt: Date;
};

const MINUTE_IN_MILLISECONDS = 60_000;
const MAX_CONFIGURABLE_MINUTES = 24 * 60;

function assertMinutes(name: string, value: number, allowZero: boolean): void {
  const minimum = allowZero ? 0 : 1;

  if (!Number.isInteger(value) || value < minimum || value > MAX_CONFIGURABLE_MINUTES) {
    throw new RangeError(
      `${name}, ${minimum} ile ${MAX_CONFIGURABLE_MINUTES} arasında tam sayı olmalıdır.`,
    );
  }
}

export function calculateAppointmentBlock(input: AppointmentBlockInput): AppointmentBlock {
  if (Number.isNaN(input.startsAt.getTime())) {
    throw new TypeError("Randevu başlangıç zamanı geçerli olmalıdır.");
  }

  assertMinutes("Randevu süresi", input.durationMinutes, false);
  assertMinutes("Ön buffer", input.bufferBeforeMinutes, true);
  assertMinutes("Son buffer", input.bufferAfterMinutes, true);

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + input.durationMinutes * MINUTE_IN_MILLISECONDS);
  const busyStartsAt = new Date(
    startsAt.getTime() - input.bufferBeforeMinutes * MINUTE_IN_MILLISECONDS,
  );
  const busyEndsAt = new Date(endsAt.getTime() + input.bufferAfterMinutes * MINUTE_IN_MILLISECONDS);

  return { busyEndsAt, busyStartsAt, endsAt, startsAt };
}
