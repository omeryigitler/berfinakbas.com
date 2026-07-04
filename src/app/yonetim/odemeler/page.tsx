import Link from "next/link";

import { FinanceDashboard } from "@/components/admin/finance-dashboard";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const session = await requirePermission("finance:read");
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Berfin Akbaş · Yönetim</p>
          <h1>Ödeme ve planlar</h1>
        </div>
        <div className="admin-header-actions">
          <Link href="/yonetim">Yönetime dön</Link>
          <span>{session.user.email}</span>
        </div>
      </header>
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
    </main>
  );
}
