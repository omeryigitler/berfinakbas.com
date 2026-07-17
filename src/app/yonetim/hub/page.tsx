import "@fontsource-variable/inter/index.css";

import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  buildWeeklyAvailability,
  mapAppointmentToHubRecord,
  mapClientToHubRecord,
} from "@/components/admin/hub/hub-data";
import { buildHubFinanceSummary } from "@/components/admin/hub/hub-finance";
import { RecordCenter } from "@/components/admin/hub/record-center";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getZonedMonthRange } from "@/lib/time-zone";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false, noarchive: true, nosnippet: true },
  title: "Kayıt Merkezi | Berfin Akbaş",
};

const openRequestStatuses = ["REQUESTED", "PENDING_REVIEW", "RESCHEDULE_PROPOSED"] as const;
const upcomingClientStatuses = ["CONFIRMED", "PENDING_REVIEW", "RESCHEDULE_PROPOSED"] as const;

export default async function AdminHubPage() {
  const session = await requirePermission("appointments:read");
  const canManage = hasPermission(session.user.roles, "appointments:manage");
  const canReadClients = hasPermission(session.user.roles, "clients:read");
  const canReadAvailability = hasPermission(session.user.roles, "services:read");
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canReadTechnicalHealth = hasPermission(session.user.roles, "technical-health:read");
  const environment = getServerEnvironment();
  const database = getDatabase();

  const now = new Date();
  const timeZone = environment.BUSINESS_TIME_ZONE;
  const monthRange = getZonedMonthRange(now, timeZone);

  const [
    appointmentRows,
    clientRows,
    availabilityRows,
    recentFinanceRows,
    financeAggregateRows,
  ] = await Promise.all([
    database.appointment.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        approvedAt: true,
        client: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            preferredName: true,
            type: true,
          },
        },
        createdAt: true,
        duplicateReviewStatus: true,
        guardian: { select: { firstName: true, lastName: true } },
        id: true,
        practitioner: { select: { displayName: true } },
        publicReference: true,
        requestNote: true,
        serviceNameSnapshot: true,
        source: true,
        startsAt: true,
        status: true,
        statusLogs: {
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, toStatus: true },
          take: 5,
        },
      },
      take: 30,
      where: { status: { in: [...openRequestStatuses] } },
    }),
    canReadClients
      ? database.client.findMany({
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          select: {
            appointments: {
              orderBy: { startsAt: "asc" },
              select: { serviceNameSnapshot: true, startsAt: true, status: true },
              take: 1,
              where: {
                startsAt: { gt: now },
                status: { in: [...upcomingClientStatuses] },
              },
            },
            createdAt: true,
            email: true,
            firstName: true,
            guardians: {
              select: {
                guardian: { select: { firstName: true, lastName: true } },
                relationship: true,
              },
            },
            id: true,
            lastName: true,
            phone: true,
            preferredName: true,
            status: true,
            type: true,
            updatedAt: true,
          },
          take: 30,
        })
      : Promise.resolve([]),
    canReadAvailability
      ? database.availabilityRule.findMany({
          orderBy: [{ weekday: "asc" }, { localStartTime: "asc" }],
          select: {
            localEndTime: true,
            localStartTime: true,
            slotIncrementMinutes: true,
            status: true,
            weekday: true,
          },
        })
      : Promise.resolve(null),
    canReadFinance
      ? database.financeLedgerEntry.findMany({
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          select: {
            amountMinor: true,
            client: { select: { firstName: true, lastName: true, preferredName: true } },
            currency: true,
            id: true,
            occurredAt: true,
            type: true,
          },
          take: 8,
        })
      : Promise.resolve(null),
    canReadFinance
      ? database.financeLedgerEntry.groupBy({
          _count: { _all: true },
          _sum: { amountMinor: true },
          by: ["type", "currency"],
          where: {
            occurredAt: { gte: monthRange.start, lt: monthRange.end },
            type: { in: ["PAYMENT", "ACCRUAL"] },
          },
        })
      : Promise.resolve(null),
  ]);

  const appointments = appointmentRows.map((row) => mapAppointmentToHubRecord(row, now, timeZone));
  const clients = clientRows.map((row) => mapClientToHubRecord(row, now, timeZone));
  const availability = availabilityRows ? buildWeeklyAvailability(availabilityRows) : null;
  const finance =
    recentFinanceRows && financeAggregateRows
      ? buildHubFinanceSummary(
          recentFinanceRows,
          {
            accruals: financeAggregateRows
              .filter((row) => row.type === "ACCRUAL")
              .map((row) => ({
                count: row._count._all,
                currency: row.currency,
                totalMinor: row._sum.amountMinor ?? 0n,
              })),
            payments: financeAggregateRows
              .filter((row) => row.type === "PAYMENT")
              .map((row) => ({
                count: row._count._all,
                currency: row.currency,
                totalMinor: row._sum.amountMinor ?? 0n,
              })),
          },
          now,
          timeZone,
        )
      : null;

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: true,
        clientsRead: canReadClients,
        financeRead: canReadFinance,
        servicesRead: canReadAvailability,
        technicalHealthRead: canReadTechnicalHealth,
      }}
      subtitle="Randevu talepleri, danışan kayıtları, müsaitlik ve finans özetleri tek çalışma alanında açılır."
      title="Kayıt merkezi"
    >
      <RecordCenter
        appointments={appointments}
        availability={availability}
        canManage={canManage}
        canReadClients={canReadClients}
        clients={clients}
        finance={finance}
      />
    </AdminShell>
  );
}
