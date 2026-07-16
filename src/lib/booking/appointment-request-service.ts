import { randomBytes } from "node:crypto";

import { z } from "zod";

import {
  BookingResourceUnavailableError,
  hashHolderToken,
} from "@/domain/booking/appointment-hold";
import {
  assertBookingConsentGate,
  BookingConsentGateError,
  type BookingConsentRecord,
  mandatoryBookingDocumentTypes,
} from "@/domain/consent/booking-consent";
import type { Prisma } from "@/generated/prisma/client";
import { isRetryableTransactionError } from "@/lib/booking/appointment-hold-service";
import { getDatabase } from "@/lib/db";
import { enqueueAppointmentStatusChangedEvent } from "@/lib/integrations/appointment-outbox";

const MAX_TRANSACTION_ATTEMPTS = 3;

export const appointmentRequestPayloadSchema = z
  .object({
    clientId: z.uuid(),
    consentIds: z
      .array(z.uuid())
      .min(1)
      .max(20)
      .refine((ids) => new Set(ids).size === ids.length, "Consent kimlikleri tekil olmalıdır."),
    guardianId: z.uuid().nullable().optional().default(null),
    duplicateReviewStatus: z.enum(["NOT_REQUIRED", "PENDING"]).optional().default("NOT_REQUIRED"),
    holdId: z.uuid(),
    holderToken: z.string().min(32).max(512),
    requestNote: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional()
      .transform((value) => value || null),
  })
  .strict();

const appointmentRequestInputSchema = appointmentRequestPayloadSchema
  .extend({ correlationId: z.string().trim().min(1).max(80) })
  .strict();

const requiredDocumentTypesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[A-Z0-9_]+$/),
  )
  .max(20)
  .refine((types) => new Set(types).size === types.length, "Belge türleri tekil olmalıdır.");

const publicReferenceSchema = z
  .string()
  .min(8)
  .max(32)
  .regex(/^BR-[A-Z0-9]+$/);

export type CreateAppointmentRequestOptions = Readonly<{
  now?: Date;
  referenceFactory?: () => string;
  requiredExplicitConsentDocumentTypes?: readonly string[];
  transaction?: Prisma.TransactionClient;
}>;

export type CreatedAppointmentRequest = Readonly<{
  appointmentId: string;
  publicReference: string;
  status: "REQUESTED";
}>;

export class AppointmentHoldUnavailableError extends Error {
  readonly code = "HOLD_UNAVAILABLE";

  constructor() {
    super("Randevu saati artık kullanılamıyor. Lütfen yeniden saat seçin.");
    this.name = "AppointmentHoldUnavailableError";
  }
}

export class BookingRequestConflictError extends Error {
  readonly code = "BOOKING_REQUEST_CONFLICT";

  constructor() {
    super("Randevu talebi başka bir işlemle çakıştı. Lütfen durumu yenileyin.");
    this.name = "BookingRequestConflictError";
  }
}

export function createPublicAppointmentReference(): string {
  return `BR-${randomBytes(10).toString("hex").toUpperCase()}`;
}

function minutesBetween(later: Date, earlier: Date): number {
  const minutes = (later.getTime() - earlier.getTime()) / 60_000;
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1_440) {
    throw new BookingRequestConflictError();
  }
  return minutes;
}

