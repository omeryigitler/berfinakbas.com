import { useState } from "react";

import styles from "../sales-hub-dashboard.module.css";
import { SalesHubIcon } from "./sales-hub-icon";

interface HeaderProps {
  filterActive: boolean;
  hasClient: boolean;
  onFilter: () => void;
  onFocusSearch: () => void;
  onNewClient: () => void;
  onShowHistory: () => void;
  onShowInsights: () => void;
  userInitials?: string;
}

export default function Header({
  filterActive,
  hasClient,
  onFilter,
  onFocusSearch,
  onNewClient,
  onShowHistory,
  onShowInsights,
  userInitials = "—",
}: HeaderProps) {
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  return (
    <header className={styles.topbar} data-testid="sales-hub-header" id="main-app-header">
      <div className={styles.topbarSpacer} />
      <div className={styles.topbarActions}>
        <button className={styles.iconButton} onClick={onFocusSearch} title="Ara" type="button">
          <SalesHubIcon name="search" size={20} strokeWidth={1.5} />
        </button>
        <button
          className={styles.iconButton}
          disabled={!hasClient}
          onClick={onShowHistory}
          title="Geçmiş"
          type="button"
        >
          <SalesHubIcon name="clock" size={20} strokeWidth={1.5} />
        </button>
        <button
          className={styles.iconButton}
          onClick={onNewClient}
          title="Yeni danışan"
          type="button"
        >
          <SalesHubIcon name="plus" size={20} strokeWidth={1.5} />
        </button>
        <button
          className={styles.iconButton}
          disabled={!hasClient}
          onClick={onShowInsights}
          title="İçgörüler"
          type="button"
        >
          <SalesHubIcon name="insight" size={20} strokeWidth={1.5} />
        </button>
        <button
          className={`${styles.iconButton} ${filterActive ? styles.iconButtonActive : ""}`}
          onClick={onFilter}
          title="Filtre"
          type="button"
        >
          <SalesHubIcon name="filter" size={20} strokeWidth={1.5} />
        </button>
        <button
          className={`${styles.iconButton} ${showSettingsPanel ? styles.iconButtonActive : ""}`}
          onClick={() => setShowSettingsPanel((value) => !value)}
          title="Ayarlar"
          type="button"
        >
          <SalesHubIcon name="settings" size={20} strokeWidth={1.5} />
        </button>
        <button className={styles.iconButton} title="Yardım" type="button">
          <SalesHubIcon name="help" size={20} strokeWidth={1.5} />
        </button>
        <button className={styles.iconButton} title="Destek" type="button">
          <SalesHubIcon name="support" size={20} strokeWidth={1.5} />
        </button>
        <div className={styles.avatarTop} data-visual-dynamic="authenticated-user">
          {userInitials}
          <span className={styles.onlineDot} />
        </div>
      </div>

      {showSettingsPanel ? (
        <div className={styles.settingsPanel} role="dialog">
          <div className={styles.settingsPanelHeader}>
            <div>
              <SalesHubIcon name="insight" size={17} />
              <strong>Design Customizer</strong>
            </div>
            <button
              aria-label="Ayar panelini kapat"
              className={styles.circleButton}
              onClick={() => setShowSettingsPanel(false)}
              type="button"
            >
              <SalesHubIcon name="x" size={14} />
            </button>
          </div>
          <p>Kaynak Dashboard görünümü sabitlenmiştir.</p>
        </div>
      ) : null}
    </header>
  );
}
