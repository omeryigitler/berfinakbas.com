import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock } = vi.hoisted(() => ({ getDatabaseMock: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";

import { listPublicAppointmentSlots } from "./public-appointment-slots-service";

const input = {
  localDate: "2031-06-02",
  practitionerId: "11111111-1111-4111-8111-111111111111",
  serviceId: "22222222-2222-4222-8222-222222222222",
};
const now = new Date("2031-06-01T06:00:00.000Z");

function createDatabaseMock() {
  return {
    availabilityException: { findMany: vi.fn().mockResolvedValue([]) },
    availabilityRule: {
      findMany: vi.fn().mockResolvedValue([
        {
          localEndTime: "12:00",
          localStartTime: "09:00",
          slotIncrementMinutes: 30,
        },
      ]),
    },
    bookingAllocation: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    practitioner: {
      findUnique: vi.fn().mockResolvedValue({ status: "ACTIVE", timeZone: "Europe/Istanbul" }),
    },
    service: {
      findUnique: vi.fn().mockResolvedValue({
        defaultBufferAfterMinutes: 5,
        defaultBufferBeforeMinutes: 5,
        defaultDurationMinutes: 50,
        policies: [
          {
            bookingMaxAdvanceDays: 60,
            bookingMinNoticeMinutes: 60,
            maxDailyAppointments: 6,
          },
        ],
        publicVisible: true,
        status: "ACTIVE",
      }),
    },
  };
}

beforeEach(() => {
  getDatabaseMock.mockReset();
});

describe("listPublicAppointmentSlots", () => {
  it("returns only generated UTC start and end times", async () => {
    const database = createDatabaseMock();
    getDatabaseMock.mockReturnValue(database);

    const slots = await listPublicAppointmentSlots(input, now);

    expect(slots.map((slot) => [slot.startsAt.toISOString(), slot.endsAt.toISOString()])).toEqual([
      ["2031-06-02T06:30:00.000Z", "2031-06-02T07:20:00.000Z"],
      ["2031-06-02T07:00:00.000Z", "2031-06-02T07:50:00.000Z"],
      ["2031-06-02T07:30:00.000Z", "2031-06-02T08:20:00.000Z"],
      ["2031-06-02T08:00:00.000Z", "2031-06-02T08:50:00.000Z"],
    ]);
    expect(database.bookingAllocation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { busyEndsAt: true, busyStartsAt: true },
        where: expect.objectContaining({ practitionerId: input.practitionerId, status: "ACTIVE" }),
      }),
    );
  });

  it("removes slots overlapping active allocations", async () => {
    const database = createDatabaseMock();
    database.bookingAllocation.findMany.mockResolvedValue([
      {
        busyEndsAt: new Date("2031-06-02T08:30:00.000Z"),
        busyStartsAt: new Date("2031-06-02T07:30:00.000Z"),
      },
    ]);
    getDatabaseMock.mockReturnValue(database);

    const slots = await listPublicAppointmentSlots(input, now);

    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual(["2031-06-02T06:30:00.000Z"]);
  });

  it("returns no slots for a closed day or a date outside the booking window", async () => {
    const database = createDatabaseMock();
    database.availabilityException.findMany.mockResolvedValue([
      {
        localEndTime: null,
        localStartTime: null,
        practitionerId: input.practitionerId,
        reasonCode: "SYNTHETIC_CLOSED",
        status: "ACTIVE",
        type: "CLOSED",
      },
    ]);
    getDatabaseMock.mockReturnValue(database);

    await expect(listPublicAppointmentSlots(input, now)).resolves.toEqual([]);
    await expect(
      listPublicAppointmentSlots({ ...input, localDate: "2032-06-02" }, now),
    ).resolves.toEqual([]);
  });

  it("fails closed for unavailable resources or ambiguous slot increments", async () => {
    const unavailableDatabase = createDatabaseMock();
    unavailableDatabase.service.findUnique.mockResolvedValue(null);
    getDatabaseMock.mockReturnValue(unavailableDatabase);
    await expect(listPublicAppointmentSlots(input, now)).rejects.toBeInstanceOf(
      BookingResourceUnavailableError,
    );

    const ambiguousDatabase = createDatabaseMock();
    ambiguousDatabase.availabilityRule.findMany.mockResolvedValue([
      { localEndTime: "12:00", localStartTime: "09:00", slotIncrementMinutes: 30 },
      { localEndTime: "16:00", localStartTime: "14:00", slotIncrementMinutes: 20 },
    ]);
    getDatabaseMock.mockReturnValue(ambiguousDatabase);
    await expect(listPublicAppointmentSlots(input, now)).rejects.toBeInstanceOf(
      BookingResourceUnavailableError,
    );
  });

  it("rejects malformed identifiers and calendar dates before database access", async () => {
    await expect(
      listPublicAppointmentSlots({ ...input, localDate: "2031-02-30", practitionerId: "bad" }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });
});
