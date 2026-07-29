import { NextResponse } from "next/server";

import { GET as getBaseOverview } from "@/app/api/admin/dashboard-overview/route";
import { calculateLedgerBalance } from "@/domain/finance/finance-operations";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { formatDateTimeInputInZone, getZonedDayRange } from "@/lib/time-zone";

type CurrencyTotals = {
  currency: string;
  dueTodayOutstandingMinor: bigint;
  expectedTotalMinor: bigint;
  overdueOutstandingMinor: bigint;
  todayCollectedMinor: bigint;
};

function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim();
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

function getCurrencyTotals(map: Map<string, CurrencyTotals>, currency: string): CurrencyTotals {
  const key = currency || "TRY";
  const existing = map.get(key);
  if (existing) return existing;
  const created: CurrencyTotals = {
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
  const baseResponse = await getBaseOverview();
  if (!baseResponse.ok) return baseResponse;

  const payload = (await baseResponse.json()) as {
    data?: Record<string, unknown>;
  };
  const baseData = payload.data ?? {};
  const environment = getServerEnvironment();
  const timeZone = environment.BUSINESS_TIME_ZONE;
  const now = new Date();
  const day = getZonedDayRange(now, timeZone);
  const database = getDatabase();

  const [todayAppointmentsRaw, todayFinanceEntries, activePlans, recentPaymentsRaw] =
    await Promise.all([
      database.appointment.findMany({
        orderBy: { startsAt: "asc" },
        select: {
          clientId: true,
          client: { select: { firstName: true, lastName: true } },
          durationMinutesSnapshot: true,
          financeEntries: { select: { amountMinor: true } },
          id: true,
          locationTypeSnapshot: true,
          serviceNameSnapshot: true,
          startsAt: true,
          status: true,
        },
        where: { startsAt: { gte: day.start, lt: day.end } },
      }),
      database.financeLedgerEntry.findMany({
        select: { amountMinor: true, currency: true },
        where: {
          occurredAt: { gte: day.start, lt: day.end },
          type: { in: ["PAYMENT", "REVERSAL"] },
        },
      }),
      database.clientPlan.findMany({
        select: {
          currency: true,
          installments: {
            select: {
              amountDueMinor: true,
              dueDate: true,
              ledgerEntries: { select: { amountMinor: true } },
            },
          },
        },
        where: { status: "ACTIVE" },
      }),
      database.financeLedgerEntry.findMany({
        orderBy: { occurredAt: "desc" },
        select: {
          amountMinor: true,
          client: { select: { firstName: true, lastName: true } },
          currency: true,
          occurredAt: true,
          paymentMethod: { select: { name: true } },
          plan: { select: { name: true } },
          reversedBy: { select: { id: true } },
        },
        take: 20,
        where: { type: "PAYMENT" },
      }),
    ]);

  const currencyTotals = new Map<string, CurrencyTotals>();
  for (const entry of todayFinanceEntries) {
    const totals = getCurrencyTotals(currencyTotals, entry.currency);
    totals.todayCollectedMinor -= entry.amountMinor;
  }
  for (const plan of activePlans) {
    const totals = getCurrencyTotals(currencyTotals, plan.currency);
    for (const installment of plan.installments) {
      const outstanding =
        installment.amountDueMinor + calculateLedgerBalance(installment.ledgerEntries);
      if (outstanding <= 0n) continue;
      if (installment.dueDate < day.start) {
        totals.overdueOutstandingMinor += outstanding;
      } else if (installment.dueDate < day.end) {
        totals.dueTodayOutstandingMinor += outstanding;
      }
    }
  }
  for (const totals of currencyTotals.values()) {
    totals.expectedTotalMinor = totals.todayCollectedMinor + totals.dueTodayOutstandingMinor;
  }

  const financeRows = [...currencyTotals.values()]
    .sort((left, right) => {
      if (left.currency === "TRY") return -1;
      if (right.currency === "TRY") return 1;
      return left.currency.localeCompare(right.currency);
    })
    .map((totals) => ({
      currency: totals.currency,
      dueTodayOutstandingMinor: totals.dueTodayOutstandingMinor.toString(),
      expectedTotalMinor: totals.expectedTotalMinor.toString(),
      overdueOutstandingMinor: totals.overdueOutstandingMinor.toString(),
      todayCollectedMinor: totals.todayCollectedMinor.toString(),
    }));

  const todayAppointments = todayAppointmentsRaw.map((appointment) => {
    const paymentBalance = calculateLedgerBalance(appointment.financeEntries);
    return {
      clientId: appointment.clientId,
      duration: `${appointment.durationMinutesSnapshot} dk`,
      id: appointment.id,
      name: fullName(appointment.client),
      payment: paymentBalance < 0n ? "Ödendi" : "Bekleniyor",
      service: appointment.serviceNameSnapshot,
      status: statusToTr(appointment.status),
      time: formatDateTimeInputInZone(appointment.startsAt, timeZone).time,
      type: locationToTr(appointment.locationTypeSnapshot),
    };
  });

  const recentPayments = recentPaymentsRaw
    .filter((entry) => !entry.reversedBy)
    .slice(0, 6)
    .map((entry) => ({
      amountMinor: (entry.amountMinor < 0n ? -entry.amountMinor : entry.amountMinor).toString(),
      currency: entry.currency,
      date: entry.occurredAt.toISOString(),
      label: entry.plan?.name ?? entry.paymentMethod?.name ?? "Ödeme",
      name: fullName(entry.client),
    }));

  return NextResponse.json(
    {
      data: {
        ...baseData,
        finance: { rows: financeRows },
        recentPayments,
        todayAppointments,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
