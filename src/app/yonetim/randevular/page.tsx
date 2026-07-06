import { AppointmentQueue } from "@/components/admin/appointment-queue";
import { AdminShell } from "@/components/admin/admin-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getServerEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  const session = await requirePermission("appointments:read");
  const environment = getServerEnvironment();

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
      subtitle="Bekleyen randevu talepleri ve operasyon adımları tek liste halinde görünür."
      title="Randevular"
    >
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
    </AdminShell>
  );
}
