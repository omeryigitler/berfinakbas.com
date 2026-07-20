import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/Malta",
  }).format(value);
}

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") redirect("/giris");

  const canReadClients = hasPermission(session.user.roles, "clients:read");
  const canReadAppointments = hasPermission(session.user.roles, "appointments:read");
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const database = getDatabase();
  const now = new Date();

  const [totalClients, activeClients, pendingAppointments, upcomingAppointments, activePlans, latestClients] =
    await Promise.all([
      canReadClients ? database.client.count() : Promise.resolve(0),
      canReadClients ? database.client.count({ where: { status: "ACTIVE" } }) : Promise.resolve(0),
      canReadAppointments
        ? database.appointment.count({ where: { status: { in: ["REQUESTED", "PENDING_REVIEW"] } } })
        : Promise.resolve(0),
      canReadAppointments
        ? database.appointment.findMany({
            orderBy: { startsAt: "asc" },
            select: {
              client: { select: { firstName: true, lastName: true } },
              id: true,
              serviceNameSnapshot: true,
              startsAt: true,
              status: true,
            },
            take: 5,
            where: { startsAt: { gte: now } },
          })
        : Promise.resolve([]),
      canReadFinance
        ? database.clientPlan.count({ where: { status: "ACTIVE" } })
        : Promise.resolve(0),
      canReadClients
        ? database.client.findMany({
            orderBy: { createdAt: "desc" },
            select: { firstName: true, id: true, lastName: true, status: true, type: true },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <span style={styles.kicker}>GENEL BAKIŞ</span>
          <h1 style={styles.title}>Yönetim merkezi</h1>
          <p style={styles.subtitle}>Danışan, randevu ve ödeme akışının canlı özeti.</p>
        </div>
      </section>

      <section aria-label="Özet bilgiler" style={styles.summaryGrid}>
        <article style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Toplam danışan</span>
          <strong style={styles.summaryValue}>{canReadClients ? totalClients : "—"}</strong>
          <small style={styles.summaryMeta}>{activeClients} aktif kayıt</small>
        </article>
        <article style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Onay bekleyen</span>
          <strong style={styles.summaryValue}>{canReadAppointments ? pendingAppointments : "—"}</strong>
          <small style={styles.summaryMeta}>Randevu talebi veya inceleme</small>
        </article>
        <article style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Aktif plan</span>
          <strong style={styles.summaryValue}>{canReadFinance ? activePlans : "—"}</strong>
          <small style={styles.summaryMeta}>Devam eden ödeme planı</small>
        </article>
      </section>

      <section style={styles.columns}>
        <article style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Yaklaşan randevular</h2>
            <span style={styles.badge}>CANLI</span>
          </div>
          <div style={styles.list}>
            {upcomingAppointments.length === 0 ? (
              <p style={styles.empty}>Yaklaşan randevu bulunmuyor.</p>
            ) : (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} style={styles.row}>
                  <div style={styles.avatar}>
                    {(appointment.client.firstName[0] ?? "") + (appointment.client.lastName[0] ?? "")}
                  </div>
                  <div style={styles.rowText}>
                    <strong>{appointment.client.firstName} {appointment.client.lastName}</strong>
                    <span>{appointment.serviceNameSnapshot}</span>
                  </div>
                  <div style={styles.rowMeta}>
                    <strong>{formatDateTime(appointment.startsAt)}</strong>
                    <span>{appointmentStatusLabels[appointment.status] ?? appointment.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Son eklenen danışanlar</h2>
            <span style={styles.badge}>YENİ</span>
          </div>
          <div style={styles.list}>
            {latestClients.length === 0 ? (
              <p style={styles.empty}>Henüz danışan kaydı bulunmuyor.</p>
            ) : (
              latestClients.map((client) => (
                <div key={client.id} style={styles.row}>
                  <div style={styles.avatar}>
                    {(client.firstName[0] ?? "") + (client.lastName[0] ?? "")}
                  </div>
                  <div style={styles.rowText}>
                    <strong>{client.firstName} {client.lastName}</strong>
                    <span>{client.type === "CHILD" ? "Çocuk danışan" : "Yetişkin danışan"}</span>
                  </div>
                  <div style={styles.statusPill}>{client.status}</div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

const styles = {
  page: { display: "grid", gap: 18 },
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid rgba(50, 49, 48, 0.12)",
    borderRadius: 28,
    background: "linear-gradient(135deg, #ffffff 0%, #faf9f5 66%, #efffc3 100%)",
    padding: 24,
  },
  kicker: {
    display: "inline-flex",
    borderRadius: 999,
    background: "#050505",
    padding: "5px 9px",
    color: "#dfff65",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  title: { margin: "10px 0 4px", color: "#151413", fontSize: 28, letterSpacing: "-0.04em" },
  subtitle: { margin: 0, color: "#77727d", fontSize: 13 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 },
  summaryCard: {
    display: "grid",
    gap: 8,
    border: "1px solid rgba(50, 49, 48, 0.12)",
    borderRadius: 22,
    background: "#ffffff",
    padding: 20,
  },
  summaryLabel: { color: "#9692a0", fontSize: 10, fontWeight: 800, textTransform: "uppercase" },
  summaryValue: { color: "#151413", fontSize: 32, lineHeight: 1 },
  summaryMeta: { color: "#77727d", fontSize: 11 },
  columns: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 },
  panel: {
    minWidth: 0,
    border: "1px solid rgba(50, 49, 48, 0.12)",
    borderRadius: 24,
    background: "#ffffff",
    padding: 20,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid rgba(50, 49, 48, 0.08)",
    paddingBottom: 12,
  },
  panelTitle: { margin: 0, color: "#151413", fontSize: 15 },
  badge: {
    borderRadius: 999,
    background: "#efffc3",
    padding: "4px 8px",
    color: "#263000",
    fontSize: 8,
    fontWeight: 800,
  },
  list: { display: "grid", gap: 10, marginTop: 12 },
  row: {
    display: "grid",
    gridTemplateColumns: "42px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    background: "#faf9f7",
    padding: 12,
  },
  avatar: {
    display: "grid",
    width: 42,
    height: 42,
    placeItems: "center",
    borderRadius: "50%",
    background: "#050505",
    color: "#dfff65",
    fontSize: 11,
    fontWeight: 800,
  },
  rowText: { display: "grid", gap: 3, color: "#171615", fontSize: 12 },
  rowMeta: { display: "grid", gap: 3, color: "#77727d", fontSize: 10, textAlign: "right" },
  statusPill: {
    borderRadius: 999,
    background: "#ffffff",
    padding: "5px 8px",
    color: "#77727d",
    fontSize: 9,
    fontWeight: 750,
  },
  empty: { margin: 0, color: "#77727d", fontSize: 12 },
} as const;