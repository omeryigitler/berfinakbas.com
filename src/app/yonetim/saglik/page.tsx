import { AdminShell } from "@/components/admin/admin-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { OutboxHealthDashboard } from "@/components/admin/outbox-health-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const session = await requirePermission("technical-health:read");

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: hasPermission(session.user.roles, "appointments:read"),
        clientsRead: hasPermission(session.user.roles, "clients:read"),
        financeRead: hasPermission(session.user.roles, "finance:read"),
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: true,
      }}
      subtitle="Çekirdek işleyişin dış tetikleyicileri ve outbox durumu read-only görünür."
      title="Entegrasyon sağlığı"
    >
      <OutboxHealthDashboard />
    </AdminShell>
  );
}
