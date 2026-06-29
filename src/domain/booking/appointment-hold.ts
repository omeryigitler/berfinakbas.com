import { createHash, randomBytes } from "node:crypto";

import { calculateAppointmentBlock } from "./appointment-block";

const MINUTE_IN_MILLISECONDS = 60_000;
const MAX_HOLD_DURATION_MINUTES = 1_440;

export type PrepareAppointmentHoldInput = Readonly<{
  bufferAfterMinutes: number;
  bufferBeforeMinutes: number;
  durationMinutes: number;
  holdDurationMinutes: number;
  now: Date;
  startsAt: Date;
  token?: string;
}>;

export type PreparedAppointmentHold = Readonly<{
  busyEndsAt: Date;
  busyStartsAt: Date;
  endsAt: Date;
  expiresAt: Date;
  holderToken: string;
  holderTokenHash: string;
  startsAt: Date;
}>;

export class SlotConflictError extends Error {
  readonly code = "SLOT_CONFLICT";

  constructor() {
    super("Seçilen saat artık uygun değil. Lütfen başka bir saat seçin.");
    this.name = "SlotConflictError";
  }
}

export class BookingResourceUnavailableError extends Error {
  readonly code = "BOOKING_RESOURCE_UNAVAILABLE";

  constructor() {
    super("Seçilen hizmet veya uzman şu anda randevuya açık değil.");
    this.name = "BookingResourceUnavailableError";
  }
}

function assertValidDate(name: string, value: Date): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError(`${name} geçerli bir tarih olmalıdır.`);
  }
}

function assertHoldDuration(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > MAX_HOLD_DURATION_MINUTES) {
    throw new RangeError(
      `Hold süresi 1 ile ${MAX_HOLD_DURATION_MINUTES} dakika arasında tam sayı olmalıdır.`,
    );
  }
}

export function createHolderToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashHolderToken(token: string): string {
  if (token.length < 32) {
    throw new RangeError("Hold token değeri en az 32 karakter olmalıdır.");
  }

  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function prepareAppointmentHold(
  input: PrepareAppointmentHoldInput,
): PreparedAppointmentHold {
  assertValidDate("Şimdiki zaman", input.now);
  assertValidDate("Slot başlangıcı", input.startsAt);
  assertHoldDuration(input.holdDurationMinutes);

  if (input.startsAt <= input.now) {
    throw new RangeError("Yalnızca gelecekteki bir slot için hold oluşturulabilir.");
  }

  const holderToken = input.token ?? createHolderToken();
  const block = calculateAppointmentBlock(input);
  const configuredExpiry = input.now.getTime() + input.holdDurationMinutes * MINUTE_IN_MILLISECONDS;

  return Object.freeze({
    ...block,
    expiresAt: new Date(Math.min(configuredExpiry, input.startsAt.getTime())),
    holderToken,
    holderTokenHash: hashHolderToken(holderToken),
  });
}

export function assertMinimumBookingNotice(
  startsAt: Date,
  now: Date,
  minimumNoticeMinutes: number,
): void {
  if (!Number.isInteger(minimumNoticeMinutes) || minimumNoticeMinutes < 0) {
    throw new RangeError("Minimum bildirim süresi negatif olmayan tam sayı olmalıdır.");
  }

  const earliestStart = now.getTime() + minimumNoticeMinutes * MINUTE_IN_MILLISECONDS;
  if (startsAt.getTime() < earliestStart) {
    throw new SlotConflictError();
  }
}
