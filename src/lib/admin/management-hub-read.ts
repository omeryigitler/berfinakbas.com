import { NextResponse } from 'next/server';
import type { ManagementModule } from './management-hub-schema';
import type { ActiveSession } from './management-hub-common';
import { readOperationModule } from './management-hub-read-operations';
import { readSystemModule } from './management-hub-read-system';

export async function readManagementModule(session: ActiveSession, module: ManagementModule) {
  const operation = await readOperationModule(session, module);
  if (operation) return operation;
  const system = await readSystemModule(session, module);
  if (system) return system;
  return NextResponse.json({ error: 'Modül desteklenmiyor.' }, { status: 400 });
}
