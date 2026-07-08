import type { Route } from "next";
import Link from "next/link";

import { AppointmentCreateModal } from "@/components/admin/appointment-create-modal";
import { AppointmentQueue } from "@/components/admin/appointment-queue";
import { AdminShell } from "@/components/admin/admin-shell";
import styles from "@/components/admin/admin-shell.module.css";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const appointmentStatusLabels: Record<string, string> = {
  CANCELLED_BY_CLIENT: "Danışan iptal etti",
  CANCELLED_BY_PRACTITIONER: "Uzman iptal etti",
  COMPLETED: "Tamamlandı",
  CONFIRMED: "Onaylı",
  NO_SHOW: "Gelmedi",
  PENDING_REVIEW: "Onay bekliyor",
  REJECTED: "Reddedildi",
  REQUESTED: "Talep alındı",
  RESCHEDULE_PROPOSED: "Saat önerildi",
};

const locationLabels = {
  HYBRID: "Yüz yüze / çevrim içi",
  IN_PERSON: "Yüz yüze",
  ONLINE: "Çevrim içi",
} as const;

const operationStatuses = ["CONFIRMED", "RESCHEDULE_PROPOSED", "PENDING_REVIEW"] as const;

function singleParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatAppointmentRange(startsAt: Date, endsAt: Date, timeZone: string): string {
  const start = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(startsAt);
  const end = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(endsAt);
  return `${start} - ${end}`;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePermission("appointments:read");
  const params = await searchParams;
  const activeModal = singleParam(params, "modal");
  const initialClientId = singleParam(params, "clientId");
  const environment = getServerEnvironment();
  const database = getDatabase();
  const canManageAppointments = hasPermission(session.user.roles, "appointments:manage");
  const todayStart = startOfToday();
  const todayEnd = addDays(todayStart, 1);
  const weekEnd = addDays(todayStart, 7);

  const [pendingCount, todayAppointments, upcomingAppointments, confirmedCount, weeklyCount] =
    await Promise.all([
      database.appointment.count({ where: { status: "PENDING_REVIEW" } }),
      database.appointment.findMany({
        orderBy: [{ startsAt: "asc" }, { id: "asc" }],
        select: {
          client: { select: { firstName: true, lastName: true, type: true } },
          endsAt: true,
          id: true,
          locationTypeSnapshot: true,
          practitioner: { select: { displayName: true } },
          publicReference: true,
          serviceNameSnapshot: true,
          startsAt: true,
          status: true,
        },
        take: 6,
        where: {
          startsAt: { gte: todayStart, lt: todayEnd },
          status: { in: [...operationStatuses] },
        },
      }),
      database.appointment.findMany({
        orderBy: [{ startsAt: "asc" }, { id: "asc" }],
        select: {
          client: { select: { firstName: true, lastName: true, type: true } },
          endsAt: true,
          id: true,
          locationTypeSnapshot: true,
          practitioner: { select: { displayName: true } },
          publicReference: true,
          serviceNameSnapshot: true,
          startsAt: true,
          status: true,
        },
        take: 8,
        where: {
          startsAt: { gte: todayEnd },
          status: { in: [...operationStatuses] },
        },
      }),
      database.appointment.count({ where: { status: "CONFIRMED", startsAt: { gte: todayStart } } }),
      database.appointment.count({
        where: {
          startsAt: { gte: todayStart, lt: weekEnd },
          status: { in: [...operationStatuses] },
        },
      }),
    ]);

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
      subtitle="Bugünkü, yaklaşan ve inceleme bekleyen randevuları aynı operasyon ekranında takip edin."
      title="Randevular"
    >
      <div className={styles.dashboardGrid}>
        <article className={`${styles.dashboardCard} ${styles.dashboardCardPrimary}`}>
          <span>Bugünkü randevu</span>
          <strong>{todayAppointments.length}</strong>
          <small>Bugünün onaylı ve bekleyen operasyon kayıtları</small>
          <i className={styles.dashboardCardIcon}>◷</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Yaklaşan onaylı</span>
          <strong>{confirmedCount}</strong>
          <small>Bugünden sonraki onaylı randevu akışı</small>
          <i className={styles.dashboardCardIcon}>✓</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Bekleyen talep</span>
          <strong>{pendingCount}</strong>
          <small>İnceleme sırasındaki randevu talepleri</small>
          <i className={styles.dashboardCardIcon}>!</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Haftalık akış</span>
          <strong>{weeklyCount}</strong>
          <small>Önümüzdeki 7 gün içindeki operasyon yoğunluğu</small>
          <i className={styles.dashboardCardIcon}>↗</i>
        </article>
      </div>

      <section className="admin-panel" aria-labelledby="randevu-operasyonu">
        <div className="admin-panel-heading">
          <div>
            <h2 id="randevu-operasyonu">Randevu operasyonu</h2>
            <p>Bugünkü ve yaklaşan randevular, hızlı takip için kart görünümünde listelenir.</p>
          </div>
          {canManageAppointments ? (
            <Link
              className="primary-button admin-dashboard-clients-cta"
              href={"/yonetim/randevular?modal=randevu-olustur" as Route}
              scroll={false}
            >
              Randevu oluştur
            </Link>
          ) : (
            <span className="admin-count">Yalnızca görüntüleme</span>
          )}
        </div>

        <div className={styles.dashboardLayout}>
          <section className={styles.compactPanel} aria-labelledby="bugunku-randevular">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="bugunku-randevular">Bugünkü randevular</h2>
                <p>Bugün takip edilecek onaylı ve bekleyen kayıtlar.</p>
              </div>
              <span className={styles.panelBadge}>{todayAppointments.length} kayıt</span>
            </div>
            {todayAppointments.length === 0 ? (
              <div className="admin-empty-state" role="status">
                <strong>Bugün randevu yok</strong>
                <span>Bugüne ait yeni kayıt oluşturulursa burada görünür.</span>
              </div>
            ) : (
              <ul className="admin-client-list admin-dashboard-client-list">
                {todayAppointments.map((appointment) => (
                  <li className="admin-client-list-item admin-dashboard-client-card" key={appointment.id}>
                    <div className="admin-client-list-main">
                      <strong>
                        {appointment.client.firstName} {appointment.client.lastName}
                      </strong>
                      <span className="admin-client-contact">
                        {formatAppointmentRange(
                          appointment.startsAt,
                          appointment.endsAt,
                          environment.BUSINESS_TIME_ZONE,
                        )}
                      </span>
                      <span className="admin-client-meta">
                        <em>{appointment.serviceNameSnapshot}</em>
                        <em>{appointmentStatusLabels[appointment.status] ?? appointment.status}</em>
                        <em>{locationLabels[appointment.locationTypeSnapshot]}</em>
                      </span>
                    </div>
                    <span className="admin-client-profile-link admin-dashboard-client-action">
                      {appointment.practitioner.displayName}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.compactPanel} aria-labelledby="yaklasan-randevular">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="yaklasan-randevular">Yaklaşan randevular</h2>
                <p>Bugünden sonraki ilk operasyon kayıtları.</p>
              </div>
              <span className={styles.panelBadge}>{upcomingAppointments.length} kayıt</span>
            </div>
            {upcomingAppointments.length === 0 ? (
              <div className="admin-empty-state" role="status">
                <strong>Yaklaşan randevu yok</strong>
                <span>Onaylı veya bekleyen gelecek randevular burada listelenir.</span>
              </div>
            ) : (
              <ul className="admin-client-list admin-dashboard-client-list">
                {upcomingAppointments.map((appointment) => (
                  <li className="admin-client-list-item admin-dashboard-client-card" key={appointment.id}>
                    <div className="admin-client-list-main">
                      <strong>
                        {appointment.client.firstName} {appointment.client.lastName}
                      </strong>
                      <span className="admin-client-contact">
                        {formatAppointmentRange(
                          appointment.startsAt,
                          appointment.endsAt,
                          environment.BUSINESS_TIME_ZONE,
                        )}
                      </span>
                      <span className="admin-client-meta">
                        <em>{appointment.serviceNameSnapshot}</em>
                        <em>{appointmentStatusLabels[appointment.status] ?? appointment.status}</em>
                        <em>{locationLabels[appointment.locationTypeSnapshot]}</em>
                      </span>
                    </div>
                    <code className="admin-client-profile-link">{appointment.publicReference}</code>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>

      <section className="admin-panel" aria-labelledby="bekleyen-randevular">
        <div className="admin-panel-heading">
          <div>
            <h2 id="bekleyen-randevular">İnceleme sırası</h2>
            <p>Public formdan gelen ve henüz karar verilmemiş randevu talepleri.</p>
          </div>
          <span className="admin-count">{pendingCount} bekleyen</span>
        </div>

        <AppointmentQueue
          businessTimeZone={environment.BUSINESS_TIME_ZONE}
          canManage={canManageAppointments}
        />
      </section>

      {activeModal === "randevu-olustur" && canManageAppointments ? (
        <AppointmentCreateModal
          closeHref="/yonetim/randevular"
          initialClientId={initialClientId}
        />
      ) : null}
    </AdminShell>
  );
}
