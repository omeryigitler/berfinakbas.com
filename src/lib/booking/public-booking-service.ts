import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  BookingResourceUnavailableError,
  hashHolderToken,
} from "@/domain/booking/appointment-hold";
import {
  BookingConsentGateError,
  mandatoryBookingDocumentTypes,
} from "@/domain/consent/booking-consent";
import type { Prisma } from "@/generated/prisma/client";
import {
  AppointmentHoldUnavailableError,
  BookingRequestConflictError,
  createAppointmentRequest,
  createPublicAppointmentReference,
  type CreatedAppointmentRequest,
} from "@/lib/booking/appointment-request-service";
import { isRetryableTransactionError } from "@/lib/booking/appointment-hold-service";
import { getDatabase } from "@/lib/db";
import { findPotentialDuplicateClients } from "@/lib/clients/client-duplicate-review";

const MAX_TRANSACTION_ATTEMPTS = 3;

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

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.email().max(320).optional(),
);

const personNameSchema = z.string().trim().min(1).max(120);
const phoneSchema = z.string().trim().min(7).max(40);

const adultSubjectSchema = z
  .object({
    email: optionalEmailSchema,
    firstName: personNameSchema,
    lastName: personNameSchema,
    phone: phoneSchema,
    type: z.literal("ADULT"),
  })
  .strict();

const childSubjectSchema = z
  .object({
    firstName: personNameSchema,
    guardian: z
      .object({
        email: optionalEmailSchema,
        firstName: personNameSchema,
        lastName: personNameSchema,
        phone: phoneSchema,
        relationship: z.enum([
          "PARENT_DECLARED",
          "LEGAL_REPRESENTATIVE_DECLARED",
          "OTHER_DECLARED",
        ]),
      })
      .strict(),
    lastName: personNameSchema,
    type: z.literal("CHILD"),
  })
  .strict();

export const publicBookingSubmissionPayloadSchema = z
  .object({
    acknowledgedDocumentIds: z
      .array(z.uuid())
      .min(mandatoryBookingDocumentTypes.length)
      .max(20)
      .refine((ids) => new Set(ids).size === ids.length, "Belge kimlikleri tekil olmalıdır."),
    holdId: z.uuid(),
    holderToken: z.string().min(32).max(512),
    subject: z.discriminatedUnion("type", [adultSubjectSchema, childSubjectSchema]),
  })
  .strict();

const publicBookingSubmissionInputSchema = publicBookingSubmissionPayloadSchema
  .extend({ correlationId: z.string().trim().min(1).max(80) })
  .strict();

const publicBookingOptionsSchema = z.object({
  publicPractitionerId: z.uuid(),
  requiredExplicitConsentDocumentTypes: requiredDocumentTypesSchema,
});

type PublicConsentDocumentRecord = Readonly<{
  contentHash: string;
  effectiveFrom: Date;
  id: string;
  publicContent: string | null;
  publicTitle: string | null;
  retiredAt: Date | null;
  type: string;
  version: string;
}>;

export type PublicBookingBootstrap = Readonly<{
  consentDocuments: readonly Readonly<{
    content: string;
    contentHash: string;
    id: string;
    title: string;
    type: string;
    version: string;
  }>[];
  practitioner: Readonly<{
    displayName: string;
    id: string;
    timeZone: string;
  }>;
  services: readonly Readonly<{
    description: string | null;
    durationMinutes: number;
    id: string;
    locationType: "IN_PERSON" | "ONLINE" | "HYBRID";
    name: string;
  }>[];
}>;

export type PublicBookingServiceOptions = Readonly<{
  now?: Date;
  publicPractitionerId: string;
  referenceFactory?: () => string;
  requiredExplicitConsentDocumentTypes?: readonly string[];
}>;

export function getInitialDuplicateReviewStatus(
  candidateCount: number,
): "NOT_REQUIRED" | "PENDING" {
  return candidateCount > 0 ? "PENDING" : "NOT_REQUIRED";
}

function getRequiredDocumentTypes(explicitTypes: readonly string[]): readonly string[] {
  return Object.freeze([...new Set([...mandatoryBookingDocumentTypes, ...explicitTypes])]);
}

export function resolveRequiredPublicConsentDocuments(
  documents: readonly PublicConsentDocumentRecord[],
  requiredDocumentTypes: readonly string[],
  now: Date,
): readonly PublicConsentDocumentRecord[] {
  const resolved = requiredDocumentTypes.map((documentType) => {
    const currentDocuments = documents.filter(
      (document) =>
        document.type === documentType &&
        document.effectiveFrom <= now &&
        (document.retiredAt === null || document.retiredAt > now),
    );
    if (currentDocuments.length !== 1) throw new BookingResourceUnavailableError();

    const document = currentDocuments[0];
    if (!document.publicTitle?.trim() || !document.publicContent?.trim()) {
      throw new BookingResourceUnavailableError();
    }
    return document;
  });

  return Object.freeze(resolved);
}

