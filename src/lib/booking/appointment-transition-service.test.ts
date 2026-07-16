import { beforeEach, describe, expect, it, vi } from "vitest";

const { findPotentialDuplicateClientsMock, getDatabaseMock, getServerEnvironmentMock } = vi.hoisted(
  () => ({
    findPotentialDuplicateClientsMock: vi.fn(),
    getDatabaseMock: vi.fn(),
    getServerEnvironmentMock: vi.fn(),
  }),
);

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));
vi.mock("@/lib/clients/client-duplicate-review", () => ({
  findPotentialDuplicateClients: findPotentialDuplicateClientsMock,
}));

import { BookingConsentGateError } from "@/domain/consent/booking-consent";

import {
  AppointmentNotFoundError,
  AppointmentDuplicateReviewRequiredError,
  AppointmentTransitionConflictError,
  transitionAppointment,
} from "./appointment-transition-service";

const command = {
  actorUserId: "11111111-1111-4111-8111-111111111111",
  appointmentId: "22222222-2222-4222-8222-222222222222",
  correlationId: "sentetik-randevu-gecisi",
  note: "Sentetik operasyon notu",
  reasonCode: "ADMIN_REVIEW_STARTED",
  toStatus: "PENDING_REVIEW" as const,
};

function createDatabase(
  options: {
    allocationStatus?: "ACTIVE" | "RELEASED" | null;
    clientType?: "ADULT" | "CHILD";
    currentStatus?: "REQUESTED" | "PENDING_REVIEW" | "CONFIRMED" | "RESCHEDULE_PROPOSED";
    duplicateReviewStatus?: "KEPT_SEPARATE" | "LINKED_EXISTING" | "NOT_REQUIRED" | "PENDING";
    exists?: boolean;
    source?: "ADMIN" | "WEB";
    updateCount?: number;
  } = {},
) {
  const transaction = {
    appointment: {
      findUnique: vi.fn().mockResolvedValue(
        options.exists === false
          ? null
          : {
              allocation:
                options.allocationStatus === null
                  ? null
                  : { status: options.allocationStatus ?? "ACTIVE" },
              client: { type: options.clientType ?? "ADULT" },
              clientId: "44444444-4444-4444-8444-444444444444",
              consents: [],
              guardianId:
                options.clientType === "CHILD" ? "66666666-6666-4666-8666-666666666666" : null,
              id: command.appointmentId,
              duplicateReviewStatus: options.duplicateReviewStatus ?? "NOT_REQUIRED",
              source: options.source ?? "ADMIN",
              status: options.currentStatus ?? "REQUESTED",
            },
      ),
      updateMany: vi.fn().mockResolvedValue({ count: options.updateCount ?? 1 }),
    },
    appointmentStatusLog: {
      create: vi.fn().mockResolvedValue({ id: "33333333-3333-4333-8333-333333333333" }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    bookingAllocation: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    clientGuardian: {
      findUnique: vi.fn().mockResolvedValue({ authorityVerifiedAt: null }),
    },
    clientPlan: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "55555555-5555-4555-8555-555555555555",
          sessionCreditEntries: [{ quantityDelta: 2 }],
        },
      ]),
    },
    sessionCreditEntry: { create: vi.fn().mockResolvedValue({}) },
    outboxEvent: { create: vi.fn().mockResolvedValue({ id: "outbox-event" }) },
  };
  const database = {
    $transaction: vi.fn(async (callback: (value: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
    ),
  };

  return { database, transaction };
}

describe("transitionAppointment", () => {
  beforeEach(() => {
    getDatabaseMock.mockReset();
    findPotentialDuplicateClientsMock.mockReset();
    findPotentialDuplicateClientsMock.mockResolvedValue([]);
    getServerEnvironmentMock.mockReturnValue({
      BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: [],
    });
  });

  it("rejects invalid boundary input before opening a database transaction", async () => {
    await expect(
      transitionAppointment({ ...command, appointmentId: "not-a-uuid" }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it("writes the appointment, status log and privacy-safe audit in one transaction", async () => {
    const { database, transaction } = createDatabase();
    getDatabaseMock.mockReturnValue(database);

    await expect(transitionAppointment(command)).resolves.toEqual({
      appointmentId: command.appointmentId,
      fromStatus: "REQUESTED",
      toStatus: "PENDING_REVIEW",
    });
    expect(transaction.appointment.updateMany).toHaveBeenCalledWith({
      data: { status: "PENDING_REVIEW" },
      where: { id: command.appointmentId, status: "REQUESTED" },
    });
    expect(transaction.appointmentStatusLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: command.actorUserId,
        appointmentId: command.appointmentId,
        fromStatus: "REQUESTED",
        reasonCode: command.reasonCode,
        toStatus: "PENDING_REVIEW",
      }),
      select: { id: true },
    });
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "appointment.status_changed",
        actorType: "USER",
        actorUserId: command.actorUserId,
        afterSummary: { status: "PENDING_REVIEW" },
        beforeSummary: { status: "REQUESTED" },
        correlationId: command.correlationId,
        entityId: command.appointmentId,
        entityType: "APPOINTMENT",
        reason: command.reasonCode,
      },
    });
    expect(transaction.bookingAllocation.updateMany).not.toHaveBeenCalled();
    expect(transaction.outboxEvent.create).toHaveBeenCalledWith({
      data: {
        aggregateId: command.appointmentId,
        aggregateType: "APPOINTMENT",
        eventType: "APPOINTMENT_STATUS_CHANGED",
        idempotencyKey: "appointment-status-log:33333333-3333-4333-8333-333333333333",
        payload: {
          appointmentId: command.appointmentId,
          fromStatus: "REQUESTED",
          occurredAt: expect.any(String),
          statusLogId: "33333333-3333-4333-8333-333333333333",
          toStatus: "PENDING_REVIEW",
        },
      },
      select: { id: true },
    });
  });

  it("records the approving user and timestamp when confirming", async () => {
    const { database, transaction } = createDatabase({
      currentStatus: "PENDING_REVIEW",
    });
    const now = new Date("2026-07-01T09:00:00.000Z");
    getDatabaseMock.mockReturnValue(database);

    await transitionAppointment(
      { ...command, reasonCode: "ADMIN_APPROVED", toStatus: "CONFIRMED" },
      now,
    );

    expect(transaction.appointment.updateMany).toHaveBeenCalledWith({
      data: {
        approvedAt: now,
        approvedByUserId: command.actorUserId,
        status: "CONFIRMED",
      },
      where: { id: command.appointmentId, status: "PENDING_REVIEW" },
    });
  });

  it("refuses confirmation without an active booking allocation", async () => {
    const { database, transaction } = createDatabase({
      allocationStatus: "RELEASED",
      currentStatus: "PENDING_REVIEW",
    });
    getDatabaseMock.mockReturnValue(database);

    await expect(
      transitionAppointment({
        ...command,
        reasonCode: "ADMIN_APPROVED",
        toStatus: "CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(AppointmentTransitionConflictError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
    expect(transaction.appointmentStatusLog.create).not.toHaveBeenCalled();
  });

  it("releases the active allocation when a confirmed appointment is cancelled", async () => {
    const { database, transaction } = createDatabase({
      currentStatus: "CONFIRMED",
    });
    const now = new Date("2026-07-01T09:00:00.000Z");
    getDatabaseMock.mockReturnValue(database);

    await transitionAppointment(
      {
        ...command,
        reasonCode: "CLIENT_CANCELLED",
        toStatus: "CANCELLED_BY_CLIENT",
      },
      now,
    );

    expect(transaction.appointment.updateMany).toHaveBeenCalledWith({
      data: {
        cancellationReasonCode: "CLIENT_CANCELLED",
        cancelledAt: now,
        status: "CANCELLED_BY_CLIENT",
      },
      where: { id: command.appointmentId, status: "CONFIRMED" },
    });
    expect(transaction.bookingAllocation.updateMany).toHaveBeenCalledWith({
      data: { releasedAt: now, status: "RELEASED" },
      where: { appointmentId: command.appointmentId, status: "ACTIVE" },
    });
  });

  it("consumes one available session credit when a confirmed appointment completes", async () => {
    const { database, transaction } = createDatabase({
      currentStatus: "CONFIRMED",
    });
    getDatabaseMock.mockReturnValue(database);

    await transitionAppointment({
      ...command,
      reasonCode: "ADMIN_COMPLETED",
      toStatus: "COMPLETED",
    });

    expect(transaction.sessionCreditEntry.create).toHaveBeenCalledWith({
      data: {
        actorUserId: command.actorUserId,
        appointmentId: command.appointmentId,
        idempotencyKey: `appointment:${command.appointmentId}:session-consume`,
        planId: "55555555-5555-4555-8555-555555555555",
        quantityDelta: -1,
        reasonCode: "APPOINTMENT_COMPLETED",
        type: "CONSUME",
      },
    });
  });

  it("blocks web appointment confirmation until consent and guardian authority are valid", async () => {
    const { database, transaction } = createDatabase({
      clientType: "CHILD",
      currentStatus: "PENDING_REVIEW",
      source: "WEB",
    });
    getDatabaseMock.mockReturnValue(database);

    await expect(
      transitionAppointment({
        ...command,
        reasonCode: "ADMIN_APPROVED",
        toStatus: "CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(BookingConsentGateError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("blocks web confirmation while a duplicate review is pending", async () => {
    const { database, transaction } = createDatabase({
      currentStatus: "PENDING_REVIEW",
      duplicateReviewStatus: "PENDING",
      source: "WEB",
    });
    getDatabaseMock.mockReturnValue(database);

    await expect(
      transitionAppointment({
        ...command,
        reasonCode: "ADMIN_APPROVED",
        toStatus: "CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(AppointmentDuplicateReviewRequiredError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("rechecks legacy web requests for a newly discovered exact match", async () => {
    const { database, transaction } = createDatabase({
      currentStatus: "PENDING_REVIEW",
      duplicateReviewStatus: "NOT_REQUIRED",
      source: "WEB",
    });
    getDatabaseMock.mockReturnValue(database);
    findPotentialDuplicateClientsMock.mockResolvedValue([{ clientId: "candidate" }]);

    await expect(
      transitionAppointment({
        ...command,
        reasonCode: "ADMIN_APPROVED",
        toStatus: "CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(AppointmentDuplicateReviewRequiredError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("rejects transitions that are not allowed by the domain state machine", async () => {
    const { database, transaction } = createDatabase();
    getDatabaseMock.mockReturnValue(database);

    await expect(
      transitionAppointment({
        ...command,
        reasonCode: "ADMIN_APPROVED",
        toStatus: "CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(AppointmentTransitionConflictError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
    expect(transaction.appointmentStatusLog.create).not.toHaveBeenCalled();
  });

  it("fails safely when another request wins the status race", async () => {
    const { database, transaction } = createDatabase({ updateCount: 0 });
    getDatabaseMock.mockReturnValue(database);

    await expect(transitionAppointment(command)).rejects.toBeInstanceOf(
      AppointmentTransitionConflictError,
    );
    expect(transaction.appointmentStatusLog.create).not.toHaveBeenCalled();
    expect(transaction.auditLog.create).not.toHaveBeenCalled();
    expect(transaction.outboxEvent.create).not.toHaveBeenCalled();
  });

  it("returns a safe not-found error without creating history", async () => {
    const { database, transaction } = createDatabase({ exists: false });
    getDatabaseMock.mockReturnValue(database);

    await expect(transitionAppointment(command)).rejects.toBeInstanceOf(AppointmentNotFoundError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
    expect(transaction.appointmentStatusLog.create).not.toHaveBeenCalled();
  });
});
