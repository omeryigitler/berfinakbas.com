import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock } = vi.hoisted(() => ({ getDatabaseMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import {
  AppointmentNotFoundError,
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
    currentStatus?: "REQUESTED" | "PENDING_REVIEW" | "CONFIRMED" | "RESCHEDULE_PROPOSED";
    exists?: boolean;
    updateCount?: number;
  } = {},
) {
  const transaction = {
    appointment: {
      findUnique: vi.fn().mockResolvedValue(
        options.exists === false
          ? null
          : {
              id: command.appointmentId,
              status: options.currentStatus ?? "REQUESTED",
            },
      ),
      updateMany: vi.fn().mockResolvedValue({ count: options.updateCount ?? 1 }),
    },
    appointmentStatusLog: { create: vi.fn().mockResolvedValue({}) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    bookingAllocation: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
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
  });

  it("records the approving user and timestamp when confirming", async () => {
    const { database, transaction } = createDatabase({ currentStatus: "PENDING_REVIEW" });
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

  it("releases the active allocation when a confirmed appointment is cancelled", async () => {
    const { database, transaction } = createDatabase({ currentStatus: "CONFIRMED" });
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

  it("rejects transitions that are not allowed by the domain state machine", async () => {
    const { database, transaction } = createDatabase();
    getDatabaseMock.mockReturnValue(database);

    await expect(
      transitionAppointment({ ...command, reasonCode: "ADMIN_APPROVED", toStatus: "CONFIRMED" }),
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
  });

  it("returns a safe not-found error without creating history", async () => {
    const { database, transaction } = createDatabase({ exists: false });
    getDatabaseMock.mockReturnValue(database);

    await expect(transitionAppointment(command)).rejects.toBeInstanceOf(AppointmentNotFoundError);
    expect(transaction.appointment.updateMany).not.toHaveBeenCalled();
    expect(transaction.appointmentStatusLog.create).not.toHaveBeenCalled();
  });
});
