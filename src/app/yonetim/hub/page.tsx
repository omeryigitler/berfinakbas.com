import "@fontsource-variable/inter/index.css";

import type { Metadata } from "next";

import { DashboardHub } from "@/components/admin/hub/dashboard-hub";
import { mapAppointmentToHubRecord, mapClientToHubRecord } from "@/components/admin/hub/hub-data";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false, noarchive: true, nosnippet: true },
  title: "Yönetim Hub | Berfin Akbaş",
};

export default async function AdminHubPage() {
  const session = await requirePermission("appointments:read");
  const canManage = hasPermission(session.user.roles, "appointments:manage");
  const canReadClients = hasPermission(session.user.roles, "clients:read");
  const environment = getServerEnvironment();
  const database = getDatabase();

  const [appointmentRows, clientRows] = await Promise.all([
    database.appointment.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
    }),
    canReadClients
      ? database.client.findMany({
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          select: {
            appointments: {
              orderBy: { startsAt: "desc" },
              select: { serviceNameSnapshot: true, startsAt: true, status: true },
              take: 3,
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
  ]);

  const now = new Date();
  const timeZone = environment.BUSINESS_TIME_ZONE;
  const appointments = appointmentRows.map((row) => mapAppointmentToHubRecord(row, now, timeZone));
  const clients = clientRows.map((row) => mapClientToHubRecord(row, now, timeZone));

  return (
    <DashboardHub
      appointments={appointments}
      canManage={canManage}
      canReadClients={canReadClients}
      clients={clients}
    />
  );
}
