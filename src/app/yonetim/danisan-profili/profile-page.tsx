import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import styles from "@/components/admin/admin-shell.module.css";
import { ClientProfileManagementModals } from "@/components/admin/client-profile-management-modals";
import { ClientProfileUrlModals } from "@/components/admin/client-profile-url-modals";
import { hasPermission } from "@/domain/auth/permissions";
import {
  buildClientProfileFinanceSummary,
  buildClientProfileOperationStatus,
} from "@/domain/clients/client-profile-summary";
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
import { formatMinorCurrency } from "@/lib/finance/currency-summary";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ProfileAppointment = Readonly<{
  endsAt: Date;
  id: string;
  locationTypeSnapshot: "HYBRID" | "IN_PERSON" | "ONLINE";
  practitioner: Readonly<{ displayName: string }>;
  publicReference: string;
  service: Readonly<{ name: string }> | null;
  serviceNameSnapshot: string;
  startsAt: Date;
  status: string;
}>;

type ProfileFinanceEntry = Readonly<{
  amountMinor: bigint;
  currency: string;
  id: string;
  note: string | null;
  occurredAt: Date;
  paymentMethod: Readonly<{ name: string }> | null;
  plan: Readonly<{ name: string }> | null;
  type: string;
}>;

type ProfileNote = Readonly<{
  category: string;
  createdAt: Date;
  id: string;
  note: string;
}>;

type FinancePlanSummary = Readonly<{
  balanceMinor: string;
  currency: string;
  id: string;
  installments: readonly Readonly<{ id: string; state: string }>[];
  invoiceStatus: string;
  name: string;
  remainingSessions: string;
  status: string;
  totalAmountMinor: string;
}>;

type OperationEvent = Readonly<{
  badge: string;
  description: string;
  href?: Route;
  id: string;
  occurredAt: Date;
  title: string;
}>;

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

const planStatusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  CANCELLED: "İptal",
  COMPLETED: "Tamamlandı",
  EXPIRED: "Süresi doldu",
};

const consentStatusLabels: Record<string, string> = {
  EXPIRED: "Süresi doldu",
  GRANTED: "Onay verildi",
  WITHDRAWN: "Geri çekildi",
};

function singleParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
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

function appointmentRange(appointment: ProfileAppointment, timeZone: string): string {
  const start = formatDateTime(appointment.startsAt, timeZone);
  const end = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(appointment.endsAt);
  return `${start} - ${end}`;
}

function appointmentStatus(status: string): string {
  return appointmentStatusLabels[status] ?? status;
}

function appointmentService(appointment: ProfileAppointment): string {
  return appointment.serviceNameSnapshot || appointment.service?.name || "Hizmet";
}

function financeType(type: string): string {
  return financeEntryTypeLabels[type] ?? type;
}

function positiveMoney(amountMinor: bigint, currency: string): string {
  return formatMinorCurrency(amountMinor < 0n ? -amountMinor : amountMinor, currency);
}

