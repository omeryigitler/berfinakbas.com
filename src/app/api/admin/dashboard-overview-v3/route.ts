import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { calculateLedgerBalance } from "@/domain/finance/finance-operations";
import { getAppointmentAccessWhere } from "@/lib/booking/appointment-api-access";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { formatDateTimeInputInZone, getZonedDayRange, getZonedWeekRange } from "@/lib/time-zone";

const UPCOMING = new Set(["REQUESTED", "PENDING_REVIEW", "CONFIRMED", "RESCHEDULE_PROPOSED"]);
const CANCELLED = new Set(["CANCELLED_BY_CLIENT", "CANCELLED_BY_PRACTITIONER"]);

function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

function statusToTr(status: string) {
  if (status === "COMPLETED") return "Tamamlandı";
  if (status === "NO_SHOW") return "Gelmedi";
  if (CANCELLED.has(status)) return "İptal";
  if (status === "REJECTED") return "Reddedildi";
  return "Sıradaki";
}

function locationToTr(location: string) {
  if (location === "ONLINE") return "Online";
  if (location === "HYBRID") return "Hibrit";
  return "Yüz Yüze";
}

function relativeTime(date: Date, now: Date) {
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

function describeAudit(action: string, actor?: string | null) {
  const who = actor ? `${actor}, ` : "";
  if (action.startsWith("appointment")) return { desc: `${who}bir randevu işlemi gerçekleştirdi.`, type: "Randevu" };
  if (action.startsWith("payment") || action.startsWith("finance")) return { desc: `${who}bir ödeme işlemi gerçekleştirdi.`, type: "Finans" };
  if (action.startsWith("client")) return { desc: `${who}bir danışan kaydını güncelledi.`, type: "Danışan" };
  return { desc: `${who}bir yönetim işlemi gerçekleştirdi.`, type: "İşlem" };
}

type FinanceTotals = {
  currency: string;
  dueTodayOutstandingMinor: bigint;
  expectedTotalMinor: bigint;
  overdueOutstandingMinor: bigint;
  todayCollectedMinor: bigint;
};

function totalsFor(map: Map<string, FinanceTotals>, currency: string) {
  const key = currency || "TRY";
  const existing = map.get(key);
  if (existing) return existing;
  const created: FinanceTotals = {
    currency: key,
    dueTodayOutstandingMinor: 0n,
    expectedTotalMinor: 0n,
    overdueOutstandingMinor: 0n,
    todayCollectedMinor: 0n,
  };
  map.set(key, created);
  return created;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const appointmentAccessWhere = getAppointmentAccessWhere({
    mode: "read",
    roles: session.user.roles,
    userId: session.user.id,
  });
  const access = {
    appointments: appointmentAccessWhere !== null,
    clients: hasPermission(session.user.roles, "clients:read"),
    finance: hasPermission(session.user.roles, "finance:read"),
    audit: hasPermission(session.user.roles, "audit:read"),
  };
  const environment = getServerEnvironment();
  const timeZone = environment.BUSINESS_TIME_ZONE;
  const now = new Date();
  const day = getZonedDayRange(now, timeZone);
  const week = getZonedWeekRange(now, timeZone);
  const database = getDatabase();

  const todayAppointmentsRaw = appointmentAccessWhere !== null
    ? await database.appointment.findMany({
        orderBy: { startsAt: "asc" },
        select: {
          clientId: true,
          client: { select: { firstName: true, lastName: true } },
          durationMinutesSnapshot: true,
          id: true,
          locationTypeSnapshot: true,
          serviceNameSnapshot: true,
          startsAt: true,
          status: true,
        },
        where: {
          ...appointmentAccessWhere,
          startsAt: { gte: day.start, lt: day.end },
        },
      })
    : [];

  const clientCounts = access.clients
    ? await database.client.groupBy({ _count: { _all: true }, by: ["status"] })
    : [];
  const newThisWeek = access.clients
    ? await database.client.count({
        where: { createdAt: { gte: week.start, lt: week.end }, status: { not: "INACTIVE" } },
      })
    : 0;
  const prospectiveClients = access.clients
    ? await database.client.findMany({
        orderBy: { createdAt: "desc" },
        select: { firstName: true, lastName: true },
        take: 10,
        where: { status: "PROSPECTIVE" },
      })
    : [];
  const incompleteClients = access.clients
    ? await database.client.findMany({
        orderBy: { updatedAt: "desc" },
        select: { email: true, firstName: true, lastName: true, phone: true },
        take: 15,
        where: { OR: [{ phone: null }, { email: null }], status: { in: ["ACTIVE", "PROSPECTIVE"] } },
      })
    : [];

  const pendingApprovals = appointmentAccessWhere !== null
    ? await database.appointment.findMany({
        orderBy: { startsAt: "asc" },
        select: {
          client: { select: { firstName: true, lastName: true } },
          serviceNameSnapshot: true,
          startsAt: true,
        },
        take: 20,
        where: {
          ...appointmentAccessWhere,
          startsAt: { gte: now },
          status: { in: ["REQUESTED", "PENDING_REVIEW"] },
        },
      })
    : [];

  const todayFinanceEntries = access.finance
    ? await database.financeLedgerEntry.findMany({
        select: { amountMinor: true, currency: true },
        where: { occurredAt: { gte: day.start, lt: day.end }, type: { in: ["PAYMENT", "REVERSAL"] } },
      })
    : [];
  const financePlans = access.finance
    ? await database.clientPlan.findMany({
        select: {
          client: { select: { firstName: true, lastName: true } },
          currency: true,
          installments: { orderBy: { dueDate: "asc" }, select: { dueDate: true } },
          ledgerEntries: { select: { amountMinor: true } },
          name: true,
          sessionCount: true,
          sessionCreditEntries: { select: { quantityDelta: true } },
          status: true,
          validFrom: true,
        },
        where: { status: { not: "CANCELLED" } },
      })
    : [];
  const recentPaymentsRaw = access.finance
    ? await database.financeLedgerEntry.findMany({
        orderBy: { occurredAt: "desc" },
        select: {
          amountMinor: true,
          client: { select: { firstName: true, lastName: true } },
          currency: true,
          occurredAt: true,
          plan: { select: { name: true } },
          reversedBy: { select: { id: true } },
        },
        take: 20,
        where: { type: "PAYMENT" },
      })
    : [];
  const recentActivityRaw = access.audit
    ? await database.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        select: { action: true, actor: { select: { name: true } }, createdAt: true },
        take: 8,
      })
    : [];

  const total = todayAppointmentsRaw.length;
  let completed = 0;
  let cancelled = 0;
  let noShow = 0;
  let pending = 0;
  for (const appointment of todayAppointmentsRaw) {
    if (appointment.status === "COMPLETED") completed += 1;
    else if (appointment.status === "NO_SHOW") noShow += 1;
    else if (CANCELLED.has(appointment.status)) cancelled += 1;
    else if (UPCOMING.has(appointment.status)) pending += 1;
  }

  const todayAppointments = todayAppointmentsRaw.map((appointment) => ({
    clientId: appointment.clientId,
    duration: `${appointment.durationMinutesSnapshot} dk`,
    id: appointment.id,
    name: fullName(appointment.client),
    payment: "",
    service: appointment.serviceNameSnapshot,
    status: statusToTr(appointment.status),
    time: formatDateTimeInputInZone(appointment.startsAt, timeZone).time,
    type: locationToTr(appointment.locationTypeSnapshot),
  }));

  const activeClients = clientCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const prospective = clientCounts.find((row) => row.status === "PROSPECTIVE")?._count._all ?? 0;

  const activePlans = financePlans.filter((plan) => plan.status === "ACTIVE");
  let grantedSessions = 0;
  let remainingSessions = 0;
  const planiBitmekUzere: string[] = [];
  const seansiBitmekUzere: string[] = [];
  for (const plan of activePlans) {
    grantedSessions += plan.sessionCount;
    const remaining = plan.sessionCreditEntries.reduce((sum, entry) => sum + entry.quantityDelta, 0);
    remainingSessions += remaining;
    const label = fullName(plan.client);
    if (remaining <= 1) planiBitmekUzere.push(`${label} — Son ${Math.max(0, remaining)} seans kaldı`);
    else if (remaining <= 3) seansiBitmekUzere.push(`${label} — ${remaining} seans kaldı`);
  }
  const consumedSessions = Math.max(0, grantedSessions - remainingSessions);

  const financeTotals = new Map<string, FinanceTotals>();
  for (const entry of todayFinanceEntries) {
    totalsFor(financeTotals, entry.currency).todayCollectedMinor -= entry.amountMinor;
  }
  const upcomingPayments: Array<{ date: Date; label: string }> = [];
  const overduePayments: string[] = [];
  for (const plan of financePlans) {
    const outstanding = calculateLedgerBalance(plan.ledgerEntries);
    if (outstanding <= 0n) continue;
    const totals = totalsFor(financeTotals, plan.currency);
    const dueDate = plan.installments[0]?.dueDate ?? plan.validFrom;
    const amountLabel = `${fullName(plan.client)} — ${plan.name}`;
    if (dueDate < day.start) {
      totals.overdueOutstandingMinor += outstanding;
      overduePayments.push(amountLabel);
    } else if (dueDate < day.end) {
      totals.dueTodayOutstandingMinor += outstanding;
      upcomingPayments.push({ date: dueDate, label: amountLabel });
    } else {
      upcomingPayments.push({ date: dueDate, label: amountLabel });
    }
  }
  for (const totals of financeTotals.values()) {
    totals.expectedTotalMinor = totals.todayCollectedMinor + totals.dueTodayOutstandingMinor;
  }

  const financeRows = [...financeTotals.values()].map((row) => ({
    currency: row.currency,
    dueTodayOutstandingMinor: row.dueTodayOutstandingMinor.toString(),
    expectedTotalMinor: row.expectedTotalMinor.toString(),
    overdueOutstandingMinor: row.overdueOutstandingMinor.toString(),
    todayCollectedMinor: row.todayCollectedMinor.toString(),
  }));

  return NextResponse.json(
    {
      data: {
        access,
        clients: { active: activeClients, newThisWeek, prospective },
        finance: { rows: financeRows },
        pending: {
          eksikBilgili: incompleteClients.map((client) => {
            const missing = [!client.phone ? "telefon" : null, !client.email ? "e-posta" : null].filter(Boolean).join(" ve ");
            return `${fullName(client)} — ${missing} eksik`;
          }),
          gecikenOdemeler: overduePayments.slice(0, 8),
          onayBekleyen: pendingApprovals.map((appointment) => {
            const when = formatDateTimeInputInZone(appointment.startsAt, timeZone);
            return `${fullName(appointment.client)} — ${when.date} ${when.time} (${appointment.serviceNameSnapshot})`;
          }),
          planiBitmekUzere,
          seansiBitmekUzere,
          yaklasanOdemeler: upcomingPayments.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8).map((item) => item.label),
          yanitBekleyen: prospectiveClients.map((client) => fullName(client)),
        },
        plans: {
          activeCount: activePlans.length,
          consumptionRate: grantedSessions > 0 ? Math.round((consumedSessions / grantedSessions) * 100) : 0,
          grantedSessions,
          remainingSessions,
        },
        recentActivity: recentActivityRaw.map((entry) => {
          const described = describeAudit(entry.action, entry.actor?.name);
          return { ...described, time: relativeTime(entry.createdAt, now) };
        }),
        recentPayments: recentPaymentsRaw.filter((entry) => !entry.reversedBy).slice(0, 6).map((entry) => ({
          amountMinor: (entry.amountMinor < 0n ? -entry.amountMinor : entry.amountMinor).toString(),
          currency: entry.currency,
          date: entry.occurredAt.toISOString(),
          label: entry.plan?.name ?? "Ödeme",
          name: fullName(entry.client),
        })),
        sessions: {
          cancelled,
          completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          noShow,
          pending,
          total,
        },
        todayAppointments,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
