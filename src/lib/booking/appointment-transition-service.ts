import { z } from "zod";

import {
  assertAppointmentTransition,
  type AppointmentStatus as DomainAppointmentStatus,
} from "@/domain/booking/appointment-status";
import {
  assertBookingConsentGate,
  type BookingConsentRecord,
} from "@/domain/consent/booking-consent";
import { isRetryableTransactionError } from "@/lib/booking/appointment-hold-service";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { enqueueAppointmentStatusChangedEvent } from "@/lib/integrations/appointment-outbox";
import { findPotentialDuplicateClients } from "@/lib/clients/client-duplicate-review";

const MAX_TRANSACTION_ATTEMPTS = 3;

export const databaseAppointmentStatuses = [
  "REQUESTED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "REJECTED",
  "RESCHEDULE_PROPOSED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_PRACTITIONER",
  "COMPLETED",
  "NO_SHOW",
] as const;

export type DatabaseAppointmentStatus = (typeof databaseAppointmentStatuses)[number];

const domainStatusByDatabaseStatus = {
  CANCELLED_BY_CLIENT: "cancelled_by_client",
  CANCELLED_BY_PRACTITIONER: "cancelled_by_practitioner",
  COMPLETED: "completed",
  CONFIRMED: "confirmed",
  NO_SHOW: "no_show",
  PENDING_REVIEW: "pending_review",
  REJECTED: "rejected",
  REQUESTED: "requested",
  RESCHEDULE_PROPOSED: "reschedule_proposed",
} satisfies Record<DatabaseAppointmentStatus, DomainAppointmentStatus>;

const allocationReleasingStatuses = new Set<DatabaseAppointmentStatus>([
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_PRACTITIONER",
  "REJECTED",
]);

export const transitionAppointmentSchema = z.object({
  actorUserId: z.uuid(),
  appointmentId: z.uuid(),
  correlationId: z.string().trim().min(1).max(80),
  note: z.string().trim().min(1).max(500).nullable().optional(),
  reasonCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_]+$/)
    .min(3)
    .max(80),
  toStatus: z.enum(databaseAppointmentStatuses),
});

export const transitionAppointmentRequestSchema = transitionAppointmentSchema.pick({
  note: true,
  reasonCode: true,
  toStatus: true,
});

export class AppointmentNotFoundError extends Error {
  readonly code = "APPOINTMENT_NOT_FOUND";

  constructor() {
    super("Randevu bulunamadı.");
    this.name = "AppointmentNotFoundError";
  }
}

export class AppointmentTransitionConflictError extends Error {
  readonly code = "APPOINTMENT_TRANSITION_CONFLICT";

  constructor() {
    super("Randevu durumu değişti veya istenen geçişe izin verilmiyor.");
    this.name = "AppointmentTransitionConflictError";
  }
}

export class AppointmentDuplicateReviewRequiredError extends Error {
  readonly code = "DUPLICATE_REVIEW_REQUIRED";

  constructor() {
    super("Olası mükerrer danışan kaydı incelenmeden randevu onaylanamaz.");
    this.name = "AppointmentDuplicateReviewRequiredError";
  }
}

export type TransitionedAppointment = Readonly<{
  appointmentId: string;
  fromStatus: DatabaseAppointmentStatus;
  toStatus: DatabaseAppointmentStatus;
}>;

