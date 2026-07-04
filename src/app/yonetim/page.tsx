import Link from "next/link";

import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await requirePermission("services:read");
  const services = await getDatabase().service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      defaultDurationMinutes: true,
      locationType: true,
      name: true,
      publicVisible: true,
      status: true,
    },
  });

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Berfin Akbaş · Yönetim</p>
          <h1>Hizmetler</h1>
        </div>
        <div className="admin-header-actions">
          <Link href="/yonetim/randevular">Bekleyen talepler</Link>
          {hasPermission(session.user.roles, "finance:read") ? (
            <Link href="/yonetim/odemeler">Ödeme ve planlar</Link>
          ) : null}
          <span>{session.user.email}</span>
        </div>
      </header>

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
    </main>
  );
}
