import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { calculateLedgerBalance } from "@/domain/finance/finance-operations";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { formatDateTimeInputInZone, getZonedDayRange, getZonedWeekRange } from "@/lib/time-zone";

// The Ana Panel landing screens (Genel Bakış, Bugünün Özeti, Bekleyen İşlemler)
// are read-only operational summaries, so any active admin may load them — the
// same baseline the management hub uses.
function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

const UPCOMING_APPOINTMENT_STATUSES = new Set([
  "REQUESTED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "RESCHEDULE_PROPOSED",
]);

const CANCELLED_APPOINTMENT_STATUSES = new Set([
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_PRACTITIONER",
]);

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function formatMinor(amountMinor: bigint, currency: string): string {
  const key = currency || "TRY";
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
    currencyFormatters.set(key, formatter);
  }
  const label = key === "TRY" ? "TL" : key;
  return `${formatter.format(Math.round(Number(amountMinor) / 100))} ${label}`;
}

function statusToTr(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "Tamamlandı";
    case "NO_SHOW":
      return "Gelmedi";
    case "CANCELLED_BY_CLIENT":
    case "CANCELLED_BY_PRACTITIONER":
      return "İptal";
    case "REJECTED":
      return "Reddedildi";
    default:
      return "Sıradaki";
  }
}

function locationToTr(location: string): string {
  switch (location) {
    case "ONLINE":
      return "Online";
    case "HYBRID":
      return "Hibrit";
    default:
      return "Yüz Yüze";
  }
}

