import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import styles from "@/components/admin/admin-shell.module.css";
import { ClientProfileUrlModals } from "@/components/admin/client-profile-url-modals";
import { hasPermission } from "@/domain/auth/permissions";
import {
  clientStatusLabels,
  clientTypeLabels,
  type ClientStatusValue,
  type ClientTypeValue,
} from "@/domain/clients/client-management";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getFilteredFinanceOverview } from "@/lib/finance/finance-overview-filter";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ProfileAppointment = {
  endsAt: Date;
  id: string;
  locationTypeSnapshot: "HYBRID" | "IN_PERSON" | "ONLINE";
  practitioner: { displayName: string };
  publicReference: string;
  service: { name: string } | null;
  serviceNameSnapshot: string;
  startsAt: Date;
  status: string;
};

type FinancePlanSummary = {
  balanceMinor: string;
  currency: string;
  id: string;
  installments: { id: string; state: string }[];
  invoiceStatus: string;
  name: string;
  remainingSessions: string;
  status: string;
  totalAmountMinor: string;
};

type ProfileFinanceEntry = {
  amountMinor: bigint;
  currency: string;
  id: string;
  note: string | null;
  occurredAt: Date;
  paymentMethod: { name: string } | null;
  plan: { name: string } | null;
  type: string;
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

const financeEntryTypeLabels: Record<string, string> = {
  ACCRUAL: "Plan borcu",
  ADJUSTMENT: "Düzeltme",
  PAYMENT: "Ödeme",
  REFUND: "İade",
  REVERSAL: "Ters kayıt",
};

const invoiceStatusLabels: Record<string, string> = {
  CANCELLED: "Fatura iptal",
  ISSUED: "Fatura kesildi",
  NOT_REQUIRED: "Fatura gerekmiyor",
  PENDING: "Fatura bekliyor",
  SENT_TO_ACCOUNTING: "Muhasebeye gönderildi",
};

const locationLabels = {
  HYBRID: "Yüz yüze / çevrim içi",
  IN_PERSON: "Yüz yüze",
  ONLINE: "Çevrim içi",
} as const;

const planStatusLabels = {
  ACTIVE: "Aktif",
  CANCELLED: "İptal",
  COMPLETED: "Tamamlandı",
  EXPIRED: "Süresi doldu",
} as const;

function singleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
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

function formatMoney(amountMinor: bigint, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(amountMinor) / 100);
}

function appointmentStatusLabel(status: string): string {
  return appointmentStatusLabels[status] ?? status;
}

function appointmentServiceName(appointment: ProfileAppointment): string {
  return appointment.serviceNameSnapshot || appointment.service?.name || "Hizmet";
}

function financeEntryTypeLabel(type: string): string {
  return financeEntryTypeLabels[type] ?? type;
}

function invoiceStatusLabel(status: string): string {
  return invoiceStatusLabels[status] ?? status;
}

function planStatusLabel(status: string): string {
  return planStatusLabels[status as keyof typeof planStatusLabels] ?? status;
}

function positiveMoney(amountMinor: bigint, currency: string): string {
  return formatMoney(amountMinor < 0n ? -amountMinor : amountMinor, currency);
}

