import type { ReactNode } from 'react';

import type { ClientDetail } from '@/components/admin/client-dashboard-types';

import {
  adaptClientDetail,
  formatDashboardDate,
  formatDashboardMoney,
  getDetailEmptyValue,
} from '../adapters/client-detail-adapter';
import styles from '../sales-hub-dashboard.module.css';
import {
  processStages,
  salesHubTabs,
  statusLabels,
  type SalesHubTab,
} from './sales-hub-config';
import { SalesHubIcon } from './sales-hub-icon';

interface WorkspacePanelProps {
  activeTab: SalesHubTab;
  detail: ClientDetail | null;
  detailLoading: boolean;
  onBack: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onNewAppointment: () => void;
  onNewNote: () => void;
  onNewPayment: () => void;
  onNewPlan: () => void;
  onPrint: () => void;
  onRefresh: () => void;
  onTabChange: (tab: SalesHubTab) => void;
  representativeInitials: string;
  representativeName: string;
  submitting: boolean;
}

export default function WorkspacePanel({
  activeTab,
  detail,
  detailLoading,
  onBack,
  onDeactivate,
  onEdit,
  onNewAppointment,
  onNewNote,
  onNewPayment,
  onNewPlan,
  onPrint,
  onRefresh,
  onTabChange,
  representativeInitials,
  representativeName,
  submitting,
}: WorkspacePanelProps) {
  const detailView = detail ? adaptClientDetail(detail) : null;
  const emptyValue = getDetailEmptyValue();
  const displayName = detailView?.displayName ?? 'Danışan seçilmedi';

  function renderOverview(): ReactNode {
    if (!detail || !detailView) return null;
    const nextAppointment = detailView.nextAppointment;

    return (
      <div className={styles.contentGrid}>
        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <h3>İletişim Bilgileri</h3>
          </div>
          <div className={styles.infoRows}>
            <div className={styles.infoRow}>
              <span>Telefon</span>
              <strong>{detail.phone ?? emptyValue}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>E-posta</span>
              <a href={detail.email ? `mailto:${detail.email}` : undefined}>
                {detail.email ?? emptyValue}
              </a>
            </div>
            <div className={styles.infoRow}>
              <span>İletişim Tercihi</span>
              <strong>{emptyValue}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Danışan Tipi</span>
              <strong>{detail.type === 'CHILD' ? 'Çocuk' : 'Yetişkin'}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Veli</span>
              <strong>
                {detail.guardians[0]
                  ? `${detail.guardians[0].guardian.firstName} ${detail.guardians[0].guardian.lastName}`
                  : emptyValue}
              </strong>
            </div>
          </div>
        </article>

        <article
          className={`${styles.card} ${styles.cardSoftGreen}`}
          id="sales-hub-next-appointment"
        >
          <div className={styles.cardTitle}>
            <h3>Up Next</h3>
            <span>{nextAppointment ? 'Planlandı' : 'Boş'}</span>
          </div>
          <div className={styles.nextCardBody}>
            <div className={styles.nextAction}>
              <span className={styles.nextActionIcon}>
                <SalesHubIcon name="phone" size={16} />
              </span>
              <span className={styles.nextActionText}>
                <strong>{nextAppointment?.serviceNameSnapshot ?? emptyValue}</strong>
                <span>{formatDashboardDate(nextAppointment?.startsAt, true)}</span>
                <span>{nextAppointment?.practitioner.displayName ?? emptyValue}</span>
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
            </div>
          </div>
        </article>

        <article className={styles.card} id="sales-hub-score">
          <div className={styles.cardTitle}>
            <h3>Danışan Gelişim Skoru</h3>
          </div>
          <div className={styles.scoreBody}>
            <span className={styles.scoreCircle}>
              <strong>{detail.score}%</strong>
            </span>
            <span className={styles.scoreCopy}>
              <strong>{detailView.scoreTitle}</strong>
              <p>İletişim, seans, plan ve operasyonel kayıtların bütünlüğünden hesaplanır.</p>
            </span>
          </div>
        </article>

        <article
          className={`${styles.card} ${styles.cardPeach}`}
          id="sales-hub-timeline"
        >
          <div className={styles.cardTitle}>
            <h3>Tedavi Zaman Tüneli</h3>
            <span>{detail.appointments.length} kayıt</span>
          </div>
          <div className={styles.appointmentList}>
            {detail.appointments.slice(0, 5).map((appointment) => (
              <div className={styles.listItem} key={appointment.id}>
                <strong>{appointment.serviceNameSnapshot}</strong>
                <span>{formatDashboardDate(appointment.startsAt, true)}</span>
                <small>
                  {appointment.status} · {appointment.practitioner.displayName}
                </small>
              </div>
            ))}
            {detail.appointments.length === 0 ? (
              <p className={styles.emptyText}>{emptyValue}</p>
            ) : null}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <h3>Finansal Göstergeler</h3>
            <span>{detail.financeEntries.length} hareket</span>
          </div>
          <div className={styles.infoRows}>
            <div className={styles.infoRow}>
              <span>Aktif Plan</span>
              <strong>{detailView.activePlan?.name ?? emptyValue}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Plan Tutarı</span>
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
              <span>Kalan Bakiye</span>
              <strong>
                {formatDashboardMoney(
                  detailView.balance.amountMinor,
                  detailView.balance.currency,
                )}
              </strong>
            </div>
            <div className={styles.infoRow}>
              <span>Seans Sayısı</span>
              <strong>{detailView.activePlan?.sessionCount ?? emptyValue}</strong>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <h3>Operasyonel Notlar</h3>
            <button className={styles.smallPillButton} onClick={onNewNote} type="button">
              <SalesHubIcon name="plus" size={12} /> NOT
            </button>
          </div>
          <div className={styles.noteList}>
            {detail.notes.slice(0, 5).map((note) => (
              <div className={styles.listItem} key={note.id}>
                <strong>{note.category}</strong>
                <span>{note.note}</span>
                <small>
                  {formatDashboardDate(note.createdAt, true)} ·{' '}
                  {note.createdBy.name ?? emptyValue}
                </small>
              </div>
            ))}
            {detail.notes.length === 0 ? (
              <p className={styles.emptyText}>{emptyValue}</p>
            ) : null}
          </div>
        </article>
      </div>
    );
  }

  function renderTabContent(): ReactNode {
    if (!detail || !detailView) return null;
    if (activeTab === 'Genel Bakış') return renderOverview();

    if (activeTab === 'İletişim Bilgileri') {
      return (
        <div className={styles.contentGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}>
              <h3>Danışan İletişimi</h3>
            </div>
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
            </div>
          </article>
          <article className={styles.card}>
            <div className={styles.cardTitle}>
              <h3>Veli Bilgileri</h3>
            </div>
            <div className={styles.noteList}>
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
              {detail.guardians.length === 0 ? (
                <p className={styles.emptyText}>{emptyValue}</p>
              ) : null}
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'Randevular') {
      return (
        <div className={styles.contentGrid}>
          <article className={`${styles.card} ${styles.cardPeach}`}>
            <div className={styles.cardTitle}>
              <h3>Randevu Geçmişi</h3>
              <span>{detail.appointments.length} kayıt</span>
            </div>
            <div className={styles.appointmentList}>
              {detail.appointments.map((appointment) => (
                <div className={styles.listItem} key={appointment.id}>
                  <strong>{appointment.serviceNameSnapshot}</strong>
                  <span>
                    {formatDashboardDate(appointment.startsAt, true)} ·{' '}
                    {appointment.durationMinutesSnapshot} dk
                  </span>
                  <small>
                    {appointment.status} · {appointment.locationTypeSnapshot} ·{' '}
                    {appointment.practitioner.displayName}
                  </small>
                </div>
              ))}
              {detail.appointments.length === 0 ? (
                <p className={styles.emptyText}>{emptyValue}</p>
              ) : null}
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'Plan ve Seanslar') {
      return (
        <div className={styles.contentGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}>
              <h3>Plan Geçmişi</h3>
              <span>{detail.plans.length} kayıt</span>
            </div>
            <div className={styles.noteList}>
              {detail.plans.map((plan) => (
                <div className={styles.listItem} key={plan.id}>
                  <strong>{plan.name}</strong>
                  <span>
                    {plan.sessionCount} seans · {plan.sessionDurationMinutes} dk
                  </span>
                  <small>
                    {formatDashboardDate(plan.validFrom)} –{' '}
                    {formatDashboardDate(plan.validUntil)} · {plan.status}
                  </small>
                </div>
              ))}
              {detail.plans.length === 0 ? (
                <p className={styles.emptyText}>{emptyValue}</p>
              ) : null}
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'Ödemeler') {
      return (
        <div className={styles.contentGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}>
              <h3>Ödeme Geçmişi</h3>
              <span>{detail.financeEntries.length} hareket</span>
            </div>
            <div className={styles.noteList}>
              {detail.financeEntries.map((entry) => (
                <div className={styles.listItem} key={entry.id}>
                  <strong>
                    {entry.type} ·{' '}
                    {formatDashboardMoney(BigInt(entry.amountMinor), entry.currency)}
                  </strong>
                  <span>{entry.plan?.name ?? emptyValue}</span>
                  <small>
                    {formatDashboardDate(entry.occurredAt, true)} ·{' '}
                    {entry.paymentMethod?.name ?? emptyValue}
                  </small>
                </div>
              ))}
              {detail.financeEntries.length === 0 ? (
                <p className={styles.emptyText}>{emptyValue}</p>
              ) : null}
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'Operasyonel Notlar') {
      return (
        <div className={styles.contentGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}>
              <h3>Operasyonel Notlar</h3>
              <button className={styles.smallPillButton} onClick={onNewNote} type="button">
                <SalesHubIcon name="plus" size={12} /> NOT
              </button>
            </div>
            <div className={styles.noteList}>
              {detail.notes.map((note) => (
                <div className={styles.listItem} key={note.id}>
                  <strong>{note.category}</strong>
                  <span>{note.note}</span>
                  <small>
                    {formatDashboardDate(note.createdAt, true)} ·{' '}
                    {note.createdBy.name ?? emptyValue}
                  </small>
                </div>
              ))}
              {detail.notes.length === 0 ? (
                <p className={styles.emptyText}>{emptyValue}</p>
              ) : null}
            </div>
          </article>
        </div>
      );
    }

    return (
      <div className={styles.contentGrid}>
        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <h3>{activeTab}</h3>
          </div>
          <p className={styles.emptyText}>{emptyValue}</p>
        </article>
      </div>
    );
  }

  return (
    <section className={styles.detailPanel} data-testid="client-detail-panel">
      <div className={styles.detailScroll}>
        <div className={styles.detailTop}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <button
                className={styles.toolbarButton}
                disabled={!detail}
                onClick={onEdit}
                type="button"
              >
                <SalesHubIcon name="edit" size={13} /> Düzenle
              </button>
              <button
                className={styles.toolbarButton}
                disabled={!detail}
                onClick={onNewAppointment}
                type="button"
              >
                <SalesHubIcon name="plus" size={13} /> Yeni
              </button>
              <button
                className={styles.toolbarButton}
                disabled={!detail || submitting}
                onClick={onDeactivate}
                type="button"
              >
                <SalesHubIcon name="trash" size={13} /> Sil
              </button>
              <button className={styles.toolbarButton} onClick={onRefresh} type="button">
                <SalesHubIcon name="refresh" size={13} /> Yenile
              </button>
              <button
                className={styles.toolbarButton}
                disabled={!detail}
                onClick={onNewPlan}
                type="button"
              >
                <SalesHubIcon name="workflow" size={13} /> Plan Tanımla
              </button>
              <button
                className={styles.toolbarButton}
                disabled={!detail}
                onClick={onPrint}
                type="button"
              >
                <SalesHubIcon name="file-down" size={13} /> To PDF
              </button>
              <button
                className={styles.toolbarButton}
                disabled={!detail}
                onClick={onNewPayment}
                type="button"
              >
                <SalesHubIcon name="credit-card" size={13} /> Ödeme Al
              </button>
              <button
                className={styles.toolbarButton}
                disabled={!detail}
                onClick={() =>
                  document
                    .getElementById('sales-hub-process')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                type="button"
              >
                <SalesHubIcon name="workflow" size={13} /> Süreç
              </button>
              <button
                className={styles.toolbarButton}
                disabled={!detail}
                onClick={onNewNote}
                title="Operasyonel not ekle"
                type="button"
              >
                <SalesHubIcon name="more" size={14} />
              </button>
            </div>
            <button className={styles.backButton} onClick={onBack} type="button">
              <SalesHubIcon name="arrow-left" size={13} /> Geri Dön
            </button>
          </div>

          <div className={styles.heroRow}>
            <div className={styles.heroIdentity}>
              <span className={styles.heroAvatar}>{detailView?.initials ?? emptyValue}</span>
              <div>
                <div className={styles.heroNameRow}>
                  <h2>{displayName}</h2>
                  {detail ? (
                    <span className={styles.clientNumber}>
                      DNS-{detail.id.slice(0, 4).toUpperCase()}
                    </span>
                  ) : null}
                </div>
                <div className={styles.heroBadges}>
                  <span className={styles.heroBadge}>
                    {detail ? statusLabels[detail.status] : emptyValue}
                  </span>
                  <span className={styles.heroBadge}>
                    {detail
                      ? detail.type === 'CHILD'
                        ? 'Çocuk Danışan'
                        : 'Yetişkin Danışan'
                      : emptyValue}
                  </span>
                  {detailView?.age !== null && detailView?.age !== undefined ? (
                    <span className={styles.heroBadge}>{detailView.age} Yaşında</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span>Kayıt Tarihi</span>
                <strong>{formatDashboardDate(detail?.createdAt)}</strong>
              </div>
              <div className={styles.stat}>
                <span>Kalan Bakiye</span>
                <strong>
                  {detailView
                    ? formatDashboardMoney(
                        detailView.balance.amountMinor,
                        detailView.balance.currency,
                      )
                    : emptyValue}
                </strong>
              </div>
              <div className={styles.stat}>
                <span>Aktif Plan</span>
                <strong>{detailView?.activePlan?.name ?? emptyValue}</strong>
              </div>
              <div className={styles.ownerPill} data-visual-dynamic="authenticated-user">
                <span className={styles.clientAvatar}>{representativeInitials}</span>
                <span>
                  TEMSİLCİ
                  <strong>{representativeName}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className={styles.processRow} id="sales-hub-process">
            <div className={styles.processLabel}>
              <strong>Opportunity Sales Process</strong>
              <small>Active for {detailView?.activeDays ?? 0} Days</small>
            </div>
            <div className={styles.processStages}>
              {processStages.map(([label, caption], index) => (
                <div
                  className={`${styles.processStage} ${
                    detailView && index < detailView.processIndex
                      ? styles.processStageDone
                      : ''
                  } ${
                    detailView && index === detailView.processIndex
                      ? styles.processStageCurrent
                      : ''
                  }`}
                  key={label}
                >
                  <span className={styles.stageCircle}>
                    <SalesHubIcon
                      name={detailView && index < detailView.processIndex ? 'check' : 'lock'}
                      size={11}
                    />
                  </span>
                  <span className={styles.stageText}>
                    <strong>{label}</strong>
                    <small>{caption}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.tabs}>
            {salesHubTabs.map((tab) => (
              <button
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                key={tab}
                onClick={() => onTabChange(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.contentArea}>
          {detailLoading ? (
            <div className={styles.loadingLayer}>Danışan ayrıntıları yükleniyor...</div>
          ) : null}
          {!detailLoading && !detail ? (
            <div className={styles.loadingLayer}>Portföyden bir danışan seçin.</div>
          ) : null}
          {!detailLoading && detail ? renderTabContent() : null}
        </div>
      </div>
    </section>
  );
}
