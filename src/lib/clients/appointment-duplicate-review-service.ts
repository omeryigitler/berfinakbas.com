import { z } from "zod";

import { isRetryableTransactionError } from "@/lib/booking/appointment-hold-service";
import { findPotentialDuplicateClients } from "@/lib/clients/client-duplicate-review";
import { getDatabase } from "@/lib/db";

const MAX_TRANSACTION_ATTEMPTS = 3;

export const duplicateReviewRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("KEEP_SEPARATE") }).strict(),
  z
    .object({
      action: z.literal("LINK_EXISTING"),
      targetClientId: z.uuid(),
    })
    .strict(),
]);

const duplicateReviewCommandSchema = z.intersection(
  duplicateReviewRequestSchema,
  z.object({
    actorUserId: z.uuid(),
    appointmentId: z.uuid(),
    correlationId: z.string().trim().min(1).max(80),
  }),
);

export class DuplicateReviewNotFoundError extends Error {
  constructor() {
    super("İncelenecek randevu bulunamadı.");
    this.name = "DuplicateReviewNotFoundError";
  }
}

export class DuplicateReviewConflictError extends Error {
  constructor(message = "Mükerrer kayıt incelemesi değişti veya bu işleme uygun değil.") {
    super(message);
    this.name = "DuplicateReviewConflictError";
  }
}

export type ResolvedDuplicateReview = Readonly<{
  appointmentId: string;
  clientId: string;
  status: "KEPT_SEPARATE" | "LINKED_EXISTING";
  targetClientId: string | null;
}>;

