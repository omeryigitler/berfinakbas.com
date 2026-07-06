import { AdminShell } from "@/components/admin/admin-shell";
import { FinanceDashboard } from "@/components/admin/finance-dashboard";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const session = await requirePermission("finance:read");
  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: hasPermission(session.user.roles, "appointments:read"),
        financeRead: true,
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
      }}
      subtitle="Plan, taksit ve ödeme akışı tek panel üzerinden yönetilir."
      title="Ödeme ve planlar"
    >
      <section className="admin-panel" aria-labelledby="finance-title">
        <div className="admin-panel-heading">
          <div>
            <h2 id="finance-title">Ön muhasebe operasyonu</h2>
            <p>
              Plan, taksit, ödeme ve ters kayıtlar append-only hareketlerden hesaplanır; bu alan
              resmi muhasebe sistemi değildir.
            </p>
          </div>
          <span className="admin-count">FINANCE</span>
        </div>
        <FinanceDashboard canManage={hasPermission(session.user.roles, "finance:manage")} />
      </section>
    </AdminShell>
  );
}
