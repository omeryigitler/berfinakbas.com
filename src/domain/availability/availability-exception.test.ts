import { describe, expect, it } from "vitest";

import {
  availabilityExceptionValidationMessage,
  filterEndTimeOptions,
  isValidAvailabilityDate,
  isValidAvailabilityTime,
} from "./availability-exception";

describe("availability exception validation", () => {
  it("accepts exact calendar dates and rejects impossible dates", () => {
    expect(isValidAvailabilityDate("2026-07-20")).toBe(true);
    expect(isValidAvailabilityDate("2026-02-30")).toBe(false);
    expect(isValidAvailabilityDate("20-07-2026")).toBe(false);
  });

  it("accepts only 24-hour clock values", () => {
    expect(isValidAvailabilityTime("09:15")).toBe(true);
    expect(isValidAvailabilityTime("23:45")).toBe(true);
    expect(isValidAvailabilityTime("24:00")).toBe(false);
    expect(isValidAvailabilityTime("9:15")).toBe(false);
  });

  it("does not require a time range for a closed day", () => {
    expect(
      availabilityExceptionValidationMessage({
        localDate: "2026-07-20",
        localEndTime: "",
        localStartTime: "",
        practitionerId: "practitioner-1",
        type: "CLOSED",
      }),
    ).toBeNull();
  });

  it("returns clear errors for incomplete and inverted time ranges", () => {
    const base = {
      localDate: "2026-07-20",
      practitionerId: "practitioner-1",
      type: "BLOCKED" as const,
    };

    expect(
      availabilityExceptionValidationMessage({
        ...base,
        localEndTime: "17:00",
        localStartTime: "",
      }),
    ).toBe("Başlangıç saatini seçmelisiniz.");
    expect(
      availabilityExceptionValidationMessage({
        ...base,
        localEndTime: "",
        localStartTime: "09:00",
      }),
    ).toBe("Bitiş saatini seçmelisiniz.");
    expect(
      availabilityExceptionValidationMessage({
        ...base,
        localEndTime: "09:00",
        localStartTime: "17:00",
      }),
    ).toBe("Bitiş saati başlangıç saatinden sonra olmalıdır.");
  });

  it("accepts a valid blocked range", () => {
    expect(
      availabilityExceptionValidationMessage({
        localDate: "2026-07-20",
        localEndTime: "17:00",
        localStartTime: "09:00",
        practitionerId: "practitioner-1",
        type: "BLOCKED",
      }),
    ).toBeNull();
  });

  it("filters end-time options to values after the selected start", () => {
    const options = [
      { label: "09:00", value: "09:00" },
      { label: "09:15", value: "09:15" },
      { label: "09:30", value: "09:30" },
    ];

    expect(filterEndTimeOptions(options, "09:00")).toEqual(options.slice(1));
    expect(filterEndTimeOptions(options, "09:30")).toEqual([]);
  });
});