export async function createAppointmentRequest(
  input: unknown,
  options: CreateAppointmentRequestOptions = {},
): Promise<CreatedAppointmentRequest> {
  const command = appointmentRequestInputSchema.parse(input);
  const now = z.date().parse(options.now ?? new Date());
  const requiredExplicitConsentDocumentTypes = requiredDocumentTypesSchema.parse([
    ...(options.requiredExplicitConsentDocumentTypes ?? []),
  ]);
  const referenceFactory = options.referenceFactory ?? createPublicAppointmentReference;
  const holderTokenHash = hashHolderToken(command.holderToken);
  const executeInTransaction = async (transaction: Prisma.TransactionClient) => {
    const hold = await transaction.appointmentHold.findUnique({
      where: { id: command.holdId },
    });

    if (!hold || hold.holderTokenHash !== holderTokenHash || hold.expiresAt <= now) {
      throw new AppointmentHoldUnavailableError();
    }
    if (hold.status === "CONSUMED") throw new BookingRequestConflictError();
    if (hold.status !== "ACTIVE") throw new AppointmentHoldUnavailableError();

    const practitioner = await transaction.practitioner.findUnique({
      select: { status: true },
      where: { id: hold.practitionerId },
    });
    const service = await transaction.service.findUnique({
      select: {
        approvalMode: true,
        locationType: true,
        name: true,
        publicVisible: true,
        status: true,
      },
      where: { id: hold.serviceId },
    });
    const policy = await transaction.servicePolicy.findFirst({
      orderBy: { effectiveFrom: "desc" },
      where: { effectiveFrom: { lte: now }, serviceId: hold.serviceId },
    });
    const allocation = await transaction.bookingAllocation.findUnique({
      select: { id: true, status: true },
      where: { holdId: hold.id },
    });
    if (
      practitioner?.status !== "ACTIVE" ||
      service?.status !== "ACTIVE" ||
      !service.publicVisible ||
      !policy
    ) {
      throw new BookingResourceUnavailableError();
    }
    if (allocation?.status !== "ACTIVE") {
      throw new BookingRequestConflictError();
    }

    const client = await transaction.client.findUnique({
      select: { id: true, status: true, type: true },
      where: { id: command.clientId },
    });
    if (!client || client.status === "INACTIVE") {
      throw new BookingResourceUnavailableError();
    }

    const guardianRelationship = command.guardianId
      ? await transaction.clientGuardian.findUnique({
          select: { authorityVerifiedAt: true },
          where: {
            clientId_guardianId: {
              clientId: command.clientId,
              guardianId: command.guardianId,
            },
          },
        })
      : null;
    const consents = await transaction.consent.findMany({
      select: {
        capturedAt: true,
        clientId: true,
        documentId: true,
        grantedByGuardianId: true,
        id: true,
        status: true,
      },
      where: { id: { in: command.consentIds } },
    });
    if (consents.length !== command.consentIds.length) {
      throw new BookingConsentGateError([{ code: "MISSING_DOCUMENT" }]);
    }
    if (consents.some((consent) => consent.clientId !== client.id)) {
      throw new BookingConsentGateError([{ code: "DOCUMENT_SUBJECT_MISMATCH" }]);
    }
    const hasMismatchedGrantor = consents.some((consent) =>
      client.type === "CHILD"
        ? consent.grantedByGuardianId !== command.guardianId
        : consent.grantedByGuardianId !== null,
    );
    if (hasMismatchedGrantor) {
      throw new BookingConsentGateError([{ code: "DOCUMENT_GRANTOR_MISMATCH" }]);
    }
    const documents = await transaction.consentDocument.findMany({
      select: { effectiveFrom: true, id: true, retiredAt: true, type: true },
      where: { id: { in: consents.map((consent) => consent.documentId) } },
    });
    const documentsById = new Map(documents.map((document) => [document.id, document]));

    const consentEvidence = consents.map((consent) => {
      const document = documentsById.get(consent.documentId);
      if (!document) {
        throw new BookingConsentGateError([{ code: "MISSING_DOCUMENT" }]);
      }
      const documentWasEffective =
        document.effectiveFrom <= consent.capturedAt &&
        (document.retiredAt === null || document.retiredAt > consent.capturedAt);

      return {
        consent,
        record: {
          documentType: document.type,
          grantedByGuardianId: consent.grantedByGuardianId,
          status: documentWasEffective ? consent.status : "EXPIRED",
          subjectClientId: consent.clientId ?? "",
        } satisfies BookingConsentRecord,
      };
    });
    const consentRecords = consentEvidence.map((evidence) => evidence.record);
    assertBookingConsentGate(
      {
        clientId: client.id,
        clientType: client.type,
        consentRecords,
        guardianAuthorityVerifiedAt: guardianRelationship?.authorityVerifiedAt,
        guardianId: command.guardianId,
        guardianRelationshipExists: command.guardianId ? guardianRelationship !== null : undefined,
        requiredExplicitConsentDocumentTypes,
      },
      "REQUEST",
    );
    const requiredDocumentTypes = new Set([
      ...mandatoryBookingDocumentTypes,
      ...requiredExplicitConsentDocumentTypes,
    ]);
    const consentsToLink = consentEvidence
      .filter(
        (evidence) =>
          requiredDocumentTypes.has(evidence.record.documentType) &&
          evidence.record.status === "GRANTED",
      )
      .map((evidence) => evidence.consent);

    const holdTransition = await transaction.appointmentHold.updateMany({
      data: { status: "CONSUMED" },
      where: {
        expiresAt: { gt: now },
        holderTokenHash,
        id: hold.id,
        status: "ACTIVE",
      },
    });
    if (holdTransition.count !== 1) throw new BookingRequestConflictError();

    const publicReference = publicReferenceSchema.parse(referenceFactory());
    const appointment = await transaction.appointment.create({
      data: {
        bufferAfterMinutesSnapshot: minutesBetween(hold.busyEndsAt, hold.endsAt),
        bufferBeforeMinutesSnapshot: minutesBetween(hold.startsAt, hold.busyStartsAt),
        busyEndsAt: hold.busyEndsAt,
        busyStartsAt: hold.busyStartsAt,
        clientId: client.id,
        createdAt: now,
        durationMinutesSnapshot: minutesBetween(hold.endsAt, hold.startsAt),
        duplicateReviewStatus: command.duplicateReviewStatus,
        endsAt: hold.endsAt,
        guardianId: command.guardianId,
        locationTypeSnapshot: service.locationType,
        policySnapshot: {
          approvalMode: service.approvalMode,
          bookingMaxAdvanceDays: policy.bookingMaxAdvanceDays,
          bookingMinNoticeMinutes: policy.bookingMinNoticeMinutes,
          cancellationWindowMinutes: policy.cancellationWindowMinutes,
          effectiveFrom: policy.effectiveFrom.toISOString(),
          maxDailyAppointments: policy.maxDailyAppointments,
          policyId: policy.id,
          rescheduleWindowMinutes: policy.rescheduleWindowMinutes,
        },
        practitionerId: hold.practitionerId,
        publicReference,
        requestNote: command.requestNote,
        serviceId: hold.serviceId,
        serviceNameSnapshot: service.name,
        source: "WEB",
        startsAt: hold.startsAt,
        status: "REQUESTED",
      },
    });

    const allocationTransfer = await transaction.bookingAllocation.updateMany({
      data: { appointmentId: appointment.id, holdId: null },
      where: { holdId: hold.id, status: "ACTIVE" },
    });
    if (allocationTransfer.count !== 1) throw new BookingRequestConflictError();

    await transaction.appointmentConsent.createMany({
      data: consentsToLink.map((consent) => ({
        appointmentId: appointment.id,
        consentId: consent.id,
      })),
    });
    await transaction.appointmentHoldStatusLog.create({
      data: {
        actorType: "CLIENT",
        fromStatus: "ACTIVE",
        holdId: hold.id,
        reasonCode: "PUBLIC_REQUEST_SUBMITTED",
        toStatus: "CONSUMED",
      },
    });
    const statusLog = await transaction.appointmentStatusLog.create({
      data: {
        actorType: "CLIENT",
        appointmentId: appointment.id,
        reasonCode: "PUBLIC_REQUEST_SUBMITTED",
        toStatus: "REQUESTED",
      },
      select: { id: true },
    });
    await transaction.auditLog.createMany({
      data: [
        {
          action: "appointment_hold.consumed",
          actorType: "CLIENT",
          afterSummary: { status: "CONSUMED" },
          beforeSummary: { status: "ACTIVE" },
          correlationId: command.correlationId,
          entityId: hold.id,
          entityType: "APPOINTMENT_HOLD",
          reason: "PUBLIC_REQUEST_SUBMITTED",
        },
        {
          action: "appointment.requested",
          actorType: "CLIENT",
          afterSummary: {
            serviceId: hold.serviceId,
            startsAt: hold.startsAt.toISOString(),
            status: "REQUESTED",
          },
          correlationId: command.correlationId,
          entityId: appointment.id,
          entityType: "APPOINTMENT",
          reason: "PUBLIC_REQUEST_SUBMITTED",
        },
      ],
    });
    await enqueueAppointmentStatusChangedEvent(transaction, {
      appointmentId: appointment.id,
      fromStatus: null,
      occurredAt: now,
      statusLogId: statusLog.id,
      toStatus: "REQUESTED",
    });

    return { appointment, publicReference };
  };

  const toCreatedAppointmentRequest = (
    result: Awaited<ReturnType<typeof executeInTransaction>>,
  ): CreatedAppointmentRequest =>
    Object.freeze({
      appointmentId: result.appointment.id,
      publicReference: result.publicReference,
      status: "REQUESTED" as const,
    });

  if (options.transaction) {
    return toCreatedAppointmentRequest(await executeInTransaction(options.transaction));
  }

  const database = getDatabase();

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      const result = await database.$transaction(executeInTransaction, {
        isolationLevel: "Serializable",
      });

      return toCreatedAppointmentRequest(result);
    } catch (error) {
      if (isRetryableTransactionError(error)) {
        if (attempt < MAX_TRANSACTION_ATTEMPTS) continue;
        throw new BookingRequestConflictError();
      }
      throw error;
    }
  }

  throw new BookingRequestConflictError();
}
