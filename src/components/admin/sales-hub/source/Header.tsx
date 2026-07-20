import styles from '../sales-hub-dashboard.module.css';
import { SalesHubIcon } from './sales-hub-icon';

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
  userInitials = '—',
}: HeaderProps) {
  return (
    <header className={styles.topbar} data-testid="sales-hub-header">
      <button
        className={styles.iconButton}
        onClick={onFocusSearch}
        title="Ara"
        type="button"
      >
        <SalesHubIcon name="search" />
      </button>
      <button
        className={styles.iconButton}
        disabled={!hasClient}
        onClick={onShowHistory}
        title="Geçmiş"
        type="button"
      >
        <SalesHubIcon name="clock" />
      </button>
      <button
        className={styles.iconButton}
        onClick={onNewClient}
        title="Yeni danışan"
        type="button"
      >
        <SalesHubIcon name="plus" />
      </button>
      <button
        className={styles.iconButton}
        disabled={!hasClient}
        onClick={onShowInsights}
        title="İçgörüler"
        type="button"
      >
        <SalesHubIcon name="insight" />
      </button>
      <button
        className={`${styles.iconButton} ${filterActive ? styles.iconButtonActive : ''}`}
        onClick={onFilter}
        title="Filtre"
        type="button"
      >
        <SalesHubIcon name="filter" />
      </button>
      <button className={styles.iconButton} disabled title="Ayarlar" type="button">
        <SalesHubIcon name="settings" />
      </button>
      <button className={styles.iconButton} disabled title="Yardım" type="button">
        <SalesHubIcon name="help" />
      </button>
      <button className={styles.iconButton} disabled title="Destek" type="button">
        <SalesHubIcon name="support" />
      </button>
      <div className={styles.avatarTop} data-visual-dynamic="authenticated-user">
        {userInitials}
        <span className={styles.onlineDot} />
      </div>
    </header>
  );
}
