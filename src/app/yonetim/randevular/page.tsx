import Link from "next/link";

import { AppointmentQueue } from "@/components/admin/appointment-queue";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getServerEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  const session = await requirePermission("appointments:read");
  const environment = getServerEnvironment();

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Berfin Akbaş · Yönetim</p>
          <h1>Bekleyen talepler</h1>
        </div>
        <div className="admin-header-actions">
          <Link href="/yonetim">Hizmetlere dön</Link>
          <span>{session.user.email}</span>
        </div>
      </header>

      <section className="admin-panel" aria-labelledby="bekleyen-randevular">
        <div className="admin-panel-heading">
          <div>
            <h2 id="bekleyen-randevular">İnceleme sırası</h2>
            <p>
              Liste yalnızca operasyon için gerekli minimum bilgiyi gösterir; serbest not ve
              iletişim ayrıntısı içermez.
            </p>
          </div>
          <span className="admin-count">PENDING REVIEW</span>
        </div>

        <AppointmentQueue
          businessTimeZone={environment.BUSINESS_TIME_ZONE}
          canManage={hasPermission(session.user.roles, "appointments:manage")}
        />
      </section>
    </main>
  );
}
