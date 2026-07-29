import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";
import {
  PROFILE_PREFIX,
  type RouteContext,
  asJsonRecord,
  booleanOrDefault,
  forbidden,
  notFound,
  requireClientAccess,
  splitFullName,
  textOrNull,
  updateClientSchema,
} from "@/lib/clients/client-dashboard-shared";

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireClientAccess("clients:manage");
  if (!session) return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json(
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", error: "İstek gövdesi geçerli JSON olmalıdır." },
      { status: 400 },
    );
  }

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "Güncellenecek danışan alanlarını kontrol edin." },
      { status: 400 },
    );
  }

  const { clientId } = await context.params;
  const database = getDatabase();
  const existing = await database.client.findUnique({
    select: {
      birthYear: true,
      email: true,
      firstName: true,
      guardians: {
        orderBy: { isPrimary: "desc" },
        select: {
          guardian: {
            select: {
              email: true,
              firstName: true,
              id: true,
              lastName: true,
              phone: true,
            },
          },
          isPrimary: true,
          relationship: true,
        },
        take: 1,
      },
      id: true,
      lastName: true,
      phone: true,
      preferredName: true,
      status: true,
      type: true,
    },
    where: { id: clientId },
  });
  if (!existing) return notFound();

  const currentProfileSetting = await database.operationalSetting.findUnique({
    select: { value: true },
    where: { key: `${PROFILE_PREFIX}${clientId}` },
  });
  const currentProfile = asJsonRecord(currentProfileSetting?.value);
  const input = parsed.data;
  const wasArchived = booleanOrDefault(currentProfile.archived, false);
  const isArchived = input.archived ?? wasArchived;

  const clientData = {
    ...(input.birthYear !== undefined ? { birthYear: input.birthYear } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.preferredName !== undefined ? { preferredName: input.preferredName } : {}),
    ...(input.archived === true
      ? { status: "INACTIVE" as const }
      : input.status !== undefined
        ? { status: input.status }
        : {}),
  };

  const hasClientData = Object.keys(clientData).length > 0;
  const nextProfile = {
    ...currentProfile,
    archived: isArchived,
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.contactConsent !== undefined
      ? { contactConsent: input.contactConsent }
      : {}),
    ...(input.country !== undefined ? { country: input.country } : {}),
    ...(input.district !== undefined ? { district: input.district } : {}),
    ...(input.emergencyContact !== undefined
      ? { emergencyContact: input.emergencyContact }
      : {}),
    ...(input.preferredContactMethod !== undefined
      ? { preferredContactMethod: input.preferredContactMethod }
      : {}),
    ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp } : {}),
  };

  const guardianInputProvided =
    input.parentPrimaryName !== undefined ||
    input.parentPrimaryPhone !== undefined ||
    input.parentPrimaryEmail !== undefined ||
    input.parentPrimaryRelation !== undefined;
  const primaryGuardian = existing.guardians[0] ?? null;

  if (guardianInputProvided && existing.type === "CHILD" && !primaryGuardian) {
    return NextResponse.json(
      {
        code: "PRIMARY_GUARDIAN_NOT_FOUND",
        error: "Çocuk danışan için güncellenecek birincil veli kaydı bulunamadı.",
      },
      { status: 422 },
    );
  }

  const updated = await database.$transaction(async (transaction) => {
    const clientSelect = {
      birthYear: true,
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      phone: true,
      preferredName: true,
      status: true,
      type: true,
      updatedAt: true,
    } as const;
    const record = hasClientData
      ? await transaction.client.update({
          data: clientData,
          select: clientSelect,
          where: { id: clientId },
        })
      : await transaction.client.findUniqueOrThrow({
          select: clientSelect,
          where: { id: clientId },
        });

    await transaction.operationalSetting.upsert({
      create: {
        key: `${PROFILE_PREFIX}${clientId}`,
        updatedByUserId: session.user.id,
        value: nextProfile,
      },
      update: {
        updatedByUserId: session.user.id,
        value: nextProfile,
      },
      where: { key: `${PROFILE_PREFIX}${clientId}` },
    });

    if (guardianInputProvided && primaryGuardian) {
      const guardianName =
        input.parentPrimaryName !== undefined
          ? splitFullName(input.parentPrimaryName || "Veli")
          : {
              firstName: primaryGuardian.guardian.firstName,
              lastName: primaryGuardian.guardian.lastName,
            };
      await transaction.guardian.update({
        data: {
          ...(input.parentPrimaryEmail !== undefined
            ? { email: input.parentPrimaryEmail }
            : {}),
          firstName: guardianName.firstName,
          lastName: guardianName.lastName,
          ...(input.parentPrimaryPhone !== undefined
            ? { phone: input.parentPrimaryPhone || primaryGuardian.guardian.phone }
            : {}),
        },
        where: { id: primaryGuardian.guardian.id },
      });
      if (input.parentPrimaryRelation !== undefined) {
        await transaction.clientGuardian.update({
          data: { relationship: input.parentPrimaryRelation || "Veli" },
          where: {
            clientId_guardianId: {
              clientId,
              guardianId: primaryGuardian.guardian.id,
            },
          },
        });
      }
    }

    const action = input.archived === true
      ? "client.archived"
      : input.archived === false && wasArchived
        ? "client.restored"
        : "client.updated";
    await transaction.auditLog.create({
      data: {
        action,
        actorType: "USER",
        actorUserId: session.user.id,
        afterSummary: {
          client: { ...record, updatedAt: record.updatedAt.toISOString() },
          profile: nextProfile,
        },
        beforeSummary: {
          client: {
            birthYear: existing.birthYear,
            email: existing.email,
            firstName: existing.firstName,
            id: existing.id,
            lastName: existing.lastName,
            phone: existing.phone,
            preferredName: existing.preferredName,
            status: existing.status,
            type: existing.type,
          },
          profile: currentProfile,
        },
        correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
        entityId: clientId,
        entityType: "CLIENT",
        reason: action.toUpperCase().replaceAll(".", "_"),
      },
    });

    return record;
  });

  return NextResponse.json({
    data: {
      ...updated,
      address: textOrNull(nextProfile.address),
      archived: isArchived,
      city: textOrNull(nextProfile.city),
      contactConsent: booleanOrDefault(nextProfile.contactConsent, false),
      country: textOrNull(nextProfile.country),
      district: textOrNull(nextProfile.district),
      emergencyContact: textOrNull(nextProfile.emergencyContact),
      preferredContactMethod: textOrNull(nextProfile.preferredContactMethod),
      status: isArchived ? "ARCHIVED" : updated.status,
      whatsapp: textOrNull(nextProfile.whatsapp) ?? updated.phone,
    },
  });
}
