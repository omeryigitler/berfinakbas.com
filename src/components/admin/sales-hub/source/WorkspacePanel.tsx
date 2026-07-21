import type { ClientDetail } from "@/components/admin/client-dashboard-types";

import {
  adaptClientDetail,
  formatDashboardDate,
  formatDashboardMoney,
  getDetailEmptyValue,
} from "../adapters/client-detail-adapter";
import styles from "../sales-hub-detail.module.css";
import { processStages, salesHubTabs, statusLabels, type SalesHubTab } from "./sales-hub-config";
import { SalesHubIcon } from "./sales-hub-icon";
import WorkspaceOverview from "./WorkspaceOverview";
import WorkspaceTabs from "./WorkspaceTabs";

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
  const displayName = detailView?.displayName ?? "Danışan seçilmedi";

  return (
    <section className={styles.detailPanel} data-testid="client-detail-panel">
      <div className={styles.detailScroll}>
        <div className={styles.detailTop}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <button className={styles.toolbarButton} disabled={!detail} onClick={onEdit} type="button">
                <SalesHubIcon name="settings" size={13} /> Düzenle
              </button>
              <button className={styles.toolbarButton} disabled={!detail} onClick={onNewAppointment} type="button">
                <SalesHubIcon name="plus" size={13} /> Yeni
              </button>
              <button className={styles.toolbarButton} disabled={!detail || submitting} onClick={onDeactivate} type="button">
                <SalesHubIcon name="trash" size={13} /> Sil
              </button>
              <button className={styles.toolbarButton} onClick={onRefresh} type="button">
                <SalesHubIcon name="refresh" size={13} /> Yenile
              </button>
              <button className={styles.toolbarButton} disabled={!detail} onClick={onNewPlan} type="button">
                <SalesHubIcon name="workflow" size={13} /> Plan Tanımla
              </button>
              <button className={styles.toolbarButton} disabled={!detail} onClick={onPrint} type="button">
                <SalesHubIcon name="file-down" size={13} /> To PDF
              </button>
              <button className={styles.toolbarButton} disabled={!detail} onClick={onNewPayment} type="button">
                <SalesHubIcon name="credit-card" size={13} /> Ödeme Al
              </button>
              <button
                className={styles.toolbarButton}
                disabled={!detail}
                onClick={() => document.getElementById("sales-hub-process")?.scrollIntoView({ behavior: "smooth" })}
                type="button"
              >
                <SalesHubIcon name="workflow" size={13} /> Süreç
              </button>
              <button className={styles.toolbarButton} disabled={!detail} onClick={onNewNote} title="Operasyonel not ekle" type="button">
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
                  {detail ? <span className={styles.clientNumber}>DNS-{detail.id.slice(0, 4).toUpperCase()}</span> : null}
                </div>
                <div className={styles.heroBadges}>
                  <span className={styles.heroBadge}>{detail ? statusLabels[detail.status] : emptyValue}</span>
                  <span className={styles.heroBadge}>
                    {detail ? (detail.type === "CHILD" ? "Çocuk Danışan" : "Yetişkin Danışan") : emptyValue}
                  </span>
                  {detailView?.age !== null && detailView?.age !== undefined ? <span className={styles.heroBadge}>{detailView.age} Yaşında</span> : null}
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
                <strong>{detailView ? formatDashboardMoney(detailView.balance.amountMinor, detailView.balance.currency) : emptyValue}</strong>
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
            <div className={styles.processChevron}>&lt;</div>
            <div className={styles.processStages}>
              {processStages.map(([label, caption], index) => (
                <div
                  className={`${styles.processStage} ${detailView && index < detailView.processIndex ? styles.processStageDone : ""} ${detailView && index === detailView.processIndex ? styles.processStageCurrent : ""}`}
                  key={label}
                >
                  <span className={styles.stageCircle}>
                    <SalesHubIcon name={detailView && index < detailView.processIndex ? "check" : "lock"} size={11} />
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
              <button className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`} key={tab} onClick={() => onTabChange(tab)} type="button">
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.contentArea}>
          {detailLoading ? <div className={styles.loadingLayer}>Danışan ayrıntıları yükleniyor...</div> : null}
          {!detailLoading && !detail ? <div className={styles.loadingLayer}>Portföyden bir danışan seçin.</div> : null}
          {!detailLoading && detail && activeTab === "Genel Bakış" ? (
            <WorkspaceOverview detail={detail} onNewNote={onNewNote} />
          ) : null}
          {!detailLoading && detail && activeTab !== "Genel Bakış" ? <WorkspaceTabs activeTab={activeTab} detail={detail} /> : null}
        </div>
      </div>
    </section>
  );
}
