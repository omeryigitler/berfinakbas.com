import type { Route } from "next";
import Link from "next/link";

import { AppointmentCreateModal } from "@/components/admin/appointment-create-modal";
import { AppointmentOperationList } from "@/components/admin/appointment-operation-list";
import { AppointmentQueue } from "@/components/admin/appointment-queue";
import { AdminShell } from "@/components/admin/admin-shell";
import styles from "@/components/admin/admin-shell.module.css";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const operationStatuses = ["CONFIRMED", "RESCHEDULE_PROPOSED", "PENDING_REVIEW"] as const;

type OperationAppointment = {
  client: {
    firstName: string;
    id: string;
    lastName: string;
    type: "ADULT" | "CHILD";
  };
  endsAt: Date;
  id: string;
  locationTypeSnapshot: "HYBRID" | "IN_PERSON" | "ONLINE";
  practitioner: { displayName: string };
  publicReference: string;
  serviceNameSnapshot: string;
  startsAt: Date;
  status:
    | "CANCELLED_BY_CLIENT"
    | "CANCELLED_BY_PRACTITIONER"
    | "COMPLETED"
    | "CONFIRMED"
    | "NO_SHOW"
    | "PENDING_REVIEW"
    | "REJECTED"
    | "REQUESTED"
    | "RESCHEDULE_PROPOSED";
};

function singleParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
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

function serializeAppointments(appointments: OperationAppointment[]) {
  return appointments.map((appointment) => ({
    ...appointment,
    endsAt: appointment.endsAt.toISOString(),
    startsAt: appointment.startsAt.toISOString(),
  }));
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
          client: { select: { firstName: true, id: true, lastName: true, type: true } },
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
          client: { select: { firstName: true, id: true, lastName: true, type: true } },
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
            <AppointmentOperationList
              appointments={serializeAppointments(todayAppointments)}
              businessTimeZone={environment.BUSINESS_TIME_ZONE}
              canManage={canManageAppointments}
              emptyDescription="Bugüne ait yeni kayıt oluşturulursa burada görünür."
              emptyTitle="Bugün randevu yok"
            />
          </section>

          <section className={styles.compactPanel} aria-labelledby="yaklasan-randevular">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="yaklasan-randevular">Yaklaşan randevular</h2>
                <p>Bugünden sonraki ilk operasyon kayıtları.</p>
              </div>
              <span className={styles.panelBadge}>{upcomingAppointments.length} kayıt</span>
            </div>
            <AppointmentOperationList
              appointments={serializeAppointments(upcomingAppointments)}
              businessTimeZone={environment.BUSINESS_TIME_ZONE}
              canManage={canManageAppointments}
              emptyDescription="Onaylı veya bekleyen gelecek randevular burada listelenir."
              emptyTitle="Yaklaşan randevu yok"
            />
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
        <AppointmentCreateModal closeHref="/yonetim/randevular" initialClientId={initialClientId} />
      ) : null}
    </AdminShell>
  );
}