function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();

  const environment = getServerEnvironment();
  const timeZone = environment.BUSINESS_TIME_ZONE;
  const now = new Date();
  const day = getZonedDayRange(now, timeZone);
  const week = getZonedWeekRange(now, timeZone);
  const database = getDatabase();

  const [
    todayAppointmentsRaw,
    clientCounts,
    newThisWeek,
    todayPayments,
    activePlans,
    pendingApprovals,
    prospectiveClients,
    incompleteClients,
  ] = await Promise.all([
    database.appointment.findMany({
      orderBy: { startsAt: "asc" },
      select: {
        clientId: true,
        client: { select: { firstName: true, lastName: true } },
        durationMinutesSnapshot: true,
        financeEntries: { select: { type: true } },
        id: true,
        locationTypeSnapshot: true,
        serviceNameSnapshot: true,
        startsAt: true,
        status: true,
      },
      where: { startsAt: { gte: day.start, lt: day.end } },
    }),
    database.client.groupBy({ _count: { _all: true }, by: ["status"] }),
    database.client.count({
      where: { createdAt: { gte: week.start, lt: week.end }, status: { not: "INACTIVE" } },
    }),
    database.financeLedgerEntry.findMany({
      select: { amountMinor: true },
      where: { occurredAt: { gte: day.start, lt: day.end }, type: "PAYMENT" },
    }),
    database.clientPlan.findMany({
      select: {
        client: { select: { firstName: true, lastName: true } },
        currency: true,
        installments: {
          orderBy: { dueDate: "asc" },
          select: {
            amountDueMinor: true,
            dueDate: true,
            ledgerEntries: { select: { amountMinor: true } },
          },
        },
        ledgerEntries: { select: { amountMinor: true } },
        name: true,
        sessionCount: true,
        sessionCreditEntries: { select: { quantityDelta: true } },
      },
      where: { status: "ACTIVE" },
    }),
    database.appointment.findMany({
      orderBy: { startsAt: "asc" },
      select: {
        client: { select: { firstName: true, lastName: true } },
        serviceNameSnapshot: true,
        startsAt: true,
      },
      take: 20,
      where: { startsAt: { gte: now }, status: { in: ["REQUESTED", "PENDING_REVIEW"] } },
    }),
    database.client.findMany({
      orderBy: { createdAt: "desc" },
      select: { firstName: true, lastName: true },
      take: 10,
      where: { status: "PROSPECTIVE" },
    }),
    database.client.findMany({
      orderBy: { updatedAt: "desc" },
      select: { email: true, firstName: true, lastName: true, phone: true },
      take: 15,
      where: {
        OR: [{ phone: null }, { email: null }],
        status: { in: ["ACTIVE", "PROSPECTIVE"] },
      },
    }),
  ]);

  // Today's session analysis.
  const total = todayAppointmentsRaw.length;
  let completed = 0;
  let cancelled = 0;
  let noShow = 0;
  let pending = 0;
  for (const appointment of todayAppointmentsRaw) {
    if (appointment.status === "COMPLETED") completed += 1;
    else if (appointment.status === "NO_SHOW") noShow += 1;
    else if (CANCELLED_APPOINTMENT_STATUSES.has(appointment.status)) cancelled += 1;
    else if (UPCOMING_APPOINTMENT_STATUSES.has(appointment.status)) pending += 1;
  }
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const todayAppointments = todayAppointmentsRaw.map((appointment) => ({
    clientId: appointment.clientId,
    duration: `${appointment.durationMinutesSnapshot} dk`,
    name: fullName(appointment.client),
    payment: appointment.financeEntries.some((entry) => entry.type === "PAYMENT")
      ? "Ödendi"
      : "Bekleniyor",
    service: appointment.serviceNameSnapshot,
    status: statusToTr(appointment.status),
    time: formatDateTimeInputInZone(appointment.startsAt, timeZone).time,
    type: locationToTr(appointment.locationTypeSnapshot),
  }));

  // Client distribution.
  const active =
    clientCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const prospective =
    clientCounts.find((row) => row.status === "PROSPECTIVE")?._count._all ?? 0;

  // Plan and session progress.
  const activeCount = activePlans.length;
  let remainingSessions = 0;
  let grantedSessions = 0;
  for (const plan of activePlans) {
    grantedSessions += plan.sessionCount;
    remainingSessions += plan.sessionCreditEntries.reduce(
      (sum, entry) => sum + entry.quantityDelta,
      0,
    );
  }
  const consumedSessions = Math.max(0, grantedSessions - remainingSessions);
  const consumptionRate =
    grantedSessions > 0 ? Math.round((consumedSessions / grantedSessions) * 100) : 0;

  // Finance flow derived from active-plan installments.
  const currency = activePlans[0]?.currency ?? "TRY";
  let todayCollectedMinor = 0n;
  for (const payment of todayPayments) {
    const amount = payment.amountMinor < 0n ? -payment.amountMinor : payment.amountMinor;
    todayCollectedMinor += amount;
  }
  let dueTodayOutstandingMinor = 0n;
  let overdueOutstandingMinor = 0n;
  const upcomingPayments: Array<{ dueDate: Date; label: string }> = [];
  const overduePayments: string[] = [];
  for (const plan of activePlans) {
    const clientName = fullName(plan.client);
    for (const installment of plan.installments) {
      const outstanding =
        installment.amountDueMinor + calculateLedgerBalance(installment.ledgerEntries);
      if (outstanding <= 0n) continue;
      const amountLabel = `${clientName} — ${formatMinor(outstanding, plan.currency)} (${plan.name})`;
      if (installment.dueDate < day.start) {
        overdueOutstandingMinor += outstanding;
        overduePayments.push(amountLabel);
      } else if (installment.dueDate < day.end) {
        dueTodayOutstandingMinor += outstanding;
        upcomingPayments.push({ dueDate: installment.dueDate, label: amountLabel });
      } else {
        upcomingPayments.push({ dueDate: installment.dueDate, label: amountLabel });
      }
    }
  }
  const expectedTotalMinor = todayCollectedMinor + dueTodayOutstandingMinor;

  // Plans / sessions nearing the end of their session credits.
  const planiBitmekUzere: string[] = [];
  const seansiBitmekUzere: string[] = [];
  for (const plan of activePlans) {
    const remaining = plan.sessionCreditEntries.reduce(
      (sum, entry) => sum + entry.quantityDelta,
      0,
    );
    const clientName = fullName(plan.client);
    if (remaining <= 1) {
      planiBitmekUzere.push(`${clientName} — Son ${Math.max(0, remaining)} seans kaldı`);
    } else if (remaining <= 3) {
      seansiBitmekUzere.push(`${clientName} — ${remaining} seans kaldı`);
    }
  }

  const upcomingLabels = upcomingPayments
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 8)
    .map((entry) => entry.label);

  const pendingSummary = {
    eksikBilgili: incompleteClients.map((client) => {
      const missing = [!client.phone ? "telefon" : null, !client.email ? "e-posta" : null]
        .filter(Boolean)
        .join(" ve ");
      return `${fullName(client)} — ${missing} eksik`;
    }),
    gecikenOdemeler: overduePayments.slice(0, 8),
    onayBekleyen: pendingApprovals.map((appointment) => {
      const when = formatDateTimeInputInZone(appointment.startsAt, timeZone);
      const [, month, dayOfMonth] = when.date.split("-");
      return `${fullName(appointment.client)} — ${dayOfMonth}.${month} ${when.time} (${appointment.serviceNameSnapshot})`;
    }),
    planiBitmekUzere,
    seansiBitmekUzere,
    yaklasanOdemeler: upcomingLabels,
    yanitBekleyen: prospectiveClients.map((client) => fullName(client)),
  };

  return NextResponse.json(
    {
      data: {
        clients: { active, newThisWeek, prospective },
        finance: {
          currency,
          dueTodayOutstandingMinor: dueTodayOutstandingMinor.toString(),
          expectedTotalMinor: expectedTotalMinor.toString(),
          overdueOutstandingMinor: overdueOutstandingMinor.toString(),
          todayCollectedMinor: todayCollectedMinor.toString(),
        },
        pending: pendingSummary,
        plans: { activeCount, consumptionRate, grantedSessions, remainingSessions },
        sessions: { cancelled, completed, completionRate, noShow, pending, total },
        todayAppointments,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