function AppointmentList({
  appointments,
  emptyDescription,
  emptyTitle,
  timeZone,
}: {
  appointments: ProfileAppointment[];
  emptyDescription: string;
  emptyTitle: string;
  timeZone: string;
}) {
  if (appointments.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>{emptyTitle}</strong>
        <span>{emptyDescription}</span>
      </div>
    );
  }

  return (
    <ul className="admin-client-list admin-dashboard-client-list">
      {appointments.map((appointment) => (
        <li className="admin-client-list-item admin-dashboard-client-card" key={appointment.id}>
          <div className="admin-client-list-main">
            <strong>{appointmentServiceName(appointment)}</strong>
            <span className="admin-client-contact">
              {formatAppointmentRange(appointment.startsAt, appointment.endsAt, timeZone)}
            </span>
            <span className="admin-client-meta">
              <em>{appointmentStatusLabel(appointment.status)}</em>
              <em>{locationLabels[appointment.locationTypeSnapshot]}</em>
              <em>{appointment.practitioner.displayName}</em>
              <em>{appointment.publicReference}</em>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function FinancePlanList({ plans }: { plans: readonly FinancePlanSummary[] }) {
  if (plans.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>Plan kaydı yok</strong>
        <span>Ödeme planı oluşturulduğunda bakiye ve seans bilgisi burada görünür.</span>
      </div>
    );
  }

  return (
    <ul className="admin-client-list admin-dashboard-client-list">
      {plans.map((plan) => (
        <li className="admin-client-list-item admin-dashboard-client-card" key={plan.id}>
          <div className="admin-client-list-main">
            <strong>{plan.name}</strong>
            <span className="admin-client-contact">
              {formatMoney(BigInt(plan.totalAmountMinor), plan.currency)} toplam · {plan.remainingSessions} kalan seans
            </span>
            <span className="admin-client-meta">
              <em>{planStatusLabel(plan.status)}</em>
              <em>{formatMoney(BigInt(plan.balanceMinor), plan.currency)} açık bakiye</em>
              <em>{plan.installments.length} taksit</em>
              <em>{invoiceStatusLabel(plan.invoiceStatus)}</em>
            </span>
          </div>
          <span className="admin-client-profile-link admin-dashboard-client-action">
            {formatMoney(BigInt(plan.balanceMinor), plan.currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FinanceEntryList({ entries }: { entries: ProfileFinanceEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>Finans hareketi yok</strong>
        <span>Ödeme veya plan hareketi kaydedildiğinde burada listelenir.</span>
      </div>
    );
  }

  return (
    <ul className="admin-client-list admin-dashboard-client-list">
      {entries.map((entry) => (
        <li className="admin-client-list-item admin-dashboard-client-card" key={entry.id}>
          <div className="admin-client-list-main">
            <strong>{financeEntryTypeLabel(entry.type)}</strong>
            <span className="admin-client-contact">
              {formatDate(entry.occurredAt)} · {entry.plan?.name ?? "Plansız hareket"}
            </span>
            <span className="admin-client-meta">
              <em>{positiveMoney(entry.amountMinor, entry.currency)}</em>
              <em>{entry.paymentMethod?.name ?? "Yöntem yok"}</em>
              {entry.note ? <em>{entry.note}</em> : null}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminClientProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePermission("clients:read");
  const params = await searchParams;
  const clientId = singleParam(params, "clientId").trim();
  const activeModal = singleParam(params, "modal").trim();
  if (!clientId) notFound();

  const environment = getServerEnvironment();
  const database = getDatabase();
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canReadAppointments = hasPermission(
    session.user.roles,
    "appointments:read",
  );
  const client = await database.client.findUnique({
    include: {
      _count: {
        select: {
          appointments: true,
          consents: true,
          financeEntries: true,
          plans: true,
        },
      },
      guardians: {
        include: {
          guardian: {
            select: {
              email: true,
              firstName: true,
              id: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }],
      },
      plans: {
        orderBy: [{ createdAt: "desc" }],
        select: {
          currency: true,
          id: true,
          name: true,
          sessionCount: true,
          status: true,
          totalAmountMinor: true,
          validFrom: true,
        },
        take: 3,
      },
    },
    where: { id: clientId },
  });

  if (!client) notFound();

  const now = new Date();
  const [upcomingAppointments, appointmentHistory] = canReadAppointments
    ? await Promise.all([
        database.appointment.findMany({
          orderBy: [{ startsAt: "asc" }, { id: "asc" }],
          select: {
            endsAt: true,
            id: true,
            locationTypeSnapshot: true,
            practitioner: { select: { displayName: true } },
            publicReference: true,
            service: { select: { name: true } },
            serviceNameSnapshot: true,
            startsAt: true,
            status: true,
          },
          take: 5,
          where: {
            clientId: client.id,
            startsAt: { gte: now },
            status: { in: ["CONFIRMED", "PENDING_REVIEW", "RESCHEDULE_PROPOSED"] },
          },
        }),
        database.appointment.findMany({
          orderBy: [{ startsAt: "desc" }, { id: "desc" }],
          select: {
            endsAt: true,
            id: true,
            locationTypeSnapshot: true,
            practitioner: { select: { displayName: true } },
            publicReference: true,
            service: { select: { name: true } },
            serviceNameSnapshot: true,
            startsAt: true,
            status: true,
          },
          take: 6,
          where: { clientId: client.id, startsAt: { lt: now } },
        }),
      ])
    : [[], []];
  const [financeOverview, recentFinanceEntries] = canReadFinance
    ? await Promise.all([
        getFilteredFinanceOverview({ clientId: client.id, status: "ALL" }),
        database.financeLedgerEntry.findMany({
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
          select: {
            amountMinor: true,
            currency: true,
            id: true,
            note: true,
            occurredAt: true,
            paymentMethod: { select: { name: true } },
            plan: { select: { name: true } },
            type: true,
          },
          take: 6,
          where: { clientId: client.id },
        }),
      ])
    : [null, []];
  const financePlans = financeOverview?.plans ?? [];
  const activeFinancePlan = financePlans.find((plan) => plan.status === "ACTIVE") ?? null;
  const financeCurrency = financePlans[0]?.currency ?? "TRY";
  const totalPlanMinor = financePlans.reduce(
    (total, plan) => total + BigInt(plan.totalAmountMinor),
    0n,
  );
  const rawBalanceMinor = financePlans.reduce(
    (total, plan) => total + BigInt(plan.balanceMinor),
    0n,
  );
  const openBalanceMinor = rawBalanceMinor > 0n ? rawBalanceMinor : 0n;
  const paidMinor = totalPlanMinor > rawBalanceMinor ? totalPlanMinor - rawBalanceMinor : 0n;
  const remainingSessions = financePlans.reduce(
    (total, plan) => total + Number(plan.remainingSessions),
    0,
  );
  const focusAppointment = upcomingAppointments[0] ?? appointmentHistory[0] ?? null;
  const clientName = `${client.firstName} ${client.lastName}`;
  const activePlan = client.plans.find((plan) => plan.status === "ACTIVE");
  const primaryGuardian = client.guardians[0];
  const noteModalHref =
    `/yonetim/danisan-profili?clientId=${client.id}&modal=not-ekle` as Route;
  const appointmentModalHref =
    `/yonetim/danisan-profili?clientId=${client.id}&modal=randevu-olustur` as Route;
  const appointmentsPageHref =
    `/yonetim/randevular?clientId=${client.id}&modal=randevu-olustur` as Route;
  const financePageHref = `/yonetim/odemeler?clientId=${client.id}` as Route;
  const planModalHref =
    `/yonetim/danisan-profili?clientId=${client.id}&modal=odeme-plani` as Route;

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: canReadAppointments,
        clientsRead: true,
        financeRead: canReadFinance,
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: hasPermission(
          session.user.roles,
          "technical-health:read",
        ),
      }}
      subtitle="Danışan için hızlı işlem ve operasyon özeti. İşlemler URL tabanlı modal olarak açılır."
      title={clientName}
    >
      <Link className="admin-back-link" href="/yonetim/danisanlar">
        ← Danışan listesine dön
      </Link>

      <section className="admin-panel" aria-labelledby="hizli-islemler">
        <div className="admin-panel-heading">
          <div>
            <h2 id="hizli-islemler">Hızlı işlemler</h2>
            <p>Danışanı açınca yapılacak temel işler modal üzerinden başlar.</p>
          </div>
          <span className="admin-count">URL modal</span>
        </div>
        <div className="finance-operation-grid finance-operation-grid--buttons">
          <Link href="/yonetim/danisanlar">Danışan listesi</Link>
          <Link href={noteModalHref} scroll={false}>
            Not ekle
          </Link>
          {canReadAppointments ? (
            <Link href={appointmentModalHref} scroll={false}>
              Randevu oluştur
            </Link>
          ) : null}
          {canReadFinance ? (
            <Link href={financePageHref}>Ödeme ekranı</Link>
          ) : null}
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <span>Durum</span>
          <strong>
            {clientStatusLabels[client.status as ClientStatusValue]}
          </strong>
          <small>{clientTypeLabels[client.type as ClientTypeValue]}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>İletişim</span>
          <strong>{client.phone ?? "Telefon yok"}</strong>
          <small>{client.email ?? "E-posta yok"}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Sıradaki randevu</span>
          <strong>
            {focusAppointment ? formatDate(focusAppointment.startsAt) : "Yok"}
          </strong>
          <small>
            {focusAppointment
              ? `${appointmentServiceName(focusAppointment)} · ${appointmentStatusLabel(focusAppointment.status)}`
              : "Randevu kaydı yok"}
          </small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Açık bakiye</span>
          <strong>
            {canReadFinance ? formatMoney(openBalanceMinor, financeCurrency) : "—"}
          </strong>
          <small>
            {activeFinancePlan
              ? `${activeFinancePlan.name} · ${remainingSessions} kalan seans`
              : activePlan
                ? activePlan.name
                : "Plan açılabilir"}
          </small>
        </article>
      </div>

      <section className="admin-panel" aria-labelledby="profil">
        <div className="admin-panel-heading">
          <div>
            <h2 id="profil">Profil</h2>
            <p>Klinik not veya sağlık detayı burada tutulmaz.</p>
          </div>
          <span className="admin-count">{client.id.slice(0, 8)}</span>
        </div>
        <ul className="admin-service-list">
          <li>
            <div>
              <strong>{clientName}</strong>
              <span>
                {client.preferredName
                  ? `Tercih edilen ad: ${client.preferredName}`
                  : "Tercih edilen ad yok"}
              </span>
            </div>
            <span>{client.birthYear ?? "Doğum yılı yok"}</span>
          </li>
          <li>
            <div>
              <strong>İletişim</strong>
              <span>{client.phone ?? "Telefon yok"}</span>
            </div>
            <span>{client.email ?? "E-posta yok"}</span>
          </li>
          <li>
            <div>
              <strong>Veli / sorumlu</strong>
              <span>
                {primaryGuardian
                  ? `${primaryGuardian.guardian.firstName} ${primaryGuardian.guardian.lastName}`
                  : client.type === "CHILD"
                    ? "Veli bilgisi eksik"
                    : "Yetişkin danışan"}
              </span>
            </div>
            <span>{primaryGuardian?.guardian.phone ?? "—"}</span>
          </li>
        </ul>
      </section>

      <section className="admin-panel" aria-labelledby="randevular">
        <div className="admin-panel-heading">
          <div>
            <h2 id="randevular">Randevular</h2>
            <p>Yaklaşan randevular ve geçmiş randevu kayıtları gerçek veriden gelir.</p>
          </div>
          {canReadAppointments ? (
            <Link
              className="primary-button admin-dashboard-clients-cta"
              href={appointmentsPageHref}
              scroll={false}
            >
              Randevu oluştur
            </Link>
          ) : null}
        </div>

        {canReadAppointments ? (
          <div className={styles.dashboardLayout}>
            <section className={styles.compactPanel} aria-labelledby="yaklasan-randevular">
              <div className={styles.panelHeader}>
                <div>
                  <h2 id="yaklasan-randevular">Yaklaşan randevular</h2>
                  <p>Bu danışan için bekleyen ve onaylı gelecek kayıtlar.</p>
                </div>
                <span className={styles.panelBadge}>{upcomingAppointments.length} kayıt</span>
              </div>
              <AppointmentList
                appointments={upcomingAppointments}
                emptyDescription="Randevu oluşturulduğunda bu alanda görünecek."
                emptyTitle="Yaklaşan randevu yok"
                timeZone={environment.BUSINESS_TIME_ZONE}
              />
            </section>

            <section className={styles.compactPanel} aria-labelledby="randevu-gecmisi">
              <div className={styles.panelHeader}>
                <div>
                  <h2 id="randevu-gecmisi">Randevu geçmişi</h2>
                  <p>Son tamamlanan, iptal edilen veya geçmiş tarihli kayıtlar.</p>
                </div>
                <span className={styles.panelBadge}>{appointmentHistory.length} kayıt</span>
              </div>
              <AppointmentList
                appointments={appointmentHistory}
                emptyDescription="Geçmiş randevu oluştuğunda burada listelenecek."
                emptyTitle="Randevu geçmişi yok"
                timeZone={environment.BUSINESS_TIME_ZONE}
              />
            </section>
          </div>
        ) : (
          <div className="admin-empty-state">
            <strong>Randevu yetkisi yok</strong>
            <span>Bu danışanın randevu kayıtlarını görmek için randevu okuma yetkisi gerekir.</span>
          </div>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="finans">
        <div className="admin-panel-heading">
          <div>
            <h2 id="finans">Ödeme ve planlar</h2>
            <p>Bu danışanın plan, açık bakiye, kalan seans ve son finans hareketleri.</p>
          </div>
          {canReadFinance ? (
            <Link
              className="primary-button admin-dashboard-clients-cta"
              href={financePageHref}
            >
              Ödeme ekranını aç
            </Link>
          ) : null}
        </div>

        {canReadFinance ? (
          <>
            <div className={styles.dashboardGrid}>
              <article className={styles.dashboardCard}>
                <span>Plan toplamı</span>
                <strong>{formatMoney(totalPlanMinor, financeCurrency)}</strong>
                <small>{financePlans.length} plan kaydı</small>
              </article>
              <article className={styles.dashboardCard}>
                <span>Alınan ödeme</span>
                <strong>{formatMoney(paidMinor, financeCurrency)}</strong>
                <small>Plan bakiyesine göre hesaplanır</small>
              </article>
              <article className={styles.dashboardCard}>
                <span>Açık bakiye</span>
                <strong>{formatMoney(openBalanceMinor, financeCurrency)}</strong>
                <small>Ödeme ekranındaki bakiye ile aynı hesap</small>
              </article>
              <article className={styles.dashboardCard}>
                <span>Kalan seans</span>
                <strong>{remainingSessions}</strong>
                <small>Aktif ve geçmiş plan hareketleri dahil</small>
              </article>
            </div>

            <div className={styles.dashboardLayout}>
              <section className={styles.compactPanel} aria-labelledby="danisan-planlari">
                <div className={styles.panelHeader}>
                  <div>
                    <h2 id="danisan-planlari">Danışan planları</h2>
                    <p>Plan tutarı, açık bakiye, taksit ve fatura durumu.</p>
                  </div>
                  <span className={styles.panelBadge}>{financePlans.length} plan</span>
                </div>
                <FinancePlanList plans={financePlans} />
              </section>

              <section className={styles.compactPanel} aria-labelledby="son-finans-hareketleri">
                <div className={styles.panelHeader}>
                  <div>
                    <h2 id="son-finans-hareketleri">Son finans hareketleri</h2>
                    <p>Plan borcu, ödeme, iade ve ters kayıt hareketleri.</p>
                  </div>
                  <span className={styles.panelBadge}>{recentFinanceEntries.length} kayıt</span>
                </div>
                <FinanceEntryList entries={recentFinanceEntries} />
              </section>
            </div>
          </>
        ) : (
          <div className="admin-empty-state">
            <strong>Finans yetkisi yok</strong>
            <span>Bu danışanın ödeme ve plan kayıtlarını görmek için finans okuma yetkisi gerekir.</span>
          </div>
        )}
      </section>

      <ClientProfileUrlModals
        activeModal={activeModal}
        canReadAppointments={canReadAppointments}
        canReadFinance={canReadFinance}
        clientId={client.id}
        clientName={clientName}
      />
    </AdminShell>
  );
}
