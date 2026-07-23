import { NextResponse } from 'next/server';

import { can, forbidden, type ActiveSession } from './management-hub-common';
import { cleanDemoData, seedDemoData } from './management-hub-demo-data';
import type { ManagementAction } from './management-hub-schema';

export async function writeDemoAction(session: ActiveSession, action: ManagementAction, correlationId: string) {
  if (action.action !== 'SEED_DEMO_DATA' && action.action !== 'CLEAN_DEMO_DATA') return null;
  if (!can(session, 'users:manage')) return forbidden();
  try {
    const state = action.action === 'SEED_DEMO_DATA'
      ? await seedDemoData(session, correlationId)
      : await cleanDemoData(session, correlationId);
    return NextResponse.json({ data: state });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Örnek veri işlemi tamamlanamadı.' },
      { status: 409 },
    );
  }
}
