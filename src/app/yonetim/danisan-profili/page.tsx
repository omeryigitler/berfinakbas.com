import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import styles from "@/components/admin/admin-shell.module.css";
import { ClientProfileManagementModals } from "@/components/admin/client-profile-management-modals";
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

type OperationEvent = {
  badge: string;
  description: string;
  href?: Route;
  id: string;
  occurredAt: Date;
  title: string;
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
  REVERSAL: "Dengeleyici kayıt",
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

const consentStatusLabels = {
  EXPIRED: "Süresi doldu",
  GRANTED: "Onay verildi",
  WITHDRAWN: "Geri çekildi",
} as const;

function consentStatusLabel(status: string): string {
  return consentStatusLabels[status as keyof typeof consentStatusLabels] ?? status;
}

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

function formatDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
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

function buildOperationEvents({
  appointments,
  financeEntries,
  financePageHref,
}: {
  appointments: ProfileAppointment[];
  financeEntries: ProfileFinanceEntry[];
  financePageHref: Route;
}): OperationEvent[] {
  const appointmentEvents = appointments.map((appointment) => ({
    badge: appointmentStatusLabel(appointment.status),
    description: `${appointmentServiceName(appointment)} · ${locationLabels[appointment.locationTypeSnapshot]} · ${appointment.publicReference}`,
    id: `appointment-${appointment.id}`,
    occurredAt: appointment.startsAt,
    title: appointment.startsAt >= new Date() ? "Yaklaşan randevu" : "Randevu kaydı",
  }));

  const financeEvents = financeEntries.map((entry) => ({
    badge: financeEntryTypeLabel(entry.type),
    description: `${positiveMoney(entry.amountMinor, entry.currency)} · ${entry.plan?.name ?? "Plansız hareket"}`,
    href: financePageHref,
    id: `finance-${entry.id}`,
    occurredAt: entry.occurredAt,
    title: entry.type === "PAYMENT" ? "Ödeme alındı" : financeEntryTypeLabel(entry.type),
  }));

  return [...appointmentEvents, ...financeEvents]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 8);
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

function OperationFlow({
  events,
  timeZone,
}: {
  events: OperationEvent[];
  timeZone: string;
}) {
  if (events.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>Operasyon hareketi yok</strong>
        <span>Randevu, ödeme veya plan hareketi oluştuğunda burada kronolojik görünecek.</span>
      </div>
    );
  }

  return (
    <ul className="admin-client-list admin-dashboard-client-list">
      {events.map((event) => (
        <li className="admin-client-list-item admin-dashboard-client-card" key={event.id}>
          <div className="admin-client-list-main">
            <strong>{event.title}</strong>
            <span className="admin-client-contact">
              {formatDateTime(event.occurredAt, timeZone)} · {event.description}
            </span>
            <span className="admin-client-meta">
              <em>{event.badge}</em>
            </span>
          </div>
          {event.href ? (
            <Link className="admin-client-profile-link admin-dashboard-client-action" href={event.href}>
              Detay
            </Link>
          ) : null}
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
  if (clientId === "yeni") redirect("/yonetim/danisan-olustur");

  const environment = getServerEnvironment();
  const database = getDatabase();
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canManageClients = hasPermission(session.user.roles, "clients:manage");
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
      consents: {
        orderBy: [{ capturedAt: "desc" }],
        select: {
          capturedAt: true,
          document: { select: { publicTitle: true, type: true, version: true } },
          id: true,
          status: true,
        },
        take: 5,
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
        orderBy: [{ isPrimary: "desc" }, { guardian: { lastName: "asc" } }],
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

  const allGuardians = canManageClients
    ? await database.guardian.findMany({
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: { email: true, firstName: true, id: true, lastName: true, phone: true },
        take: 250,
      })
    : [];

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
  const lastPayment = recentFinanceEntries.find((entry) => entry.type === "PAYMENT") ?? null;
  const clientName = `${client.firstName} ${client.lastName}`;
  const activePlan = client.plans.find((plan) => plan.status === "ACTIVE");
  const primaryGuardian = client.guardians[0];
  const noteModalHref =
    `/yonetim/danisan-profili?clientId=${client.id}&modal=not-ekle` as Route;
  const appointmentsPageHref =
    `/yonetim/randevular?clientId=${client.id}&modal=randevu-olustur` as Route;
  const financePageHref = `/yonetim/odemeler?clientId=${client.id}` as Route;
  const operationAlert =
    client.type === "CHILD" && !primaryGuardian
      ? "Veli eksik"
      : openBalanceMinor > 0n
        ? "Açık bakiye var"
        : !focusAppointment
          ? "Randevu yok"
          : "Takip temiz";
  const operationAlertDetail =
    client.type === "CHILD" && !primaryGuardian
      ? "Çocuk danışan için veli bilgisi bağlanmalı"
      : openBalanceMinor > 0n
        ? formatMoney(openBalanceMinor, financeCurrency)
        : !focusAppointment
          ? "Yeni randevu oluşturulabilir"
          : "Randevu ve finans akışı izleniyor";
  const operationEvents = buildOperationEvents({
    appointments: [...upcomingAppointments, ...appointmentHistory],
    financeEntries: recentFinanceEntries,
    financePageHref,
  });

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
      subtitle="Danışan için hızlı işlem, randevu, ödeme ve operasyon akışı tek ekranda görünür."
      title={clientName}
    >
      <Link className="admin-back-link" href="/yonetim/danisanlar">
        ← Danışan listesine dön
      </Link>

      <section className="admin-panel" aria-labelledby="hizli-islemler">
        <div className="admin-panel-heading">
          <div>
            <h2 id="hizli-islemler">Hızlı işlemler</h2>
            <p>En sık kullanılan danışan işlemleri; randevu ve ödeme ekranı seçili danışanla açılır.</p>
          </div>
          <span className="admin-count">Operasyon</span>
        </div>
        <div className="finance-operation-grid finance-operation-grid--buttons">
          {canReadAppointments ? (
            <Link href={appointmentsPageHref} scroll={false}>
              Randevu oluştur
            </Link>
          ) : null}
          {canReadFinance ? <Link href={financePageHref}>Ödeme ekranı</Link> : null}
          {canManageClients ? (
            <Link href={noteModalHref} scroll={false}>
              Not ekle
            </Link>
          ) : null}
          {canManageClients ? (
            <Link
              href={`/yonetim/danisan-profili?clientId=${client.id}&modal=profili-duzenle` as Route}
              scroll={false}
            >
              Profili düzenle
            </Link>
          ) : null}
          {canManageClients ? (
            <Link
              href={`/yonetim/danisan-profili?clientId=${client.id}&modal=veli-yonetimi` as Route}
              scroll={false}
            >
              Veli yönetimi
            </Link>
          ) : null}
                    <Link href="/yonetim/danisanlar">Danışan listesi</Link>
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <span>Profil durumu</span>
          <strong>
            {clientStatusLabels[client.status as ClientStatusValue]}
          </strong>
          <small>{clientTypeLabels[client.type as ClientTypeValue]}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Operasyon uyarısı</span>
          <strong>{operationAlert}</strong>
          <small>{operationAlertDetail}</small>
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
        <article className={styles.dashboardCard}>
          <span>Kalan seans</span>
          <strong>{canReadFinance ? remainingSessions : "—"}</strong>
          <small>{financePlans.length} plan üzerinden</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Son ödeme</span>
          <strong>
            {lastPayment ? positiveMoney(lastPayment.amountMinor, lastPayment.currency) : "Yok"}
          </strong>
          <small>{lastPayment ? formatDate(lastPayment.occurredAt) : "Ödeme hareketi yok"}</small>
        </article>
      </div>

      <section className="admin-panel" aria-labelledby="operasyon-akisi">
        <div className="admin-panel-heading">
          <div>
            <h2 id="operasyon-akisi">Operasyon akışı</h2>
            <p>Bu danışanın randevu ve finans hareketleri en yeniden eskiye tek akışta görünür.</p>
          </div>
          <span className="admin-count">{operationEvents.length} hareket</span>
        </div>
        <OperationFlow events={operationEvents} timeZone={environment.BUSINESS_TIME_ZONE} />
      </section>

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
        </ul>
      </section>

      <section className="admin-panel" aria-labelledby="veli-bilgileri">
        <div className="admin-panel-heading">
          <div>
            <h2 id="veli-bilgileri">Veli / sorumlu bilgileri</h2>
            <p>Danışana bağlı birincil ve ek veli ilişkilerinin tamamı.</p>
          </div>
          <span className="admin-count">{client.guardians.length} veli</span>
        </div>
        {client.guardians.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Veli kaydı yok</strong>
            <span>
              {client.type === "CHILD"
                ? "Bu çocuk danışan için veli kaydı bekleniyor."
                : "Yetişkin danışan için veli bilgisi zorunlu değildir."}
            </span>
          </div>
        ) : (
          <ul className="admin-service-list">
            {client.guardians.map((relation) => (
              <li key={relation.guardian.id}>
                <div>
                  <strong>
                    {relation.guardian.firstName} {relation.guardian.lastName}
                  </strong>
                  <span>
                    {relation.relationship} · {relation.isPrimary ? "Birincil veli" : "Ek veli"}
                  </span>
                </div>
                <span>
                  {relation.guardian.phone ?? "Telefon yok"} · {relation.guardian.email ?? "E-posta yok"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="kvkk-onaylari">
        <div className="admin-panel-heading">
          <div>
            <h2 id="kvkk-onaylari">KVKK / onay geçmişi</h2>
            <p>Son onay kayıtları ve kullanılan belge versiyonları.</p>
          </div>
          <span className="admin-count">{client._count.consents} kayıt</span>
        </div>
        {client.consents.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Onay kaydı yok</strong>
            <span>Danışana ait KVKK veya onay kaydı henüz oluşturulmamış.</span>
          </div>
        ) : (
          <ul className="admin-service-list">
            {client.consents.map((consent) => (
              <li key={consent.id}>
                <div>
                  <strong>{consent.document.publicTitle ?? consent.document.type}</strong>
                  <span>Belge versiyonu {consent.document.version}</span>
                </div>
                <span>
                  {consentStatusLabel(consent.status)} · {formatDateTime(consent.capturedAt, environment.BUSINESS_TIME_ZONE)}
                </span>
              </li>
            ))}
          </ul>
        )}
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
                    <p>Plan borcu, ödeme, iade ve dengeleyici kayıt hareketleri.</p>
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

      {canManageClients ? (
        <ClientProfileManagementModals
          activeModal={activeModal}
          allGuardians={allGuardians}
          client={client}
          relations={client.guardians}
        />
      ) : null}

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
