import { z } from "zod";

import {
  availabilityExceptionSchema,
  availabilityRuleSchema,
} from "@/domain/booking/availability-rule";
import type { Prisma } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";

const mutationContextSchema = z.object({
  actorUserId: z.uuid(),
  correlationId: z.string().trim().min(1).max(80),
});

export const availabilityRuleMutationRequestSchema = z.object({
  reason: z.string().trim().min(8).max(500),
  rule: availabilityRuleSchema,
});

export const availabilityExceptionMutationRequestSchema = z.object({
  exception: availabilityExceptionSchema,
  reason: z.string().trim().min(8).max(500),
});

export const createAvailabilityRuleSchema = availabilityRuleMutationRequestSchema.extend(
  mutationContextSchema.shape,
);

export const createAvailabilityExceptionSchema = availabilityExceptionMutationRequestSchema.extend(
  mutationContextSchema.shape,
);

export class AvailabilityPractitionerUnavailableError extends Error {
  readonly code = "AVAILABILITY_PRACTITIONER_UNAVAILABLE";

  constructor() {
    super("Uzman çalışma takvimi değişikliği için uygun değil.");
    this.name = "AvailabilityPractitionerUnavailableError";
  }
}

function localDateToDatabaseDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function assertActivePractitioner(
  transaction: Prisma.TransactionClient,
  practitionerId: string,
): Promise<void> {
  const practitioner = await transaction.practitioner.findUnique({
    select: { status: true },
    where: { id: practitionerId },
  });
  if (practitioner?.status !== "ACTIVE") {
    throw new AvailabilityPractitionerUnavailableError();
  }
}

export function createAvailabilityExceptionAuditSummary(
  input: z.infer<typeof availabilityExceptionSchema>,
) {
  return {
    localDate: input.localDate,
    localEndTime: input.localEndTime,
    localStartTime: input.localStartTime,
    practitionerId: input.practitionerId,
    reasonCode: input.reasonCode,
    status: input.status,
    type: input.type,
  };
}

export async function createAvailabilityRule(input: unknown) {
  const command = createAvailabilityRuleSchema.parse(input);
  const database = getDatabase();

  return database.$transaction(async (transaction) => {
    await assertActivePractitioner(transaction, command.rule.practitionerId);

    const rule = await transaction.availabilityRule.create({
      data: {
        localEndTime: command.rule.localEndTime,
        localStartTime: command.rule.localStartTime,
        practitionerId: command.rule.practitionerId,
        slotIncrementMinutes: command.rule.slotIncrementMinutes,
        status: command.rule.status,
        validFrom: localDateToDatabaseDate(command.rule.validFrom),
        validUntil: localDateToDatabaseDate(command.rule.validUntil),
        weekday: command.rule.weekday,
      },
    });
    const summary = {
      localEndTime: command.rule.localEndTime,
      localStartTime: command.rule.localStartTime,
      practitionerId: command.rule.practitionerId,
      slotIncrementMinutes: command.rule.slotIncrementMinutes,
      status: command.rule.status,
      validFrom: command.rule.validFrom,
      validUntil: command.rule.validUntil,
      weekday: command.rule.weekday,
    };

    await transaction.settingChangeLog.create({
      data: {
        actorUserId: command.actorUserId,
        entityId: rule.id,
        entityType: "AVAILABILITY_RULE",
        newValue: summary,
        reason: command.reason,
        settingKey: "availability.rule.created",
      },
    });
    await transaction.auditLog.create({
      data: {
        action: "availability_rule.created",
        actorType: "USER",
        actorUserId: command.actorUserId,
        afterSummary: summary,
        correlationId: command.correlationId,
        entityId: rule.id,
        entityType: "AVAILABILITY_RULE",
        reason: command.reason,
      },
    });

    return rule;
  });
}

export async function createAvailabilityException(input: unknown) {
  const command = createAvailabilityExceptionSchema.parse(input);
  const database = getDatabase();

  return database.$transaction(async (transaction) => {
    await assertActivePractitioner(transaction, command.exception.practitionerId);

    const exception = await transaction.availabilityException.create({
      data: {
        localDate: localDateToDatabaseDate(command.exception.localDate)!,
        localEndTime: command.exception.localEndTime,
        localStartTime: command.exception.localStartTime,
        practitionerId: command.exception.practitionerId,
        privateNote: command.exception.privateNote,
        reasonCode: command.exception.reasonCode,
        status: command.exception.status,
        type: command.exception.type,
      },
    });
    const summary = createAvailabilityExceptionAuditSummary(command.exception);

    await transaction.settingChangeLog.create({
      data: {
        actorUserId: command.actorUserId,
        entityId: exception.id,
        entityType: "AVAILABILITY_EXCEPTION",
        newValue: summary,
        reason: command.reason,
        settingKey: "availability.exception.created",
      },
    });
    await transaction.auditLog.create({
      data: {
        action: "availability_exception.created",
        actorType: "USER",
        actorUserId: command.actorUserId,
        afterSummary: summary,
        correlationId: command.correlationId,
        entityId: exception.id,
        entityType: "AVAILABILITY_EXCEPTION",
        reason: command.reason,
      },
    });

    return exception;
  });
}
