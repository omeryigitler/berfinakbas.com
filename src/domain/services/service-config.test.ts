import { describe, expect, it } from "vitest";

import { createServiceSnapshot, serviceConfigSchema } from "./service-config";

const serviceConfig = {
  approvalMode: "MANUAL" as const,
  bufferAfterMinutes: 8,
  bufferBeforeMinutes: 5,
  durationMinutes: 52,
  locationType: "HYBRID" as const,
  name: "Örnek değerlendirme görüşmesi",
  policy: {
    bookingMaxAdvanceDays: 60,
    bookingMinNoticeMinutes: 1_440,
    cancellationWindowMinutes: 1_440,
    maxDailyAppointments: 6,
    rescheduleWindowMinutes: 2_880,
  },
  publicDescription: null,
  publicVisible: false,
  reason: "Sentetik test hizmeti oluşturuluyor.",
  slug: "ornek-degerlendirme-gorusmesi",
  sortOrder: 0,
  status: "DRAFT" as const,
};

describe("serviceConfigSchema", () => {
  it("accepts custom durations and buffers", () => {
    expect(serviceConfigSchema.parse(serviceConfig)).toMatchObject({
      bufferAfterMinutes: 8,
      durationMinutes: 52,
    });
  });

  it("rejects an unsafe slug", () => {
    expect(() => serviceConfigSchema.parse({ ...serviceConfig, slug: "Hizmet 1" })).toThrow();
  });
});

describe("createServiceSnapshot", () => {
  it("copies booking values into an immutable appointment-ready snapshot", () => {
    const snapshot = createServiceSnapshot("service-1", serviceConfig);

    expect(snapshot).toEqual({
      approvalMode: "MANUAL",
      bufferAfterMinutes: 8,
      bufferBeforeMinutes: 5,
      durationMinutes: 52,
      locationType: "HYBRID",
      name: "Örnek değerlendirme görüşmesi",
      policy: serviceConfig.policy,
      serviceId: "service-1",
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.policy)).toBe(true);
  });
});
