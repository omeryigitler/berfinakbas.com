import type { CSSProperties } from "react";

import type { ClientDetail } from "@/components/admin/client-dashboard-types";

import {
  adaptClientDetail,
  formatDashboardDate,
  formatDashboardMoney,
  getDetailEmptyValue,
} from "../adapters/client-detail-adapter";
import styles from "../sales-hub-detail.module.css";
import { SalesHubIcon } from "./sales-hub-icon";

interface WorkspaceOverviewProps {
  detail: ClientDetail;
  onNewNote: () => void;
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

export default function WorkspaceOverview({
  detail,
  onNewNote,
}: WorkspaceOverviewProps) {
  const detailView = adaptClientDetail(detail);
  const emptyValue = getDetailEmptyValue();
  const nextAppointment = detailView.nextAppointment;
  const guardian = detail.guardians[0]?.guardian;

  return (
    <div className={`${styles.contentGrid} ${styles.overviewGrid}`}>
      <article className={styles.card}>
        <div className={styles.cardTitle}>
          <h3>
            <SalesHubIcon name="users" size={16} /> İletişim Bilgileri
          </h3>
        </div>
        <div className={styles.contactStack}>
          <div className={styles.contactBlock}>
            <span>Telefon</span>
            <div>
              <strong>{detail.phone ?? emptyValue}</strong>
              {detail.phone ? (
                <button
                  aria-label="Telefonu kopyala"
                  className={styles.copyButton}
                  onClick={() => void navigator.clipboard?.writeText(detail.phone ?? "")}
                  type="button"
                >
                  <SalesHubIcon name="document" size={13} />
                </button>
              ) : null}
            </div>
          </div>
          <div className={styles.contactBlock}>
            <span>E-posta</span>
            <div>
              <a href={detail.email ? `mailto:${detail.email}` : undefined}>
                {detail.email ?? emptyValue}
              </a>
              {detail.email ? (
                <button
                  aria-label="E-postayı kopyala"
                  className={styles.copyButton}
                  onClick={() => void navigator.clipboard?.writeText(detail.email ?? "")}
                  type="button"
                >
                  <SalesHubIcon name="document" size={13} />
                </button>
              ) : null}
            </div>
          </div>
          <div className={styles.preferenceRow}>
            <span>İletişim Tercihi</span>
            <strong>{emptyValue}</strong>
          </div>
          <div className={styles.contactBlock}>
            <span>{detail.type === "CHILD" ? "Veli" : "Danışan Tipi"}</span>
            <div>
              <strong>
                {detail.type === "CHILD"
                  ? guardian
                    ? `${guardian.firstName} ${guardian.lastName}`
                    : emptyValue
                  : "Yetişkin"}
              </strong>
            </div>
          </div>
        </div>
      </article>

      <article className={styles.card} id="sales-hub-next-appointment">
        <div className={`${styles.cardTitle} ${styles.upNextTitle}`}>
          <h3>Up Next</h3>
          <span>Sequence: New Lead Nurturing</span>
        </div>
        <div className={styles.nextCardBody}>
          <div className={`${styles.nextAction} ${styles.nextActionPrimary}`}>
            <span className={styles.nextActionIcon}>
              <SalesHubIcon name="phone" size={16} />
            </span>
            <span className={styles.nextActionText}>
              <strong>First Customer Call</strong>
              <span>{formatDashboardDate(nextAppointment?.startsAt, true)}</span>
              <span>Hizmet: {nextAppointment?.serviceNameSnapshot ?? emptyValue}</span>
            </span>
            <span className={styles.nextActionButtons}>
              <button
                onClick={() => {
                  if (detail.phone) window.open(`tel:${detail.phone}`, "_self");
                }}
                type="button"
              >
                Call
              </button>
              <button
                disabled
                title="Randevu tamamlama backend işlemi mevcut değil"
                type="button"
              >
                Mark Complete
              </button>
            </span>
          </div>
          <div className={styles.nextAction}>
            <span className={styles.nextActionIcon}>
              <SalesHubIcon name="mail" size={16} />
            </span>
            <span className={styles.nextActionText}>
              <strong>Follow Up</strong>
              <span>{detail.notes[0]?.note ?? emptyValue}</span>
            </span>
            <span className={styles.stepBadge}>Step 2</span>
          </div>
          <div className={`${styles.nextAction} ${styles.nextActionMuted}`}>
            <span className={styles.nextActionIcon}>
              <SalesHubIcon name="phone" size={16} />
            </span>
            <span className={styles.nextActionText}>
              <strong>Second Customer Call</strong>
            </span>
            <span className={styles.stepBadge}>Step 3</span>
          </div>
        </div>
      </article>

      <article className={styles.card} id="sales-hub-score">
        <div className={styles.cardTitle}>
          <h3>
            <SalesHubIcon name="insight" size={16} /> Danışan Gelişim Skoru
          </h3>
        </div>
        <div className={styles.scoreBody}>
          <span
            className={styles.scoreCircle}
            style={
              {
                "--score": `${Math.max(0, Math.min(100, detail.score))}%`,
              } as CSSProperties
            }
          >
            <strong>{detail.score}%</strong>
          </span>
          <span className={styles.scoreCopy}>
            <strong>{detailView.scoreTitle}</strong>
            <p>Seans, iletişim ve kayıt bütünlüğü üzerinden hesaplanır.</p>
          </span>
        </div>
        <div className={styles.scoreMetrics}>
          <span>
            <small>Hedef Dil</small>
            <strong>{emptyValue}</strong>
          </span>
          <span>
            <small>Akıcılık</small>
            <strong>{emptyValue}</strong>
          </span>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardPeach}`} id="sales-hub-timeline">
        <div className={styles.cardTitle}>
          <h3>
            <SalesHubIcon name="history" size={16} /> Terapi Zaman Tüneli
          </h3>
          <span>{detail.appointments.length} kayıt</span>
        </div>
        <div className={styles.timelineList}>
          {detail.appointments.slice(0, 4).map((appointment) => (
            <div className={styles.timelineItem} key={appointment.id}>
              <span />
              <div>
                <small>{formatDashboardDate(appointment.startsAt, true)}</small>
                <strong>{appointment.serviceNameSnapshot}</strong>
                <p>
                  {statusText(appointment.status)} · {appointment.practitioner.displayName}
                </p>
              </div>
            </div>
          ))}
          {detail.appointments.length === 0 ? (
            <p className={styles.emptyText}>{emptyValue}</p>
          ) : null}
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardPeach}`}>
        <div className={styles.cardTitle}>
          <h3>
            <SalesHubIcon name="credit-card" size={16} /> Finansal Göstergeler
          </h3>
          <span>{detail.financeEntries.length} hareket</span>
        </div>
        <div className={styles.financeRows}>
          <div className={styles.infoRow}>
            <span>Toplam Plan Tutarı</span>
            <strong>
              {detailView.activePlan
                ? formatDashboardMoney(
                    BigInt(detailView.activePlan.totalAmountMinor),
                    detailView.activePlan.currency,
                  )
                : emptyValue}
            </strong>
          </div>
          <div className={styles.infoRow}>
            <span>Kalan Borç Tutarı</span>
            <strong>
              {formatDashboardMoney(detailView.balance.amountMinor, detailView.balance.currency)}
            </strong>
          </div>
          <div className={styles.infoRow}>
            <span>Aktif Plan</span>
            <strong>{detailView.activePlan?.name ?? emptyValue}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Seans Sayısı</span>
            <strong>{detailView.activePlan?.sessionCount ?? emptyValue}</strong>
          </div>
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardTitle}>
          <h3>
            <SalesHubIcon name="message" size={16} /> Operasyonel Notlar
          </h3>
          <button className={styles.smallPillButton} onClick={onNewNote} type="button">
            <SalesHubIcon name="plus" size={12} /> Not
          </button>
        </div>
        <div className={styles.noteList}>
          {detail.notes.slice(0, 5).map((note) => (
            <div className={styles.listItem} key={note.id}>
              <strong>{note.category}</strong>
              <span>{note.note}</span>
              <small>
                {formatDashboardDate(note.createdAt, true)} · {note.createdBy.name ?? emptyValue}
              </small>
            </div>
          ))}
          {detail.notes.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
        </div>
      </article>
    </div>
  );
}
