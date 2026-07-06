import { AdminShell } from "@/components/admin/admin-shell";
import { ClientFinanceOverview } from "@/components/admin/client-finance-overview";
import { FinanceDashboard } from "@/components/admin/finance-dashboard";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function singleParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminFinancePage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requirePermission("finance:read");
  const params = await searchParams;
  const clientId = singleParam(params, "clientId").trim();

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: hasPermission(session.user.roles, "appointments:read"),
        clientsRead: hasPermission(session.user.roles, "clients:read"),
        financeRead: true,
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
      }}
      subtitle="Plan, taksit ve ödeme akışı tek panel üzerinden yönetilir."
      title="Ödeme ve planlar"
    >
      {clientId ? <ClientFinanceOverview clientId={clientId} /> : null}

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
