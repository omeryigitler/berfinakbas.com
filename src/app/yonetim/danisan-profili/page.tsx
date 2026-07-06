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

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

function formatMoney(amountMinor: bigint, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(amountMinor) / 100);
}

function planStatusLabel(status: string): string {
  return planStatusLabels[status as keyof typeof planStatusLabels] ?? status;
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

  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canReadAppointments = hasPermission(session.user.roles, "appointments:read");
  const client = await getDatabase().client.findUnique({
    include: {
      _count: {
        select: { appointments: true, consents: true, financeEntries: true, plans: true },
      },
      appointments: {
        orderBy: [{ startsAt: "desc" }],
        select: {
          id: true,
          service: { select: { name: true } },
          startsAt: true,
          status: true,
        },
        take: 3,
      },
      guardians: {
        include: {
          guardian: {
            select: { email: true, firstName: true, id: true, lastName: true, phone: true },
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

  const clientName = `${client.firstName} ${client.lastName}`;
  const activePlan = client.plans.find((plan) => plan.status === "ACTIVE");
  const latestAppointment = client.appointments[0];
  const primaryGuardian = client.guardians[0];
  const noteModalHref = `/yonetim/danisan-profili?clientId=${client.id}&modal=not-ekle` as Route;
  const appointmentModalHref =
    `/yonetim/danisan-profili?clientId=${client.id}&modal=randevu-olustur` as Route;
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
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
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
            <Link href={planModalHref} scroll={false}>
              Ödeme planı oluştur
            </Link>
          ) : null}
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <span>Durum</span>
          <strong>{clientStatusLabels[client.status as ClientStatusValue]}</strong>
          <small>{clientTypeLabels[client.type as ClientTypeValue]}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>İletişim</span>
          <strong>{client.phone ?? "Telefon yok"}</strong>
          <small>{client.email ?? "E-posta yok"}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Son randevu</span>
          <strong>{latestAppointment ? formatDate(latestAppointment.startsAt) : "Yok"}</strong>
          <small>{latestAppointment?.service.name ?? "Randevu kaydı yok"}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Aktif plan</span>
          <strong>{activePlan ? activePlan.name : "Yok"}</strong>
          <small>
            {activePlan
              ? formatMoney(activePlan.totalAmountMinor, activePlan.currency)
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
            <p>Son randevular ve randevu ekranına hızlı geçiş.</p>
          </div>
          {canReadAppointments ? (
            <Link className="secondary-button" href={appointmentModalHref} scroll={false}>
              Randevu oluştur
            </Link>
          ) : null}
        </div>
        {client.appointments.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Randevu kaydı yok</strong>
            <span>Randevu planlamak için randevu oluştur modalını açın.</span>
          </div>
        ) : (
          <ul className="admin-service-list">
            {client.appointments.map((appointment) => (
              <li key={appointment.id}>
                <div>
                  <strong>{appointment.service.name}</strong>
                  <span>{formatDate(appointment.startsAt)}</span>
                </div>
                <span>{appointment.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="finans">
        <div className="admin-panel-heading">
          <div>
            <h2 id="finans">Ödeme ve planlar</h2>
            <p>Bu danışanın ödeme ekranı filtreli açılır.</p>
          </div>
          {canReadFinance ? (
            <Link className="secondary-button" href={planModalHref} scroll={false}>
              Ödeme planı oluştur
            </Link>
          ) : null}
        </div>
        {client.plans.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Plan kaydı yok</strong>
            <span>Ödeme planı oluşturmak için modalı açın.</span>
          </div>
        ) : (
          <ul className="admin-service-list">
            {client.plans.map((plan) => (
              <li key={plan.id}>
                <div>
                  <strong>{plan.name}</strong>
                  <span>{`${plan.sessionCount} seans · ${formatMoney(
                    plan.totalAmountMinor,
                    plan.currency,
                  )}`}</span>
                </div>
                <span>{`${planStatusLabel(plan.status)} · ${formatDate(plan.validFrom)}`}</span>
              </li>
            ))}
          </ul>
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
