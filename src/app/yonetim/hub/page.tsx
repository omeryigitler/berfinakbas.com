import type { Metadata } from "next";

import { DashboardHub } from "@/components/admin/hub/dashboard-hub";
import { mapAppointmentToHubRecord } from "@/components/admin/hub/hub-data";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false, noarchive: true, nosnippet: true },
  title: "Yönetim Hub | Berfin Akbaş",
};

export default async function AdminHubPage() {
  await requirePermission("appointments:read");
  const environment = getServerEnvironment();
  const database = getDatabase();

  const rows = await database.appointment.findMany({
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
  });

  const now = new Date();
  const records = rows.map((row) =>
    mapAppointmentToHubRecord(row, now, environment.BUSINESS_TIME_ZONE),
  );

  return <DashboardHub listCaption="son 30 talep" records={records} />;
}
