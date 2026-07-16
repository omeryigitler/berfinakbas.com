import { beforeEach, describe, expect, it, vi } from "vitest";

const { findPotentialDuplicateClientsMock, getDatabaseMock } = vi.hoisted(() => ({
  findPotentialDuplicateClientsMock: vi.fn(),
  getDatabaseMock: vi.fn(),
}));

vi.mock("@/lib/clients/client-duplicate-review", () => ({
  findPotentialDuplicateClients: findPotentialDuplicateClientsMock,
}));
vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import {
  DuplicateReviewConflictError,
  resolveAppointmentDuplicateReview,
} from "./appointment-duplicate-review-service";

const actorUserId = "11111111-1111-4111-8111-111111111111";
const appointmentId = "22222222-2222-4222-8222-222222222222";
const sourceClientId = "33333333-3333-4333-8333-333333333333";
const targetClientId = "44444444-4444-4444-8444-444444444444";

function createDatabase(
  appointment: Record<string, unknown> = {
    client: { status: "PROSPECTIVE" },
    clientId: sourceClientId,
    duplicateReviewStatus: "PENDING",
    guardianId: null,
    id: appointmentId,
    source: "WEB",
    status: "PENDING_REVIEW",
  },
) {
  const transaction = {
    appointment: {
      count: vi.fn().mockResolvedValue(1),
      findUnique: vi.fn().mockResolvedValue(appointment),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    client: { update: vi.fn().mockResolvedValue({}) },
    consent: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
  };
  const database = {
    $transaction: vi.fn(async (callback: (value: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
    ),
  };
  return { database, transaction };
}

beforeEach(() => {
  vi.clearAllMocks();
  findPotentialDuplicateClientsMock.mockResolvedValue([
    {
      clientId: targetClientId,
      firstName: "Mevcut",
      lastName: "Danışan",
      matchReasons: ["EMAIL"],
      targetGuardianId: null,
      type: "ADULT",
    },
  ]);
});

describe("resolveAppointmentDuplicateReview", () => {
  it("keeps records separate only after an explicit audited decision", async () => {
    const { database, transaction } = createDatabase();
    getDatabaseMock.mockReturnValue(database);

    await expect(
      resolveAppointmentDuplicateReview({
        action: "KEEP_SEPARATE",
        actorUserId,
        appointmentId,
        correlationId: "duplicate-review-test",
      }),
    ).resolves.toEqual({
      appointmentId,
      clientId: sourceClientId,
      status: "KEPT_SEPARATE",
      targetClientId: null,
    });
    expect(transaction.appointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ duplicateReviewStatus: "KEPT_SEPARATE" }),
      }),
    );
    expect(transaction.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "appointment.duplicate_review_kept_separate",
          actorUserId,
        }),
      }),
    );
  });

  it("links the appointment and consent evidence, then archives the source record", async () => {
    const { database, transaction } = createDatabase();
    getDatabaseMock.mockReturnValue(database);

    await expect(
      resolveAppointmentDuplicateReview({
        action: "LINK_EXISTING",
        actorUserId,
        appointmentId,
        correlationId: "duplicate-review-test",
        targetClientId,
      }),
    ).resolves.toEqual({
      appointmentId,
      clientId: targetClientId,
      status: "LINKED_EXISTING",
      targetClientId,
    });
    expect(transaction.appointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: targetClientId,
          duplicateReviewStatus: "LINKED_EXISTING",
        }),
      }),
    );
    expect(transaction.consent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientId: targetClientId }),
      }),
    );
    expect(transaction.client.update).toHaveBeenCalledWith({
      data: { status: "INACTIVE" },
      where: { id: sourceClientId },
    });
    expect(transaction.auditLog.createMany).toHaveBeenCalled();
  });

  it("links a child request to the verified candidate guardian", async () => {
    const targetGuardianId = "55555555-5555-4555-8555-555555555555";
    const { database, transaction } = createDatabase({
      client: { status: "PROSPECTIVE" },
      clientId: sourceClientId,
      duplicateReviewStatus: "PENDING",
      guardianId: "66666666-6666-4666-8666-666666666666",
      id: appointmentId,
      source: "WEB",
      status: "PENDING_REVIEW",
    });
    getDatabaseMock.mockReturnValue(database);
    findPotentialDuplicateClientsMock.mockResolvedValue([
      {
        clientId: targetClientId,
        firstName: "Çocuk",
        lastName: "Danışan",
        matchReasons: ["GUARDIAN_PHONE"],
        targetGuardianId,
        type: "CHILD",
      },
    ]);

    await resolveAppointmentDuplicateReview({
      action: "LINK_EXISTING",
      actorUserId,
      appointmentId,
      correlationId: "duplicate-review-child-test",
      targetClientId,
    });

    expect(transaction.appointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ guardianId: targetGuardianId }),
      }),
    );
    expect(transaction.consent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          clientId: targetClientId,
          grantedByGuardianId: targetGuardianId,
        },
      }),
    );
  });

  it("refuses a target that is no longer a verified candidate", async () => {
    const { database, transaction } = createDatabase();
    getDatabaseMock.mockReturnValue(database);
    findPotentialDuplicateClientsMock.mockResolvedValue([]);

    await expect(
      resolveAppointmentDuplicateReview({
        action: "LINK_EXISTING",
        actorUserId,
        appointmentId,
        correlationId: "duplicate-review-test",
        targetClientId,
      }),
    ).rejects.toBeInstanceOf(DuplicateReviewConflictError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("refuses review after the appointment has left the review state", async () => {
    const { database, transaction } = createDatabase({
      client: { status: "PROSPECTIVE" },
      clientId: sourceClientId,
      duplicateReviewStatus: "PENDING",
      guardianId: null,
      id: appointmentId,
      source: "WEB",
      status: "CONFIRMED",
    });
    getDatabaseMock.mockReturnValue(database);

    await expect(
      resolveAppointmentDuplicateReview({
        action: "KEEP_SEPARATE",
        actorUserId,
        appointmentId,
        correlationId: "duplicate-review-test",
      }),
    ).rejects.toBeInstanceOf(DuplicateReviewConflictError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
  });
});
