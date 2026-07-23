import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { can, forbidden, resolvePractitioner, type ActiveSession } from './management-hub-common';
import type { ManagementAction } from './management-hub-schema';

export async function writeAvailabilityAction(
  session: ActiveSession,
  action: ManagementAction,
  correlationId: string,
) {
  const database = getDatabase();

  if (action.action === 'SAVE_AVAILABILITY_RULES') {
    if (!can(session, 'availability:manage')) return forbidden();
    const practitioner = await resolvePractitioner(session);
    if (!practitioner) return NextResponse.json({ error: 'Aktif terapist kaydı bulunamadı.' }, { status: 404 });
    for (const rule of action.rules) {
      if (rule.start >= rule.end) return NextResponse.json({ error: 'Çalışma saati başlangıcı bitişten önce olmalıdır.' }, { status: 400 });
    }
    await database.$transaction(async (transaction) => {
      await transaction.availabilityRule.deleteMany({ where: { practitionerId: practitioner.id } });
      if (action.rules.length > 0) {
        await transaction.availabilityRule.createMany({ data: action.rules.map((rule) => ({
          localEndTime: rule.end,
          localStartTime: rule.start,
          practitionerId: practitioner.id,
          slotIncrementMinutes: rule.slotIncrementMinutes,
          status: rule.active ? 'ACTIVE' : 'INACTIVE',
          weekday: rule.weekday,
        })) });
      }
      await transaction.auditLog.create({ data: {
        action: 'availability.rules.updated', actorType: 'USER', actorUserId: session.user.id,
        afterSummary: { count: action.rules.length }, correlationId, entityId: practitioner.id,
        entityType: 'PRACTITIONER', reason: 'MANAGEMENT_HUB_UPDATE',
      } });
    });
    return NextResponse.json({ data: { saved: true } });
  }

  if (action.action === 'CREATE_AVAILABILITY_EXCEPTION') {
    if (!can(session, 'availability:manage')) return forbidden();
    const practitioner = await resolvePractitioner(session);
    if (!practitioner) return NextResponse.json({ error: 'Aktif terapist kaydı bulunamadı.' }, { status: 404 });
    if (action.type !== 'CLOSED' && (!action.start || !action.end || action.start >= action.end)) {
      return NextResponse.json({ error: 'Özel veya bloklu zaman için geçerli başlangıç ve bitiş saati gerekir.' }, { status: 400 });
    }
    const created = await database.$transaction(async (transaction) => {
      const exception = await transaction.availabilityException.create({ data: {
        localDate: new Date(`${action.date}T00:00:00.000Z`),
        localEndTime: action.end ?? null,
        localStartTime: action.start ?? null,
        practitionerId: practitioner.id,
        privateNote: action.privateNote ?? null,
        reasonCode: action.reasonCode,
        status: 'ACTIVE',
        type: action.type,
      } });
      await transaction.auditLog.create({ data: {
        action: 'availability.exception.created', actorType: 'USER', actorUserId: session.user.id,
        afterSummary: { date: action.date, type: action.type }, correlationId,
        entityId: exception.id, entityType: 'AVAILABILITY_EXCEPTION', reason: action.reasonCode,
      } });
      return exception;
    });
    return NextResponse.json({ data: created }, { status: 201 });
  }

  if (action.action === 'SET_AVAILABILITY_EXCEPTION_STATUS') {
    if (!can(session, 'availability:manage')) return forbidden();
    const practitioner = await resolvePractitioner(session);
    if (!practitioner) return forbidden();
    const updated = await database.$transaction(async (transaction) => {
      const result = await transaction.availabilityException.updateMany({ data: { status: action.status }, where: { id: action.id, practitionerId: practitioner.id } });
      if (result.count > 0) await transaction.auditLog.create({ data: {
        action: 'availability.exception.status.updated', actorType: 'USER', actorUserId: session.user.id,
        afterSummary: { status: action.status }, correlationId, entityId: action.id,
        entityType: 'AVAILABILITY_EXCEPTION', reason: 'MANAGEMENT_HUB_UPDATE',
      } });
      return result;
    });
    if (updated.count === 0) return NextResponse.json({ error: 'Uygunluk kaydı bulunamadı.' }, { status: 404 });
    return NextResponse.json({ data: { updated: true } });
  }

  return null;
}