export async function resolveAppointmentDuplicateReview(
  input: unknown,
  now = new Date(),
): Promise<ResolvedDuplicateReview> {
  const command = duplicateReviewCommandSchema.parse(input);
  const database = getDatabase();

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await database.$transaction(
        async (transaction) => {
          const appointment = await transaction.appointment.findUnique({
            select: {
              client: { select: { status: true } },
              clientId: true,
              duplicateReviewStatus: true,
              guardianId: true,
              id: true,
              source: true,
              status: true,
            },
            where: { id: command.appointmentId },
          });
          if (!appointment) throw new DuplicateReviewNotFoundError();
          if (
            appointment.source !== "WEB" ||
            appointment.status !== "PENDING_REVIEW" ||
            !["NOT_REQUIRED", "PENDING"].includes(appointment.duplicateReviewStatus)
          ) {
            throw new DuplicateReviewConflictError();
          }

          const candidates = await findPotentialDuplicateClients(transaction, appointment.clientId);
          if (candidates.length === 0 && appointment.duplicateReviewStatus !== "PENDING") {
            throw new DuplicateReviewConflictError("Bu talep için güncel bir eşleşme bulunmuyor.");
          }

          if (command.action === "KEEP_SEPARATE") {
            const updated = await transaction.appointment.updateMany({
              data: {
                duplicateReviewReason:
                  "Olası eşleşme yönetici tarafından ayrı kayıt olarak tutuldu.",
                duplicateReviewResolvedAt: now,
                duplicateReviewResolvedByUserId: command.actorUserId,
                duplicateReviewStatus: "KEPT_SEPARATE",
                duplicateReviewTargetClientId: null,
              },
              where: {
                duplicateReviewStatus: { in: ["NOT_REQUIRED", "PENDING"] },
                id: appointment.id,
                status: "PENDING_REVIEW",
              },
            });
            if (updated.count !== 1) throw new DuplicateReviewConflictError();

            await transaction.auditLog.create({
              data: {
                action: "appointment.duplicate_review_kept_separate",
                actorType: "USER",
                actorUserId: command.actorUserId,
                afterSummary: { duplicateReviewStatus: "KEPT_SEPARATE" },
                beforeSummary: {
                  candidateClientIds: candidates.map((candidate) => candidate.clientId),
                  duplicateReviewStatus: appointment.duplicateReviewStatus,
                },
                correlationId: command.correlationId,
                entityId: appointment.id,
                entityType: "APPOINTMENT",
                reason: "DUPLICATE_REVIEW_KEEP_SEPARATE",
              },
            });

            return Object.freeze({
              appointmentId: appointment.id,
              clientId: appointment.clientId,
              status: "KEPT_SEPARATE" as const,
              targetClientId: null,
            });
          }

          const candidate = candidates.find((item) => item.clientId === command.targetClientId);
          if (!candidate) {
            throw new DuplicateReviewConflictError(
              "Seçilen danışan artık doğrulanmış eşleşme adayı değil.",
            );
          }
          if (candidate.type === "CHILD" && !candidate.targetGuardianId) {
            throw new DuplicateReviewConflictError(
              "Çocuk danışan için eşleşen veli kaydı bulunamadı.",
            );
          }
          if (appointment.client.status !== "PROSPECTIVE") {
            throw new DuplicateReviewConflictError(
              "Kaynak danışan aktif kullanıldığı için otomatik bağlama yapılamadı.",
            );
          }

          const sourceAppointmentCount = await transaction.appointment.count({
            where: { clientId: appointment.clientId },
          });
          if (sourceAppointmentCount !== 1) {
            throw new DuplicateReviewConflictError(
              "Kaynak danışanın başka randevuları olduğu için otomatik bağlama yapılamadı.",
            );
          }

          const targetGuardianId = candidate.type === "CHILD" ? candidate.targetGuardianId : null;
          const updated = await transaction.appointment.updateMany({
            data: {
              clientId: candidate.clientId,
              duplicateReviewReason: "Talep doğrulanmış mevcut danışan kaydına bağlandı.",
              duplicateReviewResolvedAt: now,
              duplicateReviewResolvedByUserId: command.actorUserId,
              duplicateReviewStatus: "LINKED_EXISTING",
              duplicateReviewTargetClientId: candidate.clientId,
              guardianId: targetGuardianId,
            },
            where: {
              clientId: appointment.clientId,
              duplicateReviewStatus: { in: ["NOT_REQUIRED", "PENDING"] },
              id: appointment.id,
              status: "PENDING_REVIEW",
            },
          });
          if (updated.count !== 1) throw new DuplicateReviewConflictError();

          await transaction.consent.updateMany({
            data: {
              clientId: candidate.clientId,
              grantedByGuardianId: targetGuardianId,
            },
            where: {
              appointments: { some: { appointmentId: appointment.id } },
              clientId: appointment.clientId,
            },
          });
          await transaction.client.update({
            data: { status: "INACTIVE" },
            where: { id: appointment.clientId },
          });

          await transaction.auditLog.createMany({
            data: [
              {
                action: "appointment.duplicate_review_linked_existing",
                actorType: "USER",
                actorUserId: command.actorUserId,
                afterSummary: {
                  clientId: candidate.clientId,
                  duplicateReviewStatus: "LINKED_EXISTING",
                },
                beforeSummary: {
                  clientId: appointment.clientId,
                  duplicateReviewStatus: appointment.duplicateReviewStatus,
                  matchReasons: candidate.matchReasons,
                },
                correlationId: command.correlationId,
                entityId: appointment.id,
                entityType: "APPOINTMENT",
                reason: "DUPLICATE_REVIEW_LINK_EXISTING",
              },
              {
                action: "client.duplicate_source_archived",
                actorType: "USER",
                actorUserId: command.actorUserId,
                afterSummary: {
                  linkedAppointmentId: appointment.id,
                  status: "INACTIVE",
                  targetClientId: candidate.clientId,
                },
                beforeSummary: { status: "PROSPECTIVE" },
                correlationId: command.correlationId,
                entityId: appointment.clientId,
                entityType: "CLIENT",
                reason: "DUPLICATE_REVIEW_LINK_EXISTING",
              },
            ],
          });

          return Object.freeze({
            appointmentId: appointment.id,
            clientId: candidate.clientId,
            status: "LINKED_EXISTING" as const,
            targetClientId: candidate.clientId,
          });
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (isRetryableTransactionError(error)) {
        if (attempt < MAX_TRANSACTION_ATTEMPTS) continue;
        throw new DuplicateReviewConflictError();
      }
      throw error;
    }
  }

  throw new DuplicateReviewConflictError();
}
