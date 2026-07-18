import "@fontsource-variable/inter/index.css";

import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import shellStyles from "@/components/admin/hub/progressive-shell.module.css";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import {
  formatCurrencyAmounts,
  type CurrencyAggregate,
} from "@/lib/finance/currency-summary";
import {
  getZonedDayRange,
  getZonedMonthRange,
  getZonedWeekRange,
} from "@/lib/time-zone";

import { OverviewToolbar } from "./overview-toolbar";
import styles from "./overview.module.css";
import startStyles from "./start-active.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false, noarchive: true, nosnippet: true },
  title: "Yönetim | Berfin Akbaş",
};

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

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toLocaleUpperCase("tr-TR");
}

function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

function barHeight(value: number, maxValue: number): string {
  if (value <= 0) return "8%";
  return `${Math.max(12, Math.round((value / maxValue) * 100))}%`;
}

function paymentAggregates(
  rows: readonly Readonly<{
    _count: { _all: number };
    _sum: { amountMinor: bigint | null };
    currency: string;
  }>[],
): CurrencyAggregate[] {
  return rows.map((row) => ({
    count: row._count._all,
    currency: row.currency,
    totalMinor:
      row._sum.amountMinor && row._sum.amountMinor < 0n
        ? -row._sum.amountMinor
        : (row._sum.amountMinor ?? 0n),
  }));
}

