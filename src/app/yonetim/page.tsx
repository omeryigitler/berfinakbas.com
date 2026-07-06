import type { Route } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import styles from "@/components/admin/admin-shell.module.css";
import { DashboardUrlModals } from "@/components/admin/dashboard-url-modals";
import { hasPermission } from "@/domain/auth/permissions";
import {
  clientStatusLabels,
  clientTypeLabels,
} from "@/domain/clients/client-management";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

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

function singleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatMoney(amountMinor: bigint | number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(amountMinor) / 100);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function barHeight(value: number, maxValue: number): string {
  if (value <= 0) return "18%";
  return `${Math.max(24, Math.round((value / maxValue) * 100))}%`;
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePermission("services:read");
  const params = await searchParams;
  const activeModal = singleParam(params, "modal");
  const canReadAppointments = hasPermission(session.user.roles, "appointments:read");
  const canReadClients = hasPermission(session.user.roles, "clients:read");
  const canManageClients = hasPermission(session.user.roles, "clients:manage");
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canReadTechnicalHealth = hasPermission(
    session.user.roles,
    "technical-health:read",
  );
  const db = getDatabase();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const services = await db.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      defaultDurationMinutes: true,
      locationType: true,
      name: true,
      publicVisible: true,
      status: true,
    },
  });

  const totalClients = canReadClients ? await db.client.count() : 0;
  const activeClients = canReadClients
    ? await db.client.count({ where: { status: "ACTIVE" } })
    : 0;
  const childClients = canReadClients
    ? await db.client.count({ where: { type: "CHILD" } })
    : 0;
  const latestClients = canReadClients
    ? await db.client.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          firstName: true,
          id: true,
          lastName: true,
          phone: true,
          status: true,
          type: true,
        },
        take: 5,
      })
    : [];

  const pendingAppointments = canReadAppointments
    ? await db.appointment.count({ where: { status: "PENDING_REVIEW" } })
    : 0;
  const todaysAppointments = canReadAppointments
    ? await db.appointment.findMany({
        orderBy: [{ startsAt: "asc" }],
        select: {
          client: { select: { firstName: true, lastName: true } },
          id: true,
          service: { select: { name: true } },
          startsAt: true,
          status: true,
        },
        take: 5,
        where: { startsAt: { gte: todayStart, lt: todayEnd } },
      })
    : [];
  const upcomingAppointments = canReadAppointments
    ? await db.appointment.count({ where: { startsAt: { gte: todayStart } } })
    : 0;

  const activePlans = canReadFinance
    ? await db.clientPlan.count({ where: { status: "ACTIVE" } })
    : 0;
  const paymentsThisMonth = canReadFinance
    ? await db.financeLedgerEntry.aggregate({
        _sum: { amountMinor: true },
        where: { occurredAt: { gte: monthStart }, type: "PAYMENT" },
      })
    : null;
  const paymentTotal = paymentsThisMonth?._sum.amountMinor ?? BigInt(0);
  const maxAnalyticsValue = Math.max(
    totalClients,
    activeClients,
    childClients,
    pendingAppointments,
    activePlans,
    services.length,
    1,
  );
  const analytics = [
    { label: "Danışan", value: totalClients },
    { label: "Aktif", value: activeClients },
    { label: "Çocuk", value: childClients },
    { label: "Randevu", value: upcomingAppointments },
    { label: "Plan", value: activePlans },
    { label: "Hizmet", value: services.length },
  ];
  const actionItems = [
    canManageClients
      ? {
          href: "/yonetim?modal=danisan-ekle" as Route,
          kicker: "+",
          title: "Danışan ekle",
        }
      : null,
    canReadClients
      ? { href: "/yonetim?modal=not-ekle" as Route, kicker: "✎", title: "Not ekle" }
      : null,
    canReadAppointments
      ? {
          href: "/yonetim?modal=randevu-olustur" as Route,
          kicker: "◷",
          title: "Randevu oluştur",
        }
      : null,
    canReadFinance
      ? {
          href: "/yonetim?modal=odeme-plani" as Route,
          kicker: "₺",
          title: "Ödeme planı",
        }
      : null,
  ].filter((item): item is { href: Route; kicker: string; title: string } => item !== null);

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: canReadAppointments,
        clientsRead: canReadClients,
        financeRead: canReadFinance,
        servicesRead: true,
        technicalHealthRead: canReadTechnicalHealth,
      }}
      subtitle="Danışan, randevu, ödeme ve hizmet akışını tek bakışta gösteren operasyon paneli. Hızlı işlemler URL tabanlı modal olarak açılır."
      title="Dashboard"
    >
      <div className={styles.dashboardGrid}>
        <article className={`${styles.dashboardCard} ${styles.dashboardCardPrimary}`}>
          <span>Toplam danışan</span>
          <strong>{canReadClients ? totalClients : "—"}</strong>
          <small>
            {activeClients} aktif kayıt · {childClients} çocuk danışan
          </small>
          <i className={styles.dashboardCardIcon}>↗</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Bugünkü randevu</span>
          <strong>{canReadAppointments ? todaysAppointments.length : "—"}</strong>
          <small>{pendingAppointments} onay bekleyen talep var</small>
          <i className={styles.dashboardCardIcon}>◷</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Aktif plan</span>
          <strong>{canReadFinance ? activePlans : "—"}</strong>
          <small>Danışanlara bağlı devam eden ödeme planları</small>
          <i className={styles.dashboardCardIcon}>₺</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Hizmet</span>
          <strong>{services.length}</strong>
          <small>Süre, konum ve görünürlük ayarı bulunan hizmetler</small>
          <i className={styles.dashboardCardIcon}>⌘</i>
        </article>
      </div>

      <div className={styles.dashboardLayout}>
        <div className={styles.mainStack}>
          <section className={styles.overviewPanel} aria-labelledby="operasyon-analitigi">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="operasyon-analitigi">Operasyon analitiği</h2>
                <p>Danışan, randevu ve plan yoğunluğunu sade bir grafikle gösterir.</p>
              </div>
              <span className={styles.panelBadge}>Canlı veri</span>
            </div>
            <div className={styles.analyticsBars}>
              {analytics.map((item) => (
                <div className={styles.analyticsBar} key={item.label}>
                  <div className={styles.barTrack}>
                    <span
                      className={styles.barFill}
                      style={{ height: barHeight(item.value, maxAnalyticsValue) }}
                    />
                  </div>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.compactPanel} aria-labelledby="son-danisanlar">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="son-danisanlar">Son danışan kayıtları</h2>
                <p>Yeni açılan kayıtlar ve hızlı profil geçişleri.</p>
              </div>
              {canReadClients ? (
                <Link className="secondary-button" href="/yonetim/danisanlar">
                  Tümünü aç
                </Link>
              ) : null}
            </div>
            {latestClients.length === 0 ? (
              <div className={styles.emptyNote}>
                <strong>Henüz danışan görünmüyor</strong>
                <span>Danışan oluşturulduğunda bu alanda son kayıtlar listelenecek.</span>
              </div>
            ) : (
              <ul className={styles.dataList}>
                {latestClients.map((client) => (
                  <li key={client.id}>
                    <div>
                      <strong>
                        {client.firstName} {client.lastName}
                      </strong>
                      <span>
                        {client.phone ?? "Telefon yok"} · {clientTypeLabels[client.type]} ·{" "}
                        {clientStatusLabels[client.status]}
                      </span>
                    </div>
                    <Link href={`/yonetim/danisan-profili?clientId=${client.id}` as Route}>
                      Aç
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.asideStack}>
          <section className={styles.actionPanel} aria-labelledby="hizli-islemler">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="hizli-islemler">Hızlı işlemler</h2>
                <p>En çok kullanılan BO işlemleri; sayfa değişmeden URL modalı açılır.</p>
              </div>
            </div>
            <div className={styles.actionGrid}>
              {actionItems.map((item) => (
                <Link
                  className={styles.actionCard}
                  href={item.href}
                  key={item.href}
                  scroll={false}
                >
                  <span>{item.kicker}</span>
                  <strong>{item.title}</strong>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.compactPanel} aria-labelledby="bugun-takip">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="bugun-takip">Bugünkü takip</h2>
                <p>Günün randevu akışı.</p>
              </div>
              <span className={styles.panelBadge}>{todaysAppointments.length} kayıt</span>
            </div>
            {todaysAppointments.length === 0 ? (
              <div className={styles.emptyNote}>
                <strong>Bugün randevu yok</strong>
                <span>Yeni randevu talebi gelirse burada görünecek.</span>
              </div>
            ) : (
              <ul className={styles.dataList}>
                {todaysAppointments.map((appointment) => (
                  <li key={appointment.id}>
                    <div>
                      <strong>
                        {formatTime(appointment.startsAt)} · {appointment.client.firstName}{" "}
                        {appointment.client.lastName}
                      </strong>
                      <span>{appointment.service.name}</span>
                    </div>
                    <small>{appointmentStatusLabels[appointment.status] ?? appointment.status}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.financeHighlight} aria-labelledby="odeme-ozeti">
            <span id="odeme-ozeti">Bu ay alınan ödeme</span>
            <strong>{canReadFinance ? formatMoney(paymentTotal) : "—"}</strong>
            <small>{activePlans} aktif plan üzerinden ön muhasebe takibi.</small>
          </section>
        </aside>
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

      <DashboardUrlModals
        activeModal={activeModal}
        canManageClients={canManageClients}
        canReadAppointments={canReadAppointments}
        canReadFinance={canReadFinance}
      />
    </AdminShell>
  );
}
