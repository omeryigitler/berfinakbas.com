import { AdminShell } from "@/components/admin/admin-shell";
import { OutboxHealthDashboard } from "@/components/admin/outbox-health-dashboard";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";

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
      subtitle="Entegrasyon tetikleyicileri, gönderim kuyruğu ve teknik durum read-only olarak aynı sistem alanında görünür."
      title="Sistem sağlığı"
    >
      <OutboxHealthDashboard />
    </AdminShell>
  );
}
