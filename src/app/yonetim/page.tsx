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

function getWeekRange(todayStart: Date): { weekEnd: Date; weekStart: Date } {
  const weekStart = new Date(todayStart);
  const day = weekStart.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return { weekEnd, weekStart };
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePermission("services:read");
  const params = await searchParams;
  const activeModal = singleParam(params, "modal");
  const canReadAppointments = hasPermission(
    session.user.roles,
    "appointments:read",
  );
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
  const monthStart = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    1,
  );
  const { weekEnd, weekStart } = getWeekRange(todayStart);

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
  const newClientsThisMonth = canReadClients
    ? await db.client.count({ where: { createdAt: { gte: monthStart } } })
    : 0;
  const latestClients = canReadClients
    ? await db.client.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          email: true,
          firstName: true,
          id: true,
          lastName: true,
          phone: true,
          preferredName: true,
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
  const weeklyAppointments = canReadAppointments
    ? await db.appointment.count({
        where: { startsAt: { gte: weekStart, lt: weekEnd } },
      })
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
  const formattedPaymentTotal = formatMoney(paymentTotal);
  const maxAnalyticsValue = Math.max(
    totalClients,
    activeClients,
    childClients,
    newClientsThisMonth,
    pendingAppointments,
    weeklyAppointments,
    activePlans,
    services.length,
    1,
  );
  const analytics = [
    { label: "Danışan", value: totalClients },
    { label: "Aktif", value: activeClients },
    { label: "Yeni", value: newClientsThisMonth },
    { label: "Haftalık", value: weeklyAppointments },
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
      ? {
          href: "/yonetim?modal=not-ekle" as Route,
          kicker: "✎",
          title: "Not ekle",
        }
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
  ].filter(
    (item): item is { href: Route; kicker: string; title: string } =>
      item !== null,
  );

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
        <article
          className={`${styles.dashboardCard} ${styles.dashboardCardPrimary}`}
        >
          <span>Toplam aktif danışan</span>
          <strong>{canReadClients ? activeClients : "—"}</strong>
          <small>
            {totalClients} toplam kayıt · {childClients} çocuk danışan
          </small>
          <i className={styles.dashboardCardIcon}>↗</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Yeni kayıt / bu ay</span>
          <strong>{canReadClients ? newClientsThisMonth : "—"}</strong>
          <small>Bu ay açılan danışan dosyası</small>
          <i className={styles.dashboardCardIcon}>◌</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Bugünkü randevu</span>
          <strong>
            {canReadAppointments ? todaysAppointments.length : "—"}
          </strong>
          <small>{pendingAppointments} onay bekleyen talep var</small>
          <i className={styles.dashboardCardIcon}>◷</i>
        </article>
        <article className={styles.dashboardCard}>
          <span>Aktif ödeme planı</span>
          <strong>{canReadFinance ? activePlans : "—"}</strong>
          <small>Bu ay alınan ödeme: {formattedPaymentTotal}</small>
          <i className={styles.dashboardCardIcon}>₺</i>
        </article>
      </div>

      <div className={styles.dashboardLayout}>
        <div className={styles.mainStack}>
          <section
            className={styles.overviewPanel}
            aria-labelledby="operasyon-analitigi"
          >
            <div className={styles.panelHeader}>
              <div>
                <h2 id="operasyon-analitigi">Operasyon analitiği</h2>
                <p>
                  Danışan, randevu, ödeme planı ve hizmet yoğunluğunu sade bir
                  grafikle gösterir.
                </p>
              </div>
              <span className={styles.panelBadge}>Canlı veri</span>
            </div>
            <div className={styles.analyticsBars}>
              {analytics.map((item) => (
                <div className={styles.analyticsBar} key={item.label}>
                  <div className={styles.barTrack}>
                    <span
                      className={styles.barFill}
                      style={{
                        height: barHeight(item.value, maxAnalyticsValue),
                      }}
                    />
                  </div>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section
            className={styles.compactPanel}
            aria-labelledby="son-danisanlar"
          >
            <div className={styles.panelHeader}>
              <div>
                <h2 id="son-danisanlar">Son danışan kayıtları</h2>
                <p>Yeni açılan kayıtlar ve hızlı profil geçişleri.</p>
              </div>
              {canReadClients ? (
                <Link
                  className="primary-button admin-dashboard-clients-cta"
                  href="/yonetim/danisanlar"
                >
                  Tümünü aç
                </Link>
              ) : null}
            </div>
            {latestClients.length === 0 ? (
              <div className={styles.emptyNote}>
                <strong>Henüz danışan görünmüyor</strong>
                <span>
                  Danışan oluşturulduğunda bu alanda son kayıtlar listelenecek.
                </span>
              </div>
            ) : (
              <ul className="admin-client-list admin-dashboard-client-list">
                {latestClients.map((client) => (
                  <li
                    className="admin-client-list-item admin-dashboard-client-card"
                    key={client.id}
                  >
                    <div className="admin-client-list-main">
                      <strong>
                        {client.firstName} {client.lastName}
                      </strong>
                      <span className="admin-client-contact">
                        {client.preferredName ? `${client.preferredName} · ` : ""}
                        {client.phone ?? "Telefon yok"} · {client.email ?? "E-posta yok"}
                      </span>
                      <span className="admin-client-meta">
                        <em>{clientTypeLabels[client.type]}</em>
                        <em>{clientStatusLabels[client.status]}</em>
                      </span>
                    </div>
                    <Link
                      className="admin-client-profile-link admin-dashboard-client-action"
                      href={
                        `/yonetim/danisan-profili?clientId=${client.id}` as Route
                      }
                    >
                      Profili aç
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.asideStack}>
          <section
            className={styles.actionPanel}
            aria-labelledby="hizli-islemler"
          >
            <div className={styles.panelHeader}>
              <div>
                <h2 id="hizli-islemler">Hızlı işlemler</h2>
                <p>
                  En çok kullanılan BO işlemleri; sayfa değişmeden URL modalı
                  açılır.
                </p>
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

          <section
            className={styles.compactPanel}
            aria-labelledby="haftalik-ozet"
          >
            <div className={styles.panelHeader}>
              <div>
                <h2 id="haftalik-ozet">Haftalık özet</h2>
                <p>Bu haftaki operasyon yoğunluğu.</p>
              </div>
              <span className={styles.panelBadge}>{weeklyAppointments} randevu</span>
            </div>
            <ul className={styles.dataList}>
              <li>
                <div>
                  <strong>Randevu akışı</strong>
                  <span>{upcomingAppointments} yaklaşan randevu takibi</span>
                </div>
                <small>{weeklyAppointments}</small>
              </li>
              <li>
                <div>
                  <strong>Yeni danışan</strong>
                  <span>Bu ay açılan danışan dosyası</span>
                </div>
                <small>{newClientsThisMonth}</small>
              </li>
              <li>
                <div>
                  <strong>Bekleyen karar</strong>
                  <span>Onay bekleyen randevu talebi</span>
                </div>
                <small>{pendingAppointments}</small>
              </li>
            </ul>
          </section>

          <section
            className={styles.compactPanel}
            aria-labelledby="bugun-takip"
          >
            <div className={styles.panelHeader}>
              <div>
                <h2 id="bugun-takip">Bugünkü takip</h2>
                <p>Günün randevu akışı.</p>
              </div>
              <span className={styles.panelBadge}>
                {todaysAppointments.length} kayıt
              </span>
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
                        {formatTime(appointment.startsAt)} ·{" "}
                        {appointment.client.firstName}{" "}
                        {appointment.client.lastName}
                      </strong>
                      <span>{appointment.service.name}</span>
                    </div>
                    <small>
                      {appointmentStatusLabels[appointment.status] ??
                        appointment.status}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className={styles.financeHighlight}
            aria-labelledby="odeme-ozeti"
          >
            <span id="odeme-ozeti">Bu ay alınan ödeme</span>
            <strong>{canReadFinance ? formattedPaymentTotal : "—"}</strong>
            <small>
              {activePlans} aktif plan üzerinden ön muhasebe takibi.
            </small>
          </section>
        </aside>
      </div>

      <section className="admin-panel" aria-labelledby="hizmet-listesi">
        <div className="admin-panel-heading">
          <div>
            <h2 id="hizmet-listesi">Hizmet yapılandırmaları</h2>
            <p>
              Süre, konum ve görünürlük değişiklikleri geçmiş kayıtları
              değiştirmez.
            </p>
          </div>
          <span className="admin-count">{services.length} kayıt</span>
        </div>

        {services.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Henüz hizmet yok</strong>
            <span>
              Sentetik başlangıç verisi çalıştırıldığında taslak hizmet burada
              görünür.
            </span>
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
