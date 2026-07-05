import Link from "next/link";

import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { OutboxHealthDashboard } from "@/components/admin/outbox-health-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const session = await requirePermission("technical-health:read");

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Berfin Akbaş · Yönetim</p>
          <h1>Entegrasyon Sağlığı</h1>
        </div>
        <div className="admin-header-actions">
          <Link href="/yonetim">Hizmetler</Link>
          <Link href="/yonetim/randevular">Bekleyen talepler</Link>
          {hasPermission(session.user.roles, "finance:read") ? (
            <Link href="/yonetim/odemeler">Ödeme ve planlar</Link>
          ) : null}
          <span>{session.user.email}</span>
        </div>
      </header>

      <OutboxHealthDashboard />
    </main>
  );
}
