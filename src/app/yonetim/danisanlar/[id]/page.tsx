import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import styles from "@/components/admin/admin-shell.module.css";
import {
  clientStatusLabels,
  clientTypeLabels,
  type ClientStatusValue,
  type ClientTypeValue,
} from "@/domain/clients/client-management";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;

const appointmentStatusLabels = {
  CANCELLED_BY_CLIENT: "Danışan iptal etti",
  CANCELLED_BY_PRACTITIONER: "Uzman iptal etti",
  COMPLETED: "Tamamlandı",
  CONFIRMED: "Onaylandı",
  NO_SHOW: "Gelmedi",
  PENDING_REVIEW: "İncelemede",
  REJECTED: "Reddedildi",
  REQUESTED: "Talep alındı",
  RESCHEDULE_PROPOSED: "Yeni saat önerildi",
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
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
  return appointmentStatusLabels[status as keyof typeof appointmentStatusLabels] ?? status;
}

function planStatusLabel(status: string): string {
  return planStatusLabels[status as keyof typeof planStatusLabels] ?? status;
}

function consentStatusLabel(status: string): string {
  return consentStatusLabels[status as keyof typeof consentStatusLabels] ?? status;
}

export default async function AdminClientDetailPage({ params }: { params: PageParams }) {
  const session = await requirePermission("clients:read");
  const { id } = await params;
  const client = await getDatabase().client.findUnique({
    include: {
      _count: { select: { appointments: true, consents: true, financeEntries: true, plans: true } },
      appointments: {
        orderBy: [{ startsAt: "desc" }],
        select: {
          endsAt: true,
          id: true,
          service: { select: { name: true } },
          startsAt: true,
          status: true,
        },
        take: 3,
      },
      consents: {
        orderBy: [{ capturedAt: "desc" }],
        select: {
          capturedAt: true,
          document: { select: { publicTitle: true, type: true, version: true } },
          id: true,
          status: true,
        },
        take: 3,
      },
      guardians: {
        include: {
          guardian: { select: { email: true, firstName: true, id: true, lastName: true, phone: true } },
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
          validUntil: true,
        },
        take: 3,
      },
    },
    where: { id },
  });

  if (!client) notFound();

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: hasPermission(session.user.roles, "appointments:read"),
        clientsRead: true,
        financeRead: hasPermission(session.user.roles, "finance:read"),
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
      }}
      subtitle="Danışan profili; randevu, finans ve KVKK modüllerine bağlanacak merkez ekran olarak tasarlanmıştır."
      title={`${client.firstName} ${client.lastName}`}
    >
      <Link className="admin-back-link" href="/yonetim/danisanlar">
        ← Danışan listesine dön
      </Link>

      <div className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <span>Danışan tipi</span>
          <strong>{clientTypeLabels[client.type as ClientTypeValue]}</strong>
          <small>{clientStatusLabels[client.status as ClientStatusValue]}</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Randevu</span>
          <strong>{client._count.appointments}</strong>
          <small>Randevu modülü bağlantısı sonraki adımda genişletilecek.</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Finans</span>
          <strong>{client._count.plans}</strong>
          <small>Plan ve ödeme detayları sonraki PR’da danışana bağlanacak.</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>KVKK / Onay</span>
          <strong>{client._count.consents}</strong>
          <small>Onay geçmişi için özet alan; tam yönetim modülü değildir.</small>
        </article>
      </div>

      <section className="admin-panel" aria-labelledby="genel-ozet">
        <div className="admin-panel-heading">
          <div>
            <h2 id="genel-ozet">Genel özet</h2>
            <p>Klinik not ve sağlık detayı bu profilde tutulmaz.</p>
          </div>
          <span className="admin-count">{client.id.slice(0, 8)}</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-appointments-table">
            <tbody>
              <tr>
                <th scope="row">Ad soyad</th>
                <td>
                  {client.firstName} {client.lastName}
                </td>
              </tr>
              <tr>
                <th scope="row">Tercih edilen ad</th>
                <td>{client.preferredName ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row">Telefon</th>
                <td>{client.phone ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row">E-posta</th>
                <td>{client.email ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row">Doğum yılı</th>
                <td>{client.birthYear ?? "—"}</td>
              </tr>
              <tr>
                <th scope="row">Kayıt tarihi</th>
                <td>{formatDateTime(client.createdAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel" aria-labelledby="veli-bilgileri">
        <div className="admin-panel-heading">
          <div>
            <h2 id="veli-bilgileri">Veli bilgileri</h2>
            <p>Aynı veli birden fazla çocuk danışana bağlanabilir.</p>
          </div>
          <span className="admin-count">{client.guardians.length} veli</span>
        </div>
        {client.guardians.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Veli kaydı yok</strong>
            <span>{client.type === "CHILD" ? "Bu çocuk danışan için veli kaydı bekleniyor." : "Yetişkin danışan için veli bilgisi zorunlu değildir."}</span>
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

      <section className="admin-panel" aria-labelledby="randevu-ozeti">
        <div className="admin-panel-heading">
          <div>
            <h2 id="randevu-ozeti">Randevu özeti</h2>
            <p>Bu alan şimdilik placeholder’dır; detaylı randevu yönetimi ayrı modüle bağlı kalır.</p>
          </div>
          <span className="admin-count">PLACEHOLDER</span>
        </div>
        {client.appointments.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Randevu kaydı yok</strong>
            <span>İleride danışan bazlı randevu akışı buraya bağlanacak.</span>
          </div>
        ) : (
          <ul className="admin-service-list">
            {client.appointments.map((appointment) => (
              <li key={appointment.id}>
                <div>
                  <strong>{appointment.service.name}</strong>
                  <span>
                    {formatDateTime(appointment.startsAt)} – {formatDateTime(appointment.endsAt)}
                  </span>
                </div>
                <span>{appointmentStatusLabel(appointment.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="finans-ozeti">
        <div className="admin-panel-heading">
          <div>
            <h2 id="finans-ozeti">Finans özeti</h2>
            <p>Gerçek ödeme/plan yönetimi bu PR kapsamında değildir; burada yalnızca özet gösterilir.</p>
          </div>
          <span className="admin-count">{client._count.financeEntries} hareket</span>
        </div>
        {client.plans.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Plan kaydı yok</strong>
            <span>Ödeme ve plan ekranı sonraki PR’da danışan profiline bağlanacak.</span>
          </div>
        ) : (
          <ul className="admin-service-list">
            {client.plans.map((plan) => (
              <li key={plan.id}>
                <div>
                  <strong>{plan.name}</strong>
                  <span>
                    {plan.sessionCount} seans · {formatMoney(plan.totalAmountMinor, plan.currency)}
                  </span>
                </div>
                <span>
                  {planStatusLabel(plan.status)} · {formatDate(plan.validFrom)}
                  {plan.validUntil ? ` - ${formatDate(plan.validUntil)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel" aria-labelledby="kvkk-ozeti">
        <div className="admin-panel-heading">
          <div>
            <h2 id="kvkk-ozeti">KVKK / onay özeti</h2>
            <p>Bu alan yalnızca onay durumunu özetler; belge yönetimi veya klinik içerik içermez.</p>
          </div>
          <span className="admin-count">PLACEHOLDER</span>
        </div>
        {client.consents.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Onay kaydı yok</strong>
            <span>KVKK/onay modülü bağlandığında son durum burada görünür.</span>
          </div>
        ) : (
          <ul className="admin-service-list">
            {client.consents.map((consent) => (
              <li key={consent.id}>
                <div>
                  <strong>{consent.document.publicTitle ?? consent.document.type}</strong>
                  <span>Versiyon {consent.document.version}</span>
                </div>
                <span>
                  {consentStatusLabel(consent.status)} · {formatDateTime(consent.capturedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
