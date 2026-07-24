import type { CSSProperties } from "react";

import type { ClientDetail } from "@/components/admin/client-dashboard-types";

import {
  adaptClientDetail,
  formatDashboardDate,
  getDetailEmptyValue,
} from "../adapters/client-detail-adapter";
import styles from "../sales-hub-detail.module.css";
import { SalesHubIcon } from "./sales-hub-icon";

interface WorkspaceOverviewProps {
  detail: ClientDetail;
  onCompleteAppointment: (appointmentId: string) => void;
  onNewNote: () => void;
  submitting: boolean;
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
  onCompleteAppointment,
  onNewNote,
  submitting,
}: WorkspaceOverviewProps) {
  const detailView = adaptClientDetail(detail);
  const emptyValue = getDetailEmptyValue();
  const nextAppointment = detailView.nextAppointment;
  const guardian = detail.guardians[0]?.guardian;
  const canCompleteNext = nextAppointment?.status === "CONFIRMED";
  const nextIsRequest =
    nextAppointment?.status === "REQUESTED" || nextAppointment?.status === "PENDING_REVIEW";
  const latestNote = detail.notes[0] ?? null;
  const lastVisit = detailView.lastVisit;

  const activePlan = detailView.activePlan;
  const planTotalSessions = activePlan?.sessionCount ?? 0;
  const planRemainingSessions = activePlan ? Number(activePlan.remainingSessions) : 0;
  const planUsedSessions = Math.max(0, planTotalSessions - planRemainingSessions);
  const planProgress =
    planTotalSessions > 0 ? Math.round((planUsedSessions / planTotalSessions) * 100) : 0;
  const planProgressTitle = !activePlan
    ? "Aktif plan yok"
    : planProgress >= 100
      ? "Plan tamamlandı"
      : planProgress > 0
        ? "Devam ediyor"
        : "Henüz seans işlenmedi";

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
          <h3>Sıradaki</h3>
          <span>
            {nextIsRequest ? "Bekleyen talep" : nextAppointment ? "Planlı randevu" : "Randevu yok"}
          </span>
        </div>
        <div className={styles.nextCardBody}>
          <div className={`${styles.nextAction} ${styles.nextActionPrimary}`}>
            <span className={styles.nextActionIcon}>
              <SalesHubIcon name="phone" size={16} />
            </span>
            <span className={styles.nextActionText}>
              <strong>
                {nextIsRequest
                  ? "Bekleyen Talep"
                  : nextAppointment
                    ? "Sıradaki Randevu"
                    : "Randevu Yok"}
              </strong>
              <span>{nextAppointment ? formatDashboardDate(nextAppointment.startsAt, true) : emptyValue}</span>
              <span>Hizmet: {nextAppointment?.serviceNameSnapshot ?? emptyValue}</span>
            </span>
            <span className={styles.nextActionButtons}>
              <button
                disabled={!detail.phone}
                onClick={() => {
                  if (detail.phone) window.open(`tel:${detail.phone}`, "_self");
                }}
                type="button"
              >
                Ara
              </button>
              <button
                disabled={!canCompleteNext || submitting}
                onClick={() => {
                  if (nextAppointment && canCompleteNext) onCompleteAppointment(nextAppointment.id);
                }}
                title={
                  canCompleteNext
                    ? "Seansı tamamlandı olarak işaretle"
                    : "Yalnızca onaylanmış randevu tamamlanabilir"
                }
                type="button"
              >
                Tamamla
              </button>
            </span>
          </div>
          <div className={styles.nextAction}>
            <span className={styles.nextActionIcon}>
              <SalesHubIcon name="mail" size={16} />
            </span>
            <span className={styles.nextActionText}>
              <strong>Son Not</strong>
              <span>{latestNote?.note ?? emptyValue}</span>
            </span>
            <span className={styles.stepBadge}>
              {latestNote ? formatDashboardDate(latestNote.createdAt) : emptyValue}
            </span>
          </div>
          <div className={`${styles.nextAction} ${styles.nextActionMuted}`}>
            <span className={styles.nextActionIcon}>
              <SalesHubIcon name="history" size={16} />
            </span>
            <span className={styles.nextActionText}>
              <strong>Son Görüşme</strong>
              <span>{lastVisit ? statusText(lastVisit.status) : "Kayıt yok"}</span>
            </span>
            <span className={styles.stepBadge}>
              {lastVisit ? formatDashboardDate(lastVisit.startsAt) : emptyValue}
            </span>
          </div>
        </div>
      </article>

      <article className={styles.card} id="sales-hub-score">
        <div className={styles.cardTitle}>
          <h3>
            <SalesHubIcon name="insight" size={16} /> Plan İlerlemesi
          </h3>
        </div>
        <div className={styles.scoreBody}>
          <span
            className={styles.scoreCircle}
            style={
              {
                "--score": `${planProgress}%`,
              } as CSSProperties
            }
          >
            <strong>{planProgress}%</strong>
          </span>
          <span className={styles.scoreCopy}>
            <strong>{planProgressTitle}</strong>
            <p>Tamamlanan seansların aktif plandaki paya oranı.</p>
          </span>
        </div>
        <div className={styles.scoreMetrics}>
          <span>
            <small>Tamamlanan Seans</small>
            <strong>{activePlan ? planUsedSessions : emptyValue}</strong>
          </span>
          <span>
            <small>Kalan Seans</small>
            <strong>{activePlan ? planRemainingSessions : emptyValue}</strong>
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
            <strong>{detailView.planTotalLabel}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Alınan Ödeme</span>
            <strong>{detailView.paidLabel}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Kalan Borç Tutarı</span>
            <strong>{detailView.openBalanceLabel}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Aktif Plan</span>
            <strong>{detailView.activePlan?.name ?? emptyValue}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Kalan Seans</span>
            <strong>
              {detailView.activePlan
                ? `${detailView.remainingSessions} / ${detailView.activePlan.sessionCount}`
                : detailView.remainingSessions}
            </strong>
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
