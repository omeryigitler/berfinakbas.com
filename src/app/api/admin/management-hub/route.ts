import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getServerEnvironment } from '@/lib/env';
import { getSafeCorrelationId, hasTrustedOrigin } from '@/lib/request-security';
import { actionSchema, moduleSchema } from '@/lib/admin/management-hub-schema';
import { forbidden } from '@/lib/admin/management-hub-common';
import { readManagementModule } from '@/lib/admin/management-hub-read';
import { writeManagementAction } from '@/lib/admin/management-hub-write';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== 'ACTIVE') return forbidden();
  const parsed = moduleSchema.safeParse(new URL(request.url).searchParams.get('module'));
  if (!parsed.success) return NextResponse.json({ error: 'Yönetim modülü geçersiz.' }, { status: 400 });
  return readManagementModule(session, parsed.data);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== 'ACTIVE') return forbidden();
  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get('origin'), environment.APP_URL)) return NextResponse.json({ error: 'Güvenilmeyen istek kaynağı.' }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'İstek gövdesi geçerli JSON olmalıdır.' }, { status: 400 }); }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Yönetim işlemi geçersiz.', issues: parsed.error.flatten() }, { status: 400 });
  return writeManagementAction(session, parsed.data, getSafeCorrelationId(request.headers.get('x-correlation-id')));
}
