import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma/client';
import type { Permission } from '@/domain/auth/permissions';
import { hasPermission } from '@/domain/auth/permissions';
import { getDatabase } from '@/lib/db';
import type { auth } from '@/auth';
import { settingKeys } from './management-hub-schema';

export type ActiveSession = NonNullable<Awaited<ReturnType<typeof auth>>>;

export function forbidden() {
  return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
}

export function can(session: ActiveSession, permission: Permission) {
  return hasPermission(session.user.roles, permission);
}

export function serializeJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function readSettings(keys: readonly string[]) {
  const rows = await getDatabase().operationalSetting.findMany({
    select: { key: true, updatedAt: true, value: true },
    where: { key: { in: [...keys] } },
  });
  return Object.fromEntries(rows.map((row) => [row.key, { value: row.value, updatedAt: row.updatedAt.toISOString() }]));
}

export async function resolvePractitioner(session: ActiveSession) {
  const isSuperAdmin = session.user.roles.includes('SUPER_ADMIN');
  return getDatabase().practitioner.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { displayName: true, id: true, timeZone: true, userId: true },
    where: { status: 'ACTIVE', ...(isSuperAdmin ? {} : { userId: session.user.id }) },
  });
}

export async function saveSetting(
  session: ActiveSession,
  key: (typeof settingKeys)[number],
  value: unknown,
  reason: string,
) {
  const database = getDatabase();
  return database.$transaction(async (transaction) => {
    const previous = await transaction.operationalSetting.findUnique({ select: { value: true }, where: { key } });
    const saved = await transaction.operationalSetting.upsert({
      create: { key, updatedByUserId: session.user.id, value: serializeJson(value) },
      update: { updatedByUserId: session.user.id, value: serializeJson(value) },
      select: { key: true, updatedAt: true, value: true },
      where: { key },
    });
    await transaction.settingChangeLog.create({
      data: {
        actorUserId: session.user.id,
        entityId: key,
        entityType: 'OPERATIONAL_SETTING',
        newValue: serializeJson(value),
        oldValue: previous?.value ? serializeJson(previous.value) : undefined,
        reason,
        settingKey: key,
      },
    });
    return { ...saved, updatedAt: saved.updatedAt.toISOString() };
  });
}

export function appointmentSelect() {
  return {
    client: { select: { firstName: true, id: true, lastName: true, type: true } },
    durationMinutesSnapshot: true,
    endsAt: true,
    id: true,
    locationTypeSnapshot: true,
    practitioner: { select: { displayName: true } },
    publicReference: true,
    requestNote: true,
    serviceNameSnapshot: true,
    source: true,
    startsAt: true,
    status: true,
  } as const;
}