async function findCurrentPublicConsentDocuments(
  transaction: Prisma.TransactionClient,
  requiredDocumentTypes: readonly string[],
  now: Date,
): Promise<readonly PublicConsentDocumentRecord[]> {
  const documents = await transaction.consentDocument.findMany({
    orderBy: [{ type: "asc" }, { effectiveFrom: "desc" }, { id: "asc" }],
    select: {
      contentHash: true,
      effectiveFrom: true,
      id: true,
      publicContent: true,
      publicTitle: true,
      retiredAt: true,
      type: true,
      version: true,
    },
    where: {
      effectiveFrom: { lte: now },
      OR: [{ retiredAt: null }, { retiredAt: { gt: now } }],
      type: { in: [...requiredDocumentTypes] },
    },
  });

  return resolveRequiredPublicConsentDocuments(documents, requiredDocumentTypes, now);
}

export async function getPublicBookingBootstrap(
  publicPractitionerId: string,
  requiredExplicitConsentDocumentTypes: readonly string[] = [],
  now = new Date(),
): Promise<PublicBookingBootstrap> {
  const options = publicBookingOptionsSchema.parse({
    publicPractitionerId,
    requiredExplicitConsentDocumentTypes: [...requiredExplicitConsentDocumentTypes],
  });
  const currentTime = z.date().parse(now);
  const requiredDocumentTypes = getRequiredDocumentTypes(
    options.requiredExplicitConsentDocumentTypes,
  );
  const database = getDatabase();

  return database.$transaction(async (transaction) => {
    const [practitioner, services, documents] = await Promise.all([
      transaction.practitioner.findUnique({
        select: { displayName: true, id: true, status: true, timeZone: true },
        where: { id: options.publicPractitionerId },
      }),
      transaction.service.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
        select: {
          defaultDurationMinutes: true,
          id: true,
          locationType: true,
          name: true,
          publicDescription: true,
        },
        where: {
          policies: { some: { effectiveFrom: { lte: currentTime } } },
          publicVisible: true,
          status: "ACTIVE",
        },
      }),
      findCurrentPublicConsentDocuments(transaction, requiredDocumentTypes, currentTime),
    ]);

    if (practitioner?.status !== "ACTIVE" || services.length === 0) {
      throw new BookingResourceUnavailableError();
    }

    return Object.freeze({
      consentDocuments: Object.freeze(
        documents.map((document) =>
          Object.freeze({
            content: document.publicContent?.trim() ?? "",
            contentHash: document.contentHash,
            id: document.id,
            title: document.publicTitle?.trim() ?? "",
            type: document.type,
            version: document.version,
          }),
        ),
      ),
      practitioner: Object.freeze({
        displayName: practitioner.displayName,
        id: practitioner.id,
        timeZone: practitioner.timeZone,
      }),
      services: Object.freeze(
        services.map((service) =>
          Object.freeze({
            description: service.publicDescription,
            durationMinutes: service.defaultDurationMinutes,
            id: service.id,
            locationType: service.locationType,
            name: service.name,
          }),
        ),
      ),
    });
  });
}

async function verifyHoldBeforeIdentityWrite(
  transaction: Prisma.TransactionClient,
  command: z.infer<typeof publicBookingSubmissionInputSchema>,
  publicPractitionerId: string,
  now: Date,
): Promise<void> {
  const hold = await transaction.appointmentHold.findUnique({
    select: {
      expiresAt: true,
      holderTokenHash: true,
      practitionerId: true,
      status: true,
    },
    where: { id: command.holdId },
  });

  if (
    !hold ||
    hold.holderTokenHash !== hashHolderToken(command.holderToken) ||
    hold.expiresAt <= now ||
    hold.practitionerId !== publicPractitionerId
  ) {
    throw new AppointmentHoldUnavailableError();
  }
  if (hold.status === "CONSUMED") throw new BookingRequestConflictError();
  if (hold.status !== "ACTIVE") throw new AppointmentHoldUnavailableError();
}

async function createIdentityAndConsentEvidence(
  transaction: Prisma.TransactionClient,
  command: z.infer<typeof publicBookingSubmissionInputSchema>,
  documents: readonly PublicConsentDocumentRecord[],
  now: Date,
): Promise<
  Readonly<{ clientId: string; consentIds: readonly string[]; guardianId: string | null }>
