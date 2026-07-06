import { AdminShell } from "@/components/admin/admin-shell";
import styles from "@/components/admin/admin-shell.module.css";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await requirePermission("services:read");
  const [services, pendingAppointments, activePlans] = await Promise.all([
    getDatabase().service.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        defaultDurationMinutes: true,
        locationType: true,
        name: true,
        publicVisible: true,
        status: true,
      },
    }),
    getDatabase().appointment.count({ where: { status: "PENDING_REVIEW" } }),
    getDatabase().clientPlan.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: hasPermission(session.user.roles, "appointments:read"),
        clientsRead: hasPermission(session.user.roles, "clients:read"),
        financeRead: hasPermission(session.user.roles, "finance:read"),
        servicesRead: true,
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
      }}
      subtitle="İş akışı, özet metrikler ve hizmet yapılandırmaları tek bakışta görünür."
      title="Yönetim paneli"
    >
      <div className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <span>Hizmet sayısı</span>
          <strong>{services.length}</strong>
          <small>Aktif ve taslak hizmet yapılandırmaları</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Bekleyen talepler</span>
          <strong>{pendingAppointments}</strong>
          <small>İncelemeye hazır randevu istekleri</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Aktif plan</span>
          <strong>{activePlans}</strong>
          <small>Devam eden danışan planı ve taksit akışı</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Sağlık özeti</span>
          <strong>Read-only</strong>
          <small>Outbox ve entegrasyon metrikleri yönetim menüsünden erişilir</small>
        </article>
      </div>

      <section className="admin-panel" aria-labelledby="hizmet-listesi">
        <div className="admin-panel-heading">
          <div>
            <h2 id="hizmet-listesi">Hizmet yapılandırmaları</h2>
            <p>Süre, konum ve görünürlük değişiklikleri geçmiş kayıtları değiştirmez.</p>
          </div>
          <span className="admin-count">{services.length} kayıt</span>
        </div>

        {services.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Henüz hizmet yok</strong>
            <span>Sentetik başlangıç verisi çalıştırıldığında taslak hizmet burada görünür.</span>
          </div>
        ) : (
          <ul className="admin-service-list">
            {services.map((service) => (
              <li key={service.name}>
                <div>
                  <strong>{service.name}</strong>
                  <span>
                    {service.defaultDurationMinutes} dk · {service.locationType}
                  </span>
                </div>
                <span>{service.publicVisible ? "Public" : service.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