function AppointmentList({
  appointments,
  emptyTitle,
  timeZone,
}: {
  appointments: readonly ProfileAppointment[];
  emptyTitle: string;
  timeZone: string;
}) {
  if (appointments.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>{emptyTitle}</strong>
        <span>Yeni kayıt oluştuğunda burada listelenecek.</span>
      </div>
    );
  }
  return (
    <ul className="admin-client-list admin-dashboard-client-list">
      {appointments.map((appointment) => (
        <li className="admin-client-list-item admin-dashboard-client-card" key={appointment.id}>
          <div className="admin-client-list-main">
            <strong>{appointmentService(appointment)}</strong>
            <span className="admin-client-contact">{appointmentRange(appointment, timeZone)}</span>
            <span className="admin-client-meta">
              <em>{appointmentStatus(appointment.status)}</em>
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
        <span>Ödeme planı oluşturulduğunda burada görünür.</span>
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
              {formatMinorCurrency(BigInt(plan.totalAmountMinor), plan.currency)} toplam ·{" "}
              {plan.remainingSessions} kalan seans
            </span>
            <span className="admin-client-meta">
              <em>{planStatusLabels[plan.status] ?? plan.status}</em>
              <em>{formatMinorCurrency(BigInt(plan.balanceMinor), plan.currency)} açık bakiye</em>
              <em>{plan.installments.length} taksit</em>
              <em>{invoiceStatusLabels[plan.invoiceStatus] ?? plan.invoiceStatus}</em>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function FinanceEntryList({ entries }: { entries: readonly ProfileFinanceEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>Finans hareketi yok</strong>
        <span>Ödeme veya plan hareketi kaydedildiğinde burada görünür.</span>
      </div>
    );
  }
  return (
    <ul className="admin-client-list admin-dashboard-client-list">
      {entries.map((entry) => (
        <li className="admin-client-list-item admin-dashboard-client-card" key={entry.id}>
          <div className="admin-client-list-main">
            <strong>{financeType(entry.type)}</strong>
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
  events: readonly OperationEvent[];
  timeZone: string;
}) {
  if (events.length === 0) {
    return (
      <div className="admin-empty-state">
        <strong>Görülebilir operasyon hareketi yok</strong>
        <span>Yetkili olduğunuz randevu, finans veya yönetim notları burada görünür.</span>
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
            <Link className="admin-client-profile-link" href={event.href}>
              Detay
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function buildOperationEvents(input: {
  appointments: readonly ProfileAppointment[];
  financeEntries: readonly ProfileFinanceEntry[];
  financePageHref: Route;
  notes: readonly ProfileNote[];
}): OperationEvent[] {
  const appointmentEvents: OperationEvent[] = input.appointments.map((appointment) => ({
    badge: appointmentStatus(appointment.status),
    description: `${appointmentService(appointment)} · ${appointment.publicReference}`,
    id: `appointment-${appointment.id}`,
    occurredAt: appointment.startsAt,
    title: appointment.startsAt >= new Date() ? "Yaklaşan randevu" : "Randevu kaydı",
  }));
  const financeEvents: OperationEvent[] = input.financeEntries.map((entry) => ({
    badge: financeType(entry.type),
    description: `${positiveMoney(entry.amountMinor, entry.currency)} · ${entry.plan?.name ?? "Plansız hareket"}`,
    href: input.financePageHref,
    id: `finance-${entry.id}`,
    occurredAt: entry.occurredAt,
    title: entry.type === "PAYMENT" ? "Ödeme alındı" : financeType(entry.type),
  }));
  const noteEvents: OperationEvent[] = input.notes.map((note) => ({
    badge: note.category === "PAYMENT" ? "Ödeme notu" : "Yönetim notu",
    description: note.note,
    id: `note-${note.id}`,
    occurredAt: note.createdAt,
    title: "Operasyon notu eklendi",
  }));
  return [...appointmentEvents, ...financeEvents, ...noteEvents]
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
    .slice(0, 10);
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

  const database = getDatabase();
  const environment = getServerEnvironment();
  const timeZone = environment.BUSINESS_TIME_ZONE;
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canManageClients = hasPermission(session.user.roles, "clients:manage");
  const canManageConsents = hasPermission(session.user.roles, "consents:manage");
  const canReadConsents = hasPermission(session.user.roles, "consents:read");
  const canReadAppointments = hasPermission(session.user.roles, "appointments:read");
  const canManageAppointments = hasPermission(session.user.roles, "appointments:manage");

  const client = await database.client.findUnique({
    include: {
      guardians: {
        include: {
          guardian: {
            select: { email: true, firstName: true, id: true, lastName: true, phone: true },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { guardian: { lastName: "asc" } }],
      },
    },
    where: { id: clientId },
  });
  if (!client) notFound();

  const now = new Date();
  const [
    clientConsents,
    consentCount,
    allGuardians,
    consentDocuments,
    upcomingAppointments,
    appointmentHistory,
    financeOverview,
    recentFinanceEntries,
    recentNotes,
  ] = await Promise.all([
    canReadConsents
      ? database.consent.findMany({
          orderBy: [{ capturedAt: "desc" }],
          select: {
            capturedAt: true,
            document: { select: { publicTitle: true, type: true, version: true } },
            id: true,
            status: true,
          },
          take: 5,
          where: { clientId: client.id },
        })
      : Promise.resolve([]),
    canReadConsents
      ? database.consent.count({ where: { clientId: client.id } })
      : Promise.resolve(0),
    canManageClients
      ? database.guardian.findMany({
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: { email: true, firstName: true, id: true, lastName: true, phone: true },
          take: 250,
        })
      : Promise.resolve([]),
    canManageConsents
      ? database.consentDocument.findMany({
          orderBy: [{ effectiveFrom: "desc" }],
          select: { id: true, publicTitle: true, type: true, version: true },
          where: { effectiveFrom: { lte: now }, retiredAt: null },
        })
      : Promise.resolve([]),
    canReadAppointments
      ? database.appointment.findMany({
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
        })
      : Promise.resolve([]),
    canReadAppointments
      ? database.appointment.findMany({
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
        })
      : Promise.resolve([]),
    canReadFinance
      ? getFilteredFinanceOverview({ clientId: client.id, status: "ALL" })
      : Promise.resolve(null),
    canReadFinance
      ? database.financeLedgerEntry.findMany({
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
        })
      : Promise.resolve([]),
    database.clientNote.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: { category: true, createdAt: true, id: true, note: true },
      take: 6,
      where: { clientId: client.id },
    }),
  ]);

  const financePlans = (financeOverview?.plans ?? []) as FinancePlanSummary[];
  const financeSummary = buildClientProfileFinanceSummary(financePlans);
  const focusAppointment = upcomingAppointments[0] ?? appointmentHistory[0] ?? null;
  const lastPayment = recentFinanceEntries.find((entry) => entry.type === "PAYMENT") ?? null;
  const primaryGuardian = client.guardians[0] ?? null;
  const operationStatus = buildClientProfileOperationStatus({
    canReadAppointments,
    canReadFinance,
    clientType: client.type,
    hasAppointment: Boolean(focusAppointment),
    hasGuardian: Boolean(primaryGuardian),
    hasOpenBalance: financeSummary.hasOpenBalance,
    openBalanceLabel: financeSummary.openBalanceLabel,
  });
  const clientName = `${client.firstName} ${client.lastName}`;
  const appointmentsPageHref =
    `/yonetim/randevular?clientId=${client.id}&modal=randevu-olustur` as Route;
  const financePageHref = `/yonetim/odemeler?clientId=${client.id}` as Route;
  const operationEvents = buildOperationEvents({
    appointments: [...upcomingAppointments, ...appointmentHistory],
    financeEntries: recentFinanceEntries,
    financePageHref,
    notes: recentNotes,
  });

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: canReadAppointments,
        clientsRead: true,
        financeRead: canReadFinance,
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
      }}
      subtitle="Danışan profili, görülebilir randevu, ödeme ve operasyon hareketlerini tek ekranda toplar."
      title={clientName}
    >
      <Link className="admin-back-link" href="/yonetim/danisanlar">
        ← Danışan listesine dön
      </Link>

      <section className="admin-panel" aria-labelledby="hizli-islemler">
        <div className="admin-panel-heading">
          <div>
            <h2 id="hizli-islemler">Hızlı işlemler</h2>
            <p>Yalnızca rolün yetkili olduğu işlemler gösterilir.</p>
          </div>
          <span className="admin-count">Operasyon</span>
        </div>
        <div className="finance-operation-grid finance-operation-grid--buttons">
          {canManageAppointments ? <Link href={appointmentsPageHref}>Randevu oluştur</Link> : null}
          {canReadFinance ? <Link href={financePageHref}>Ödeme ekranı</Link> : null}
          {canManageClients ? (
            <Link href={`/yonetim/danisan-profili?clientId=${client.id}&modal=not-ekle` as Route}>
              Not ekle
            </Link>
          ) : null}
          {canManageClients ? (
            <Link
              href={`/yonetim/danisan-profili?clientId=${client.id}&modal=profili-duzenle` as Route}
            >
              Profili düzenle
            </Link>
          ) : null}
          {canManageClients ? (
            <Link
              href={`/yonetim/danisan-profili?clientId=${client.id}&modal=veli-yonetimi` as Route}
            >
              Veli yönetimi
            </Link>
          ) : null}
          {canManageConsents ? (
            <Link
              href={`/yonetim/danisan-profili?clientId=${client.id}&modal=onay-yonetimi` as Route}
            >
              KVKK / onay yönetimi
            </Link>
          ) : null}
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <span>Profil durumu</span>
          <strong>{clientStatusLabels[client.status as ClientStatusValue]}</strong>
          <small>{clientTypeLabels[client.type as ClientTypeValue]}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Operasyon uyarısı</span>
          <strong>{operationStatus.title}</strong>
          <small>{operationStatus.detail}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Sıradaki randevu</span>
          <strong>
            {canReadAppointments
              ? focusAppointment
                ? formatDate(focusAppointment.startsAt)
                : "Yok"
              : "—"}
          </strong>
          <small>
            {!canReadAppointments
              ? "Randevu yetkisi gerekir"
              : focusAppointment
                ? `${appointmentService(focusAppointment)} · ${appointmentStatus(focusAppointment.status)}`
                : "Randevu kaydı yok"}
          </small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Açık bakiye</span>
          <strong>{canReadFinance ? financeSummary.openBalanceLabel : "—"}</strong>
          <small>
            {canReadFinance ? `${financePlans.length} plan üzerinden` : "Finans yetkisi gerekir"}
          </small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Kalan seans</span>
          <strong>{canReadFinance ? financeSummary.remainingSessions : "—"}</strong>
          <small>
            {canReadFinance ? "Tüm para birimlerindeki planlar" : "Finans yetkisi gerekir"}
          </small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Son ödeme</span>
          <strong>
            {canReadFinance
              ? lastPayment
                ? positiveMoney(lastPayment.amountMinor, lastPayment.currency)
                : "Yok"
              : "—"}
          </strong>
          <small>
            {canReadFinance
              ? lastPayment
                ? formatDate(lastPayment.occurredAt)
                : "Ödeme hareketi yok"
              : "Finans yetkisi gerekir"}
          </small>
        </article>
      </div>

      <section className="admin-panel" aria-labelledby="operasyon-akisi">
        <div className="admin-panel-heading">
          <div>
            <h2 id="operasyon-akisi">Operasyon akışı</h2>
            <p>Yetkili olunan randevu, finans ve yönetim notları en yeniden eskiye görünür.</p>
          </div>
          <span className="admin-count">{operationEvents.length} hareket</span>
        </div>
        <OperationFlow events={operationEvents} timeZone={timeZone} />
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
            <p>Danışana bağlı ilişkiler.</p>
          </div>
          <span className="admin-count">{client.guardians.length} veli</span>
        </div>
        {client.guardians.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Veli kaydı yok</strong>
            <span>
              {client.type === "CHILD"
                ? "Bu çocuk danışan için veli kaydı bekleniyor."
                : "Yetişkin danışan için zorunlu değildir."}
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
                  {relation.guardian.phone} · {relation.guardian.email ?? "E-posta yok"}
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
            <p>Son onay kayıtları.</p>
          </div>
          <span className="admin-count">
            {canReadConsents ? `${consentCount} kayıt` : "Yetki gerekli"}
          </span>
        </div>
        {canReadConsents ? (
          clientConsents.length === 0 ? (
            <div className="admin-empty-state">
              <strong>Onay kaydı yok</strong>
              <span>Henüz onay kaydı oluşturulmamış.</span>
            </div>
          ) : (
            <ul className="admin-service-list">
              {clientConsents.map((consent) => (
                <li key={consent.id}>
                  <div>
                    <strong>{consent.document.publicTitle ?? consent.document.type}</strong>
                    <span>Belge versiyonu {consent.document.version}</span>
                  </div>
                  <span>
                    {consentStatusLabels[consent.status] ?? consent.status} ·{" "}
                    {formatDateTime(consent.capturedAt, timeZone)}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="admin-empty-state">
            <strong>Onay kayıtları için yetki gerekli</strong>
            <span>Bu bölüm onay okuma yetkisi ister.</span>
          </div>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="randevular">
        <div className="admin-panel-heading">
          <div>
            <h2 id="randevular">Randevular</h2>
            <p>Yaklaşan ve geçmiş kayıtlar.</p>
          </div>
          {canManageAppointments ? (
            <Link className="primary-button" href={appointmentsPageHref}>
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
                </div>
                <span className={styles.panelBadge}>{upcomingAppointments.length}</span>
              </div>
              <AppointmentList
                appointments={upcomingAppointments}
                emptyTitle="Yaklaşan randevu yok"
                timeZone={timeZone}
              />
            </section>
            <section className={styles.compactPanel} aria-labelledby="randevu-gecmisi">
              <div className={styles.panelHeader}>
                <div>
                  <h2 id="randevu-gecmisi">Randevu geçmişi</h2>
                </div>
                <span className={styles.panelBadge}>{appointmentHistory.length}</span>
              </div>
              <AppointmentList
                appointments={appointmentHistory}
                emptyTitle="Randevu geçmişi yok"
                timeZone={timeZone}
              />
            </section>
          </div>
        ) : (
          <div className="admin-empty-state">
            <strong>Randevu yetkisi yok</strong>
            <span>Bu kayıtları görmek için randevu okuma yetkisi gerekir.</span>
          </div>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="finans">
        <div className="admin-panel-heading">
          <div>
            <h2 id="finans">Ödeme ve planlar</h2>
            <p>Para birimleri birbirine eklenmeden gösterilir.</p>
          </div>
          {canReadFinance ? (
            <Link className="primary-button" href={financePageHref}>
              Ödeme ekranını aç
            </Link>
          ) : null}
        </div>
        {canReadFinance ? (
          <>
            <div className={styles.dashboardGrid}>
              <article className={styles.dashboardCard}>
                <span>Plan toplamı</span>
                <strong>{financeSummary.planTotalLabel}</strong>
                <small>{financePlans.length} plan</small>
              </article>
              <article className={styles.dashboardCard}>
                <span>Alınan ödeme</span>
                <strong>{financeSummary.paidLabel}</strong>
                <small>Plan bakiyelerine göre</small>
              </article>
              <article className={styles.dashboardCard}>
                <span>Açık bakiye</span>
                <strong>{financeSummary.openBalanceLabel}</strong>
                <small>Para birimi bazında</small>
              </article>
              <article className={styles.dashboardCard}>
                <span>Kalan seans</span>
                <strong>{financeSummary.remainingSessions}</strong>
                <small>Tüm planlar</small>
              </article>
            </div>
            <div className={styles.dashboardLayout}>
              <section className={styles.compactPanel} aria-labelledby="danisan-planlari">
                <div className={styles.panelHeader}>
                  <div>
                    <h2 id="danisan-planlari">Danışan planları</h2>
                  </div>
                  <span className={styles.panelBadge}>{financePlans.length}</span>
                </div>
                <FinancePlanList plans={financePlans} />
              </section>
              <section className={styles.compactPanel} aria-labelledby="son-finans-hareketleri">
                <div className={styles.panelHeader}>
                  <div>
                    <h2 id="son-finans-hareketleri">Son finans hareketleri</h2>
                  </div>
                  <span className={styles.panelBadge}>{recentFinanceEntries.length}</span>
                </div>
                <FinanceEntryList entries={recentFinanceEntries} />
              </section>
            </div>
          </>
        ) : (
          <div className="admin-empty-state">
            <strong>Finans yetkisi yok</strong>
            <span>Ödeme ve plan kayıtları için finans okuma yetkisi gerekir.</span>
          </div>
        )}
      </section>

      {canManageClients || canManageConsents ? (
        <ClientProfileManagementModals
          activeModal={activeModal}
          allGuardians={allGuardians}
          canManageClients={canManageClients}
          canManageConsents={canManageConsents}
          client={client}
          consentDocuments={consentDocuments}
          consents={clientConsents}
          relations={client.guardians}
        />
      ) : null}
      <ClientProfileUrlModals
        activeModal={activeModal}
        clientId={client.id}
        clientName={clientName}
      />
    </AdminShell>
  );
}
