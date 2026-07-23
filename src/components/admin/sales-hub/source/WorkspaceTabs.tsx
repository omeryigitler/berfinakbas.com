import type { ReactNode } from "react";

import type { ClientDetail } from "@/components/admin/client-dashboard-types";

import {
  formatDashboardDate,
  formatDashboardMoney,
  getDetailEmptyValue,
} from "../adapters/client-detail-adapter";
import styles from "../sales-hub-detail.module.css";
import type { SalesHubTab } from "./sales-hub-config";

interface WorkspaceTabsProps {
  activeTab: Exclude<SalesHubTab, "Genel Bakış">;
  detail: ClientDetail;
}

function statusText(value: string): string {
  const labels: Record<string, string> = {
    CANCELLED: "İptal",
    COMPLETED: "Tamamlandı",
    CONFIRMED: "Onaylandı",
    NO_SHOW: "Gelmedi",
    PENDING_REVIEW: "İncelemede",
    REQUESTED: "Talep",
    RESCHEDULE_PROPOSED: "Yeni saat önerildi",
  };
  return labels[value] ?? value;
}

export default function WorkspaceTabs({ activeTab, detail }: WorkspaceTabsProps) {
  const emptyValue = getDetailEmptyValue();

  function collection(title: string, count: number, content: ReactNode, peach = false) {
    return (
      <div className={styles.contentGrid}>
        <article className={`${styles.card} ${peach ? styles.cardPeach : ""}`}>
          <div className={styles.cardTitle}>
            <h3>{title}</h3>
            <span>{count} kayıt</span>
          </div>
          {content}
        </article>
      </div>
    );
  }

  if (activeTab === "İletişim Bilgileri") {
    return collection(
      "Danışan İletişimi",
      1,
      <div className={styles.infoRows}>
        <div className={styles.infoRow}>
          <span>Telefon</span>
          <strong>{detail.phone ?? emptyValue}</strong>
        </div>
        <div className={styles.infoRow}>
          <span>E-posta</span>
          <strong>{detail.email ?? emptyValue}</strong>
        </div>
        <div className={styles.infoRow}>
          <span>Tercih Edilen Ad</span>
          <strong>{detail.preferredName ?? emptyValue}</strong>
        </div>
        <div className={styles.infoRow}>
          <span>Doğum Yılı</span>
          <strong>{detail.birthYear ?? emptyValue}</strong>
        </div>
        {detail.guardians.map((relation) => (
          <div className={styles.listItem} key={relation.guardian.id}>
            <strong>
              {relation.guardian.firstName} {relation.guardian.lastName}
            </strong>
            <span>{relation.relationship}</span>
            <small>
              {relation.guardian.phone} · {relation.guardian.email ?? emptyValue}
            </small>
          </div>
        ))}
      </div>,
    );
  }

  if (activeTab === "Randevular") {
    return collection(
      "Randevu Geçmişi",
      detail.appointments.length,
      <div className={styles.appointmentList}>
        {detail.appointments.map((appointment) => (
          <div className={styles.listItem} key={appointment.id}>
            <strong>{appointment.serviceNameSnapshot}</strong>
            <span>
              {formatDashboardDate(appointment.startsAt, true)} ·{" "}
              {appointment.durationMinutesSnapshot} dk
            </span>
            <small>
              {statusText(appointment.status)} · {appointment.locationTypeSnapshot} ·{" "}
              {appointment.practitioner.displayName}
            </small>
          </div>
        ))}
        {detail.appointments.length === 0 ? (
          <p className={styles.emptyText}>{emptyValue}</p>
        ) : null}
      </div>,
      true,
    );
  }

  if (activeTab === "Plan ve Seanslar") {
    return collection(
      "Plan Geçmişi",
      detail.plans.length,
      <div className={styles.noteList}>
        {detail.plans.map((plan) => (
          <div className={styles.listItem} key={plan.id}>
            <strong>{plan.name}</strong>
            <span>
              {plan.remainingSessions}/{plan.sessionCount} seans · {plan.sessionDurationMinutes} dk
              · {formatDashboardMoney(BigInt(plan.totalAmountMinor), plan.currency)}
            </span>
            <small>
              {formatDashboardDate(plan.validFrom)} – {formatDashboardDate(plan.validUntil)} ·{" "}
              {plan.status}
            </small>
          </div>
        ))}
        {detail.plans.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
      </div>,
    );
  }

  if (activeTab === "Ödemeler") {
    return collection(
      "Ödeme Geçmişi",
      detail.financeEntries.length,
      <div className={styles.noteList}>
        {detail.financeEntries.map((entry) => (
          <div className={styles.listItem} key={entry.id}>
            <strong>
              {entry.type} · {formatDashboardMoney(BigInt(entry.amountMinor), entry.currency)}
            </strong>
            <span>{entry.plan?.name ?? emptyValue}</span>
            <small>
              {formatDashboardDate(entry.occurredAt, true)} ·{" "}
              {entry.paymentMethod?.name ?? emptyValue}
            </small>
          </div>
        ))}
        {detail.financeEntries.length === 0 ? (
          <p className={styles.emptyText}>{emptyValue}</p>
        ) : null}
      </div>,
    );
  }

  if (activeTab === "Operasyonel Notlar" || activeTab === "İletişim Geçmişi") {
    return collection(
      activeTab,
      detail.notes.length,
      <div className={styles.noteList}>
        {detail.notes.map((note) => (
          <div className={styles.listItem} key={note.id}>
            <strong>{note.category}</strong>
            <span>{note.note}</span>
            <small>{formatDashboardDate(note.createdAt, true)}</small>
          </div>
        ))}
        {detail.notes.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
      </div>,
    );
  }

  return collection(activeTab, 0, <p className={styles.emptyText}>{emptyValue}</p>);
}
