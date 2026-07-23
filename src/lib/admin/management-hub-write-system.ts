import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { can, forbidden, saveSetting, type ActiveSession } from './management-hub-common';
import type { ManagementAction } from './management-hub-schema';

export async function writeSystemAction(session: ActiveSession, action: ManagementAction, correlationId: string) {
  const database = getDatabase();

  if (action.action === 'SAVE_SETTING') {
    if (!can(session, 'services:manage')) return forbidden();
    return NextResponse.json({ data: await saveSetting(session, action.key, action.value, action.reason) });
  }
  if (action.action === 'SAVE_PDF_RESOURCES') {
    if (!can(session, 'services:manage')) return forbidden();
    const saved = await saveSetting(session, 'PDF_RESOURCE_LIBRARY', action.resources, 'PDF ve kaynak metadata kayıtları yönetim panelinden güncellendi.');
    return NextResponse.json({ data: saved });
  }
  if (action.action === 'UPDATE_SERVICE_STATUS') {
    if (!can(session, 'services:manage')) return forbidden();
    const updated = await database.service.update({
      data: { status: action.status, ...(action.status === 'INACTIVE' ? { publicVisible: false } : {}) },
      select: { id: true, name: true, status: true },
      where: { id: action.serviceId },
    });
    await database.auditLog.create({ data: {
      action: 'service.status.updated', actorType: 'USER', actorUserId: session.user.id,
      afterSummary: { name: updated.name, status: updated.status }, correlationId,
      entityId: updated.id, entityType: 'SERVICE', reason: 'MANAGEMENT_HUB_UPDATE',
    } });
    return NextResponse.json({ data: updated });
  }
  if (action.action === 'UPDATE_USER_STATUS') {
    if (!can(session, 'users:manage')) return forbidden();
    if (action.userId === session.user.id && action.status === 'SUSPENDED') return NextResponse.json({ error: 'Kendi yönetici hesabınızı askıya alamazsınız.' }, { status: 400 });
    const updated = await database.user.update({ data: { status: action.status }, select: { id: true, status: true }, where: { id: action.userId } });
    await database.auditLog.create({ data: {
      action: 'user.status.updated', actorType: 'USER', actorUserId: session.user.id,
      afterSummary: { status: updated.status }, correlationId, entityId: updated.id,
      entityType: 'USER', reason: 'MANAGEMENT_HUB_UPDATE',
    } });
    return NextResponse.json({ data: updated });
  }
  if (action.action === 'RESTORE_CLIENT') {
    if (!can(session, 'clients:manage')) return forbidden();
    const updated = await database.$transaction(async (transaction) => {
      const client = await transaction.client.update({ data: { status: 'ACTIVE' }, select: { id: true, status: true }, where: { id: action.clientId } });
      await transaction.auditLog.create({ data: {
        action: 'client.restored', actorType: 'USER', actorUserId: session.user.id,
        afterSummary: { status: client.status }, correlationId, entityId: client.id,
        entityType: 'CLIENT', reason: 'MANAGEMENT_HUB_RESTORE',
      } });
      return client;
    });
    return NextResponse.json({ data: updated });
  }
  if (action.action === 'RESTORE_SERVICE') {
    if (!can(session, 'services:manage')) return forbidden();
    const updated = await database.$transaction(async (transaction) => {
      const service = await transaction.service.update({ data: { status: 'ACTIVE' }, select: { id: true, status: true }, where: { id: action.serviceId } });
      await transaction.auditLog.create({ data: {
        action: 'service.restored', actorType: 'USER', actorUserId: session.user.id,
        afterSummary: { status: service.status }, correlationId, entityId: service.id,
        entityType: 'SERVICE', reason: 'MANAGEMENT_HUB_RESTORE',
      } });
      return service;
    });
    return NextResponse.json({ data: updated });
  }
  return null;
}
