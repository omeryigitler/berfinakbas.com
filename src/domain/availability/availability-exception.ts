export type AvailabilityExceptionType = "BLOCKED" | "CLOSED" | "CUSTOM_HOURS";

export type AvailabilityTimeOption = Readonly<{ label: string; value: string }>;

export function isValidAvailabilityDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidAvailabilityTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function filterEndTimeOptions(
  options: readonly AvailabilityTimeOption[],
  startTime: string,
): AvailabilityTimeOption[] {
  return options.filter((option) => option.value > startTime);
}

export function availabilityExceptionValidationMessage(input: {
  localDate: string;
  localEndTime: string;
  localStartTime: string;
  practitionerId: string;
  type: AvailabilityExceptionType;
}): string | null {
  if (!input.practitionerId) return "Terapist bilgisi bulunamadı.";
  if (!isValidAvailabilityDate(input.localDate)) return "Geçerli bir tarih seçmelisiniz.";
  if (input.type === "CLOSED") return null;
  if (!isValidAvailabilityTime(input.localStartTime)) {
    return "Başlangıç saatini seçmelisiniz.";
  }
  if (!isValidAvailabilityTime(input.localEndTime)) {
    return "Bitiş saatini seçmelisiniz.";
  }
  if (input.localStartTime >= input.localEndTime) {
    return "Bitiş saati başlangıç saatinden sonra olmalıdır.";
  }
  return null;
}
