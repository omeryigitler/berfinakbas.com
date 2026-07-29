import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { calculateLedgerBalance } from "@/domain/finance/finance-operations";
import type { Prisma } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";

const clientStatuses = ["PROSPECTIVE", "ACTIVE", "INACTIVE"] as const;

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

function getListParameters(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const rawTake = Number(params.get("take") ?? "100");
  const take = Number.isFinite(rawTake)
    ? Math.min(Math.max(Math.trunc(rawTake), 1), 100)
    : 100;
  const rawStatus = params.get("status");
  const status = clientStatuses.find((value) => value === rawStatus);

  return { query, status, take };
}

const baseClientSelect = {
  _count: { select: { appointments: true, notes: true } },
  appointments: {
    orderBy: { startsAt: "asc" as const },
    select: {
      serviceNameSnapshot: true,
      startsAt: true,
      status: true,
    },
    take: 1,
    where: {
      startsAt: { gte: new Date(0) },
      status: {
        in: ["REQUESTED", "PENDING_REVIEW", "CONFIRMED", "RESCHEDULE_PROPOSED"],
      },
    },
  },
  createdAt: true,
  email: true,
  firstName: true,
  id: true,
  lastName: true,
  phone: true,
  preferredName: true,
  status: true,
  type: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

function createWhere(input: {
  query: string;
  status?: (typeof clientStatuses)[number];
}): Prisma.ClientWhereInput {
  return {
    ...(input.status ? { status: input.status } : {}),
    ...(input.query
      ? {
          OR: [
            { firstName: { contains: input.query, mode: "insensitive" as const } },
            { lastName: { contains: input.query, mode: "insensitive" as const } },
            { email: { contains: input.query, mode: "insensitive" as const } },
            { phone: { contains: input.query } },
          ],
        }
      : {}),
  };
}

export async function GET(request: Request) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "clients:read")
  ) {
    return forbidden();
  }

  const { query, status, take } = getListParameters(request);
  const now = new Date();
  const database = getDatabase();
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const where = createWhere({ query, ...(status ? { status } : {}) });
  const appointments = {
    ...baseClientSelect.appointments,
    where: {
      ...baseClientSelect.appointments.where,
      startsAt: { gte: now },
    },
  };

  if (!canReadFinance) {
    const clients = await database.client.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: { ...baseClientSelect, appointments },
      take,
      where,
    });

    return NextResponse.json(
      {
        data: clients.map((client) => {
          const nextAppointment = client.appointments[0] ?? null;
          const score = Math.min(
            100,
            35 +
              (client.phone ? 15 : 0) +
              (client.email ? 15 : 0) +
              Math.min(client._count.appointments * 5, 20) +
              Math.min(client._count.notes * 3, 15),
          );

          return {
            activePlanName: null,
            appointmentsCount: client._count.appointments,
            createdAt: client.createdAt,
            currency: null,
            email: client.email,
            financeAccess: false,
            firstName: client.firstName,
            id: client.id,
            lastName: client.lastName,
            nextAppointment,
            notesCount: client._count.notes,
            openBalanceMinor: null,
            phone: client.phone,
            plansCount: null,
            preferredName: client.preferredName,
            remainingSessions: null,
            score,
            sessionCount: null,
            status: client.status,
            type: client.type,
            updatedAt: client.updatedAt,
          };
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const clients = await database.client.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      ...baseClientSelect,
      _count: { select: { appointments: true, notes: true, plans: true } },
      appointments,
      plans: {
        orderBy: { createdAt: "desc" },
        select: {
          currency: true,
          ledgerEntries: { select: { amountMinor: true } },
          name: true,
          sessionCount: true,
          sessionCreditEntries: { select: { quantityDelta: true } },
          status: true,
        },
      },
    },
    take,
    where,
  });

  return NextResponse.json(
    {
      data: clients.map((client) => {
        const nextAppointment = client.appointments[0] ?? null;
        const score = Math.min(
          100,
          35 +
            (client.phone ? 15 : 0) +
            (client.email ? 15 : 0) +
            Math.min(client._count.appointments * 5, 20) +
            Math.min(client._count.notes * 3, 15),
        );
        const activePlan =
          client.plans.find((plan) => plan.status === "ACTIVE") ??
          client.plans[0] ??
          null;
        const remainingSessions = activePlan
          ? activePlan.sessionCreditEntries.reduce(
              (total, entry) => total + entry.quantityDelta,
              0,
            )
          : 0;
        const openBalanceMinor = client.plans.reduce((total, plan) => {
          const balance = calculateLedgerBalance(plan.ledgerEntries);
          return total + (balance > 0n ? balance : 0n);
        }, 0n);

        return {
          activePlanName: activePlan?.name ?? null,
          appointmentsCount: client._count.appointments,
          createdAt: client.createdAt,
          currency: activePlan?.currency ?? client.plans[0]?.currency ?? "TRY",
          email: client.email,
          financeAccess: true,
          firstName: client.firstName,
          id: client.id,
          lastName: client.lastName,
          nextAppointment,
          notesCount: client._count.notes,
          openBalanceMinor: openBalanceMinor.toString(),
          phone: client.phone,
          plansCount: client._count.plans,
          preferredName: client.preferredName,
          remainingSessions,
          score,
          sessionCount: activePlan?.sessionCount ?? null,
          status: client.status,
          type: client.type,
          updatedAt: client.updatedAt,
        };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