> {
  const requiredDocumentIds = new Set(documents.map((document) => document.id));
  if (
    command.acknowledgedDocumentIds.length !== requiredDocumentIds.size ||
    command.acknowledgedDocumentIds.some((documentId) => !requiredDocumentIds.has(documentId))
  ) {
    throw new BookingConsentGateError([{ code: "MISSING_DOCUMENT" }]);
  }

  const client = await transaction.client.create({
    data: {
      email: command.subject.type === "ADULT" ? command.subject.email : null,
      firstName: command.subject.firstName,
      lastName: command.subject.lastName,
      phone: command.subject.type === "ADULT" ? command.subject.phone : null,
      status: "PROSPECTIVE",
      type: command.subject.type,
    },
    select: { id: true },
  });

  let guardianId: string | null = null;
  if (command.subject.type === "CHILD") {
    const guardian = await transaction.guardian.create({
      data: {
        email: command.subject.guardian.email,
        firstName: command.subject.guardian.firstName,
        lastName: command.subject.guardian.lastName,
        phone: command.subject.guardian.phone,
      },
      select: { id: true },
    });
    guardianId = guardian.id;
    await transaction.clientGuardian.create({
      data: {
        clientId: client.id,
        guardianId,
        isPrimary: true,
        relationship: command.subject.guardian.relationship,
      },
    });
  }

  const consentIds = documents.map(() => randomUUID());
  await transaction.consent.createMany({
    data: documents.map((document, index) => ({
      captureChannel: "PUBLIC_WEB",
      capturedAt: now,
      clientId: client.id,
      documentId: document.id,
      evidenceMetadata: {
        correlationId: command.correlationId,
        source: "PUBLIC_BOOKING_FLOW",
      },
      grantedByGuardianId: guardianId,
      id: consentIds[index],
      status: "GRANTED" as const,
    })),
  });

  await transaction.auditLog.createMany({
    data: [
      {
        action: "client.prospective_created",
        actorType: "CLIENT",
        afterSummary: { status: "PROSPECTIVE", type: command.subject.type },
        correlationId: command.correlationId,
        entityId: client.id,
        entityType: "CLIENT",
        reason: "PUBLIC_REQUEST_SUBMITTED",
      },
      ...(guardianId
        ? [
            {
              action: "guardian.declared",
              actorType: "CLIENT",
              afterSummary: { authorityVerified: false },
              correlationId: command.correlationId,
              entityId: guardianId,
              entityType: "GUARDIAN",
              reason: "PUBLIC_REQUEST_SUBMITTED",
            },
          ]
        : []),
      ...documents.map((document, index) => ({
        action: "consent.granted",
        actorType: "CLIENT",
        afterSummary: { documentId: document.id, status: "GRANTED" },
        correlationId: command.correlationId,
        entityId: consentIds[index],
        entityType: "CONSENT",
        reason: "PUBLIC_REQUEST_SUBMITTED",
      })),
    ],
  });

  return Object.freeze({ clientId: client.id, consentIds, guardianId });
}

export async function submitPublicBookingRequest(
  input: unknown,
  options: PublicBookingServiceOptions,
): Promise<CreatedAppointmentRequest> {
  const command = publicBookingSubmissionInputSchema.parse(input);
  const parsedOptions = publicBookingOptionsSchema.parse({
    publicPractitionerId: options.publicPractitionerId,
    requiredExplicitConsentDocumentTypes: [...(options.requiredExplicitConsentDocumentTypes ?? [])],
  });
  const now = z.date().parse(options.now ?? new Date());
  const referenceFactory = options.referenceFactory ?? createPublicAppointmentReference;
  const requiredDocumentTypes = getRequiredDocumentTypes(
    parsedOptions.requiredExplicitConsentDocumentTypes,
  );
  const database = getDatabase();

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await database.$transaction(
        async (transaction) => {
          await verifyHoldBeforeIdentityWrite(
            transaction,
            command,
            parsedOptions.publicPractitionerId,
            now,
          );
          const documents = await findCurrentPublicConsentDocuments(
            transaction,
            requiredDocumentTypes,
            now,
          );
          const identity = await createIdentityAndConsentEvidence(
            transaction,
            command,
            documents,
            now,
          );
          const duplicateCandidates = await findPotentialDuplicateClients(
            transaction,
            identity.clientId,
          );

          return createAppointmentRequest(
            {
              clientId: identity.clientId,
              consentIds: identity.consentIds,
              correlationId: command.correlationId,
              duplicateReviewStatus: getInitialDuplicateReviewStatus(duplicateCandidates.length),
              guardianId: identity.guardianId,
              holdId: command.holdId,
              holderToken: command.holderToken,
              requestNote: null,
            },
            {
              now,
              referenceFactory,
              requiredExplicitConsentDocumentTypes:
                parsedOptions.requiredExplicitConsentDocumentTypes,
              transaction,
            },
          );
        },
        { isolationLevel: "Serializable" },
      );
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
