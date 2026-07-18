import "@fontsource-variable/inter/index.css";

import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";

export const metadata: Metadata = {
  robots: { follow: false, index: false, noarchive: true, nosnippet: true },
  title: "Yönetim | Berfin Akbaş",
};

export default async function AdminStartPage() {
  const session = await requirePermission("appointments:read");

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: true,
        clientsRead: hasPermission(session.user.roles, "clients:read"),
        financeRead: hasPermission(session.user.roles, "finance:read"),
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
      }}
      subtitle="Soldaki menüden bir çalışma alanı seçin. Liste ve kayıt detayları sağ tarafta kademeli olarak açılır."
      title="Yönetim"
    >
      <div aria-hidden="true" />
    </AdminShell>
  );
}
