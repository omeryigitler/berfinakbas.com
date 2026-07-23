import { NextResponse } from 'next/server';

import { getAppointmentAccessWhere } from '@/lib/booking/appointment-api-access';
import { getDatabase } from '@/lib/db';
import { resolveZonedDateTime } from '@/lib/time-zone';

import { appointmentSelect, can, forbidden, resolvePractitioner, type ActiveSession } from './management-hub-common';
import { readDemoDataState } from './management-hub-demo-data';

function dateKey(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { day: '2-digit', month: '2-digit', timeZone, year: 'numeric' }).format(new Date());
}

function dayBounds(timeZone: string) {
  const current = dateKey(timeZone);
  const start = resolveZonedDateTime({ date: current, time: '00:00', timeZone });
  const tomorrowDate = new Date(`${current}T12:00:00Z`);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const end = resolveZonedDateTime({ date: tomorrow, time: '00:00', timeZone });
  if (!start.ok || !end.ok) {
    const fallback = new Date();
    fallback.setUTCHours(0, 0, 0, 0);
    return { start: fallback, end: new Date(fallback.getTime() + 86_400_000) };
  }
  return { start: start.date, end: end.date };
}

function sumBigInts(values: Array<bigint | null | undefined>) {
  return values.reduce<bigint>((total, value) => total + (value ?? 0n), 0n);
}

export async function readDashboardModule(session: ActiveSession, module: string) {
  if (module !== 'ana-panel' && module !== 'danisanlar') return null;
  if (!can(session, 'clients:read')) return forbidden();

  const database = getDatabase();
  const practitioner = await resolvePractitioner(session);
  const timeZone = practitioner?.timeZone ?? 'Europe/Malta';
  const accessWhere = can(session, 'appointments:read')
    ? getAppointmentAccessWhere({ mode: 'read', roles: session.user.roles, userId: session.user.id })
    : null;
  const bounds = dayBounds(timeZone);

  const [clientsRaw, appointments, pendingAppointments, activePlans, demoState] = await Promise.all([
    database.client.findMany({
      orderBy: [{ status: 'asc' }, { firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        appointments: {
          orderBy: { startsAt: 'desc' },
          select: { id: true, serviceNameSnapshot: true, startsAt: true, status: true },
          take: 10,
        },
        birthYear: true,
        createdAt: true,
        email: true,
        financeEntries: { select: { amountMinor: true, currency: true } },
        firstName: true,
        guardians: {
          orderBy: { isPrimary: 'desc' },
          select: {
            guardianId: true,
            isPrimary: true,
            relationship: true,
            guardian: { select: { email: true, firstName: true, lastName: true, phone: true } },
          },
        },
        id: true,
        lastName: true,
        phone: true,
        plans: {
          orderBy: { createdAt: 'desc' },
          select: {
            currency: true,
            id: true,
            name: true,
            sessionCreditEntries: { select: { quantityDelta: true } },
            status: true,
          },
          take: 10,
        },
        preferredName: true,
        status: true,
        type: true,
        updatedAt: true,
      },
      take: 500,
    }),
    accessWhere
      ? database.appointment.findMany({
          orderBy: { startsAt: 'asc' },
          select: appointmentSelect(),
          where: { ...accessWhere, startsAt: { gte: bounds.start, lt: bounds.end } },
        })
      : [],
    accessWhere
      ? database.appointment.count({
          where: { ...accessWhere, status: { in: ['REQUESTED', 'PENDING_REVIEW', 'RESCHEDULE_PROPOSED'] } },
        })
      : 0,
    can(session, 'finance:read') ? database.clientPlan.count({ where: { status: 'ACTIVE' } }) : 0,
    readDemoDataState(),
  ]);

  const clients = clientsRaw.map((client) => {
    const activePlan = client.plans.find((plan) => plan.status === 'ACTIVE') ?? null;
    const remainingSessions = activePlan
      ? activePlan.sessionCreditEntries.reduce((total, entry) => total + entry.quantityDelta, 0)
      : 0;
    const balances = new Map<string, bigint>();
    for (const entry of client.financeEntries) {
      balances.set(entry.currency, (balances.get(entry.currency) ?? 0n) + entry.amountMinor);
    }
    return {
      ...client,
      activePlan: activePlan ? { currency: activePlan.currency, id: activePlan.id, name: activePlan.name } : null,
      balanceByCurrency: [...balances.entries()].map(([currency, amountMinor]) => ({ currency, amountMinor: amountMinor.toString() })),
      createdAt: client.createdAt.toISOString(),
      financeEntries: undefined,
      plans: undefined,
      remainingSessions,
      updatedAt: client.updatedAt.toISOString(),
    };
  });

  const financeByCurrency = new Map<string, bigint>();
  for (const client of clientsRaw) {
    for (const entry of client.financeEntries) {
      financeByCurrency.set(entry.currency, (financeByCurrency.get(entry.currency) ?? 0n) + entry.amountMinor);
    }
  }

  const planRows = clientsRaw
    .flatMap((client) => client.plans
      .filter((plan) => plan.status === 'ACTIVE')
      .map((plan) => ({
        balanceMinor: sumBigInts(client.financeEntries.filter((entry) => entry.currency === plan.currency).map((entry) => entry.amountMinor)).toString(),
        client: { firstName: client.firstName, id: client.id, lastName: client.lastName },
        currency: plan.currency,
        id: plan.id,
        name: plan.name,
        remainingSessions: plan.sessionCreditEntries.reduce((total, entry) => total + entry.quantityDelta, 0),
      })))
    .slice(0, 50);

  return NextResponse.json({
    data: {
      appointments,
      clients,
      demoState,
      finance: [...financeByCurrency.entries()].map(([currency, amountMinor]) => ({ currency, amountMinor: amountMinor.toString() })),
      plans: planRows,
      summary: {
        activeClients: clients.filter((client) => client.status === 'ACTIVE').length,
        activePlans,
        pendingAppointments,
        prospectiveClients: clients.filter((client) => client.status === 'PROSPECTIVE').length,
        todayAppointments: appointments.length,
      },
      timeZone,
    },
  });
}