export default async function AdminStartPage() {
  const session = await requirePermission("appointments:read");
  const canReadAppointments = hasPermission(session.user.roles, "appointments:read");
  const canManageAppointments = hasPermission(session.user.roles, "appointments:manage");
  const canReadClients = hasPermission(session.user.roles, "clients:read");
  const canManageClients = hasPermission(session.user.roles, "clients:manage");
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canReadServices = hasPermission(session.user.roles, "services:read");
  const canReadTechnicalHealth = hasPermission(session.user.roles, "technical-health:read");

  const database = getDatabase();
  const environment = getServerEnvironment();
  const timeZone = environment.BUSINESS_TIME_ZONE;
  const now = new Date();
  const dayRange = getZonedDayRange(now, timeZone);
  const weekRange = getZonedWeekRange(now, timeZone);
  const monthRange = getZonedMonthRange(now, timeZone);

  const [
    totalClients,
    activeClients,
    newClientsThisMonth,
    latestClients,
    pendingAppointments,
    todaysAppointments,
    upcomingAppointments,
    weeklyAppointments,
    activePlans,
    serviceCount,
    practitionerCount,
    monthlyPaymentRows,
  ] = await Promise.all([
    canReadClients ? database.client.count() : Promise.resolve(0),
    canReadClients
      ? database.client.count({ where: { status: "ACTIVE" } })
      : Promise.resolve(0),
    canReadClients
      ? database.client.count({
          where: { createdAt: { gte: monthRange.start, lt: monthRange.end } },
        })
      : Promise.resolve(0),
    canReadClients
      ? database.client.findMany({
          orderBy: [{ createdAt: "desc" }],
          select: {
            firstName: true,
            id: true,
            lastName: true,
            status: true,
            type: true,
          },
          take: 5,
        })
      : Promise.resolve([]),
    canReadAppointments
      ? database.appointment.count({
          where: { status: { in: ["REQUESTED", "PENDING_REVIEW"] } },
        })
      : Promise.resolve(0),
    canReadAppointments
      ? database.appointment.findMany({
          orderBy: [{ startsAt: "asc" }],
          select: {
            client: { select: { firstName: true, lastName: true } },
            id: true,
            service: { select: { name: true } },
            startsAt: true,
            status: true,
          },
          take: 5,
          where: { startsAt: { gte: dayRange.start, lt: dayRange.end } },
        })
      : Promise.resolve([]),
    canReadAppointments
      ? database.appointment.count({ where: { startsAt: { gte: now } } })
      : Promise.resolve(0),
    canReadAppointments
      ? database.appointment.count({
          where: { startsAt: { gte: weekRange.start, lt: weekRange.end } },
        })
      : Promise.resolve(0),
    canReadFinance
      ? database.clientPlan.count({ where: { status: "ACTIVE" } })
      : Promise.resolve(0),
    canReadServices ? database.service.count() : Promise.resolve(0),
    canReadServices ? database.practitioner.count() : Promise.resolve(0),
    canReadFinance
      ? database.financeLedgerEntry.groupBy({
          _count: { _all: true },
          _sum: { amountMinor: true },
          by: ["currency"],
          where: {
            occurredAt: { gte: monthRange.start, lt: monthRange.end },
            type: "PAYMENT",
          },
        })
      : Promise.resolve([]),
  ]);

  const formattedPaymentTotal = formatCurrencyAmounts(paymentAggregates(monthlyPaymentRows));
  const analytics = [
    { label: "Danışan", value: totalClients },
    { label: "Aktif", value: activeClients },
    { label: "Yeni", value: newClientsThisMonth },
    { label: "Bugün", value: todaysAppointments.length },
    { label: "Plan", value: activePlans },
    { label: "Hizmet", value: serviceCount },
    { label: "Terapist", value: practitionerCount },
  ];
  const maxAnalyticsValue = Math.max(...analytics.map((item) => item.value), 1);

  const weeklySummary = [
    { label: "Randevu akışı", value: weeklyAppointments },
    { label: "Yeni danışan", value: newClientsThisMonth },
    { label: "Bekleyen karar", value: pendingAppointments },
  ];
  const weeklyTotal = weeklySummary.reduce((total, item) => total + item.value, 0);
  const safeWeeklyTotal = Math.max(weeklyTotal, 1);
  const firstStop = (weeklySummary[0].value / safeWeeklyTotal) * 100;
  const secondStop = firstStop + (weeklySummary[1].value / safeWeeklyTotal) * 100;
  const donutStyle = {
    "--donut-background": `conic-gradient(#c9f21d 0 ${firstStop}%, #efe6dc ${firstStop}% ${secondStop}%, #5bc8bb ${secondStop}% 100%)`,
  } as CSSProperties;

  const actionItems = [
    canManageAppointments
      ? {
          href: "/yonetim?modal=randevu-olustur" as Route,
          icon: "◷",
          title: "Randevu oluştur",
        }
      : null,
    canReadAppointments
      ? { href: "/yonetim/randevular" as Route, icon: "↗", title: "Randevu operasyonu" }
      : null,
    canManageClients
      ? { href: "/yonetim/danisan-olustur" as Route, icon: "+", title: "Danışan ekle" }
      : null,
    canReadFinance
      ? { href: "/yonetim/odemeler" as Route, icon: "₺", title: "Ödeme ve planlar" }
      : null,
    canReadServices
      ? { href: "/yonetim/musaitlik" as Route, icon: "▤", title: "Müsaitlik yönetimi" }
      : null,
  ].filter(
    (item): item is { href: Route; icon: string; title: string } => item !== null,
  );

  return (
    <div className={`${shellStyles.scope} ${startStyles.scope} ${styles.scope}`}>
      <AdminShell
        email={session.user.email}
        permissions={{
          appointmentsRead: canReadAppointments,
          clientsRead: canReadClients,
          financeRead: canReadFinance,
          servicesRead: canReadServices,
          technicalHealthRead: canReadTechnicalHealth,
        }}
        subtitle="Danışan, randevu, ödeme ve hizmet akışını tek bakışta gösterir."
        title="Genel bakış"
      >
        <OverviewToolbar />

        <div className={styles.dashboard}>
          <section aria-label="Genel özet" className={styles.summaryStrip}>
            <article className={styles.summaryItem}>
              <span className={styles.summaryIcon}>◉</span>
              <div className={styles.summaryCopy}>
                <span>Toplam aktif danışan</span>
                <strong>{canReadClients ? activeClients : "—"}</strong>
                <small>{totalClients} toplam kayıt</small>
              </div>
              <span className={styles.summaryArrow}>›</span>
            </article>
            <article className={styles.summaryItem}>
              <span className={styles.summaryIcon}>＋</span>
              <div className={styles.summaryCopy}>
                <span>Yeni kayıt / bu ay</span>
                <strong>{canReadClients ? newClientsThisMonth : "—"}</strong>
                <small>İşletme ayı içinde açılan dosya</small>
              </div>
              <span className={styles.summaryArrow}>›</span>
            </article>
            <article className={styles.summaryItem}>
              <span className={styles.summaryIcon}>◷</span>
              <div className={styles.summaryCopy}>
                <span>Bugünkü randevu</span>
                <strong>{canReadAppointments ? todaysAppointments.length : "—"}</strong>
                <small>{pendingAppointments} açık talep veya inceleme</small>
              </div>
              <span className={styles.summaryArrow}>›</span>
            </article>
            <article className={styles.summaryItem}>
              <span className={styles.summaryIcon}>₺</span>
              <div className={styles.summaryCopy}>
                <span>Aktif ödeme planı</span>
                <strong>{canReadFinance ? activePlans : "—"}</strong>
                <small>Bu ay alınan: {canReadFinance ? formattedPaymentTotal : "—"}</small>
              </div>
              <span className={styles.summaryArrow}>›</span>
            </article>
          </section>

          <div className={styles.topGrid}>
            <section className={styles.panel} aria-labelledby="operasyon-analitigi">
              <div className={styles.panelHeader}>
                <h2 id="operasyon-analitigi">Operasyon analitiği</h2>
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
                    <strong>{item.value}</strong>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel} aria-labelledby="haftalik-ozet">
              <div className={styles.panelHeader}>
                <h2 id="haftalik-ozet">Haftalık özet</h2>
                <span className={styles.panelBadge}>Bu hafta</span>
              </div>
              <div className={styles.donutLayout}>
                <div className={styles.donut} style={donutStyle}>
                  <div className={styles.donutCenter}>
                    <strong>{weeklyTotal}</strong>
                    <span>Toplam</span>
                  </div>
                </div>
                <ul className={styles.legend}>
                  {weeklySummary.map((item) => (
                    <li key={item.label}>
                      <span className={styles.legendDot} />
                      <strong>{item.label}</strong>
                      <small>{item.value}</small>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className={styles.panel} aria-labelledby="hizli-islemler">
              <div className={styles.panelHeader}>
                <h2 id="hizli-islemler">Hızlı işlemler</h2>
              </div>
              <div className={styles.actionList}>
                {actionItems.map((item) => (
                  <Link className={styles.actionLink} href={item.href} key={item.href}>
                    <span className={styles.actionIcon}>{item.icon}</span>
                    <strong>{item.title}</strong>
                    <span>›</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className={styles.bottomGrid}>
            <section className={styles.panel} aria-labelledby="son-danisanlar">
              <div className={styles.panelHeader}>
                <h2 id="son-danisanlar">Son danışan kayıtları</h2>
                <Link className={styles.panelBadge} href="/yonetim/danisanlar">
                  Tümünü gör
                </Link>
              </div>
              {latestClients.length === 0 ? (
                <div className={styles.empty}>Danışan oluşturulduğunda son kayıtlar burada görünür.</div>
              ) : (
                <ul className={styles.clientList}>
                  {latestClients.map((client) => (
                    <li className={styles.clientRow} key={client.id}>
                      <span className={styles.avatar}>{initials(client.firstName, client.lastName)}</span>
                      <div className={styles.clientMain}>
                        <strong>{client.firstName} {client.lastName}</strong>
                        <span>{client.type === "CHILD" ? "Çocuk" : "Yetişkin"} · {client.status === "ACTIVE" ? "Aktif" : "Pasif"}</span>
                      </div>
                      <Link
                        aria-label={`${client.firstName} ${client.lastName} profilini aç`}
                        className={styles.rowAction}
                        href={`/yonetim/danisan-profili?clientId=${client.id}` as Route}
                      >
                        ›
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.panel} aria-labelledby="bugunku-takip">
              <div className={styles.panelHeader}>
                <h2 id="bugunku-takip">Bugünkü takip</h2>
                <span className={styles.panelBadge}>{todaysAppointments.length} kayıt</span>
              </div>
              {todaysAppointments.length === 0 ? (
                <div className={styles.empty}>Bugün randevu yok. Yeni randevu oluştuğunda burada görünür.</div>
              ) : (
                <ul className={styles.todayList}>
                  {todaysAppointments.map((appointment) => (
                    <li className={styles.todayRow} key={appointment.id}>
                      <span className={styles.time}>{formatTime(appointment.startsAt, timeZone)}</span>
                      <div className={styles.todayMain}>
                        <strong>{appointment.client.firstName} {appointment.client.lastName}</strong>
                        <span>{appointment.service.name}</span>
                      </div>
                      <span className={styles.status}>
                        {appointmentStatusLabels[appointment.status] ?? appointment.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.panel} aria-labelledby="aylik-odeme">
              <div className={styles.panelHeader}>
                <h2 id="aylik-odeme">Bu ay alınan ödeme</h2>
                <span className={styles.panelBadge}>Bu ay</span>
              </div>
              <strong className={styles.financeValue}>
                {canReadFinance ? formattedPaymentTotal : "—"}
              </strong>
              <span className={styles.financeMeta}>
                {activePlans} aktif plan üzerinden ön muhasebe takibi
              </span>
              <div aria-hidden="true" className={styles.financeBar}><span /></div>
              <span className={styles.financeMeta}>{upcomingAppointments} yaklaşan randevu</span>
            </section>
          </div>
        </div>
      </AdminShell>
    </div>
  );
}