export async function transitionAppointment(
  input: unknown,
  now = new Date(),
): Promise<TransitionedAppointment> {
  const command = transitionAppointmentSchema.parse(input);
  const database = getDatabase();
  const requiredExplicitConsentDocumentTypes =
    getServerEnvironment().BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await database.$transaction(
        async (transaction) => {
          const appointment = await transaction.appointment.findUnique({
            select: {
              allocation: { select: { status: true } },
              client: { select: { type: true } },
              clientId: true,
              consents: {
                select: {
                  consent: {
                    select: {
                      capturedAt: true,
                      clientId: true,
                      document: {
                        select: { effectiveFrom: true, retiredAt: true, type: true },
                      },
                      grantedByGuardianId: true,
                      status: true,
                    },
                  },
                },
              },
              guardianId: true,
              id: true,
              duplicateReviewStatus: true,
              source: true,
              status: true,
            },
            where: { id: command.appointmentId },
          });

          if (!appointment) throw new AppointmentNotFoundError();

          try {
            assertAppointmentTransition(
              domainStatusByDatabaseStatus[appointment.status],
              domainStatusByDatabaseStatus[command.toStatus],
            );
          } catch {
            throw new AppointmentTransitionConflictError();
          }
          if (command.toStatus === "CONFIRMED" && appointment.allocation?.status !== "ACTIVE") {
            throw new AppointmentTransitionConflictError();
          }

          if (command.toStatus === "CONFIRMED" && appointment.source === "WEB") {
            if (
              appointment.duplicateReviewStatus === "PENDING" ||
              (appointment.duplicateReviewStatus === "NOT_REQUIRED" &&
                (await findPotentialDuplicateClients(transaction, appointment.clientId)).length > 0)
            ) {
              throw new AppointmentDuplicateReviewRequiredError();
            }

            const guardianRelationship = appointment.guardianId
              ? await transaction.clientGuardian.findUnique({
                  select: { authorityVerifiedAt: true },
                  where: {
                    clientId_guardianId: {
                      clientId: appointment.clientId,
                      guardianId: appointment.guardianId,
                    },
                  },
                })
              : null;
            const consentRecords = appointment.consents.map(({ consent }) => {
              const documentWasEffective =
                consent.document.effectiveFrom <= consent.capturedAt &&
                (consent.document.retiredAt === null ||
                  consent.document.retiredAt > consent.capturedAt);

              return {
                documentType: consent.document.type,
                grantedByGuardianId: consent.grantedByGuardianId,
                status: documentWasEffective ? consent.status : "EXPIRED",
                subjectClientId: consent.clientId ?? "",
              } satisfies BookingConsentRecord;
            });

            assertBookingConsentGate(
              {
                clientId: appointment.clientId,
                clientType: appointment.client.type,
                consentRecords,
                guardianAuthorityVerifiedAt: guardianRelationship?.authorityVerifiedAt,
                guardianId: appointment.guardianId,
                guardianRelationshipExists: appointment.guardianId
                  ? guardianRelationship !== null
                  : undefined,
                requiredExplicitConsentDocumentTypes,
              },
              "CONFIRM",
            );
          }

          const isCancellation =
            command.toStatus === "CANCELLED_BY_CLIENT" ||
            command.toStatus === "CANCELLED_BY_PRACTITIONER";
          const transition = await transaction.appointment.updateMany({
            data: {
              ...(command.toStatus === "CONFIRMED"
                ? { approvedAt: now, approvedByUserId: command.actorUserId }
                : {}),
              ...(isCancellation
                ? { cancellationReasonCode: command.reasonCode, cancelledAt: now }
                : {}),
              status: command.toStatus,
            },
            where: { id: appointment.id, status: appointment.status },
          });

          if (transition.count !== 1) throw new AppointmentTransitionConflictError();

          if (command.toStatus === "COMPLETED") {
            const plans = await transaction.clientPlan.findMany({
              include: { sessionCreditEntries: { select: { quantityDelta: true } } },
              orderBy: [{ createdAt: "desc" }],
              where: { clientId: appointment.clientId, status: "ACTIVE" },
            });
            const plan = plans.find(
              (candidate) =>
                candidate.sessionCreditEntries.reduce(
                  (total, entry) => total + entry.quantityDelta,
                  0,
                ) > 0,
            );
            if (plan) {
              await transaction.sessionCreditEntry.create({
                data: {
                  actorUserId: command.actorUserId,
                  appointmentId: appointment.id,
                  idempotencyKey: `appointment:${appointment.id}:session-consume`,
                  planId: plan.id,
                  quantityDelta: -1,
                  reasonCode: "APPOINTMENT_COMPLETED",
                  type: "CONSUME",
                },
              });
            }
          }

          const statusLog = await transaction.appointmentStatusLog.create({
            data: {
              actorType: "USER",
              actorUserId: command.actorUserId,
              appointmentId: appointment.id,
              fromStatus: appointment.status,
              note: command.note ?? null,
              reasonCode: command.reasonCode,
              toStatus: command.toStatus,
            },
            select: { id: true },
          });

          if (allocationReleasingStatuses.has(command.toStatus)) {
            await transaction.bookingAllocation.updateMany({
              data: { releasedAt: now, status: "RELEASED" },
              where: { appointmentId: appointment.id, status: "ACTIVE" },
            });
          }

          await transaction.auditLog.create({
            data: {
              action: "appointment.status_changed",
              actorType: "USER",
              actorUserId: command.actorUserId,
              afterSummary: { status: command.toStatus },
              beforeSummary: { status: appointment.status },
              correlationId: command.correlationId,
              entityId: appointment.id,
              entityType: "APPOINTMENT",
              reason: command.reasonCode,
            },
          });

          await enqueueAppointmentStatusChangedEvent(transaction, {
            appointmentId: appointment.id,
            fromStatus: appointment.status,
            occurredAt: now,
            statusLogId: statusLog.id,
            toStatus: command.toStatus,
          });

          return Object.freeze({
            appointmentId: appointment.id,
            fromStatus: appointment.status,
            toStatus: command.toStatus,
          });
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (isRetryableTransactionError(error)) {
        if (attempt < MAX_TRANSACTION_ATTEMPTS) continue;
        throw new AppointmentTransitionConflictError();
      }
      throw error;
    }
  }

  throw new AppointmentTransitionConflictError();
}
