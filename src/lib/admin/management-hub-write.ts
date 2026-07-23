import { NextResponse } from 'next/server';
import type { ActiveSession } from './management-hub-common';
import type { ManagementAction } from './management-hub-schema';
import { writeAvailabilityAction } from './management-hub-write-availability';
import { writeDemoAction } from './management-hub-write-demo';
import { writeSystemAction } from './management-hub-write-system';

export async function writeManagementAction(session: ActiveSession, action: ManagementAction, correlationId: string) {
  const demo = await writeDemoAction(session, action, correlationId);
  if (demo) return demo;
  const availability = await writeAvailabilityAction(session, action, correlationId);
  if (availability) return availability;
  const system = await writeSystemAction(session, action, correlationId);
  if (system) return system;
  return NextResponse.json({ error: 'İşlem desteklenmiyor.' }, { status: 400 });
}
