import { useMemo, type RefObject } from 'react';

import type { ClientListItem } from '@/components/admin/client-dashboard-types';

import {
  filterAndSortClientList,
  type ClientGroupFilter,
  type ClientSortMode,
} from '../adapters/client-list-adapter';
import styles from '../sales-hub-dashboard.module.css';
import { SalesHubIcon } from './sales-hub-icon';

interface MyWorkPanelProps {
  clients: ClientListItem[];
  filter: ClientGroupFilter;
  loading: boolean;
  onFilterChange: (filter: ClientGroupFilter) => void;
  onNewClient: () => void;
  onQueryChange: (query: string) => void;
  onSelectClient: (id: string) => void;
  onSortChange: (sort: ClientSortMode) => void;
  query: string;
  searchRef: RefObject<HTMLInputElement | null>;
  selectedId: string;
  sortBy: ClientSortMode;
}

export default function MyWorkPanel({
  clients,
  filter,
  loading,
  onFilterChange,
  onNewClient,
  onQueryChange,
  onSelectClient,
  onSortChange,
  query,
  searchRef,
  selectedId,
  sortBy,
}: MyWorkPanelProps) {
  const visibleClients = useMemo(
    () => filterAndSortClientList(clients, filter, query, sortBy),
    [clients, filter, query, sortBy],
  );

  return (
    <section className={styles.portfolio} data-testid="client-portfolio-panel">
      <header className={styles.portfolioHeader}>
        <div>
          <h1>Danışan Portföyü</h1>
          <p>Sistemdeki danışanların akıllı listesi.</p>
        </div>
        <button
          className={styles.addClientButton}
          onClick={onNewClient}
          title="Yeni danışan"
          type="button"
        >
          <SalesHubIcon name="user-plus" size={17} />
        </button>
      </header>

      <div className={styles.portfolioControls}>
        <label className={styles.selectLike}>
          <SalesHubIcon name="users" size={16} />
          <span>Grup:</span>
          <select
            onChange={(event) => onFilterChange(event.target.value as ClientGroupFilter)}
            value={filter}
          >
            <option value="ALL">Tüm Danışanlar</option>
            <option value="ACTIVE">Aktif Danışanlar</option>
            <option value="PROSPECTIVE">Potansiyel Danışanlar</option>
            <option value="CHILD">Çocuk Danışanlar</option>
            <option value="INACTIVE">Pasif Danışanlar</option>
          </select>
        </label>

        <label className={styles.searchBox}>
          <SalesHubIcon name="search" size={16} />
          <input
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Danışan ara..."
            ref={searchRef}
            value={query}
          />
        </label>

        <div className={styles.controlButtons}>
          <button
            className={styles.smallPillButton}
            onClick={() => onFilterChange(filter === 'ALL' ? 'ACTIVE' : 'ALL')}
            type="button"
          >
            <SalesHubIcon name="filter" size={13} /> FİLTRELE
          </button>
          <button
            className={styles.smallPillButton}
            onClick={() => onSortChange(sortBy === 'updated' ? 'name' : 'updated')}
            type="button"
          >
            <SalesHubIcon name="sort" size={13} /> SIRALA
          </button>
        </div>
      </div>

      <div className={styles.clientList}>
        {loading ? <div className={styles.loadingLayer}>Danışanlar yükleniyor...</div> : null}
        {!loading && visibleClients.length === 0 ? (
          <div className={styles.loadingLayer}>Bu filtrede danışan bulunmuyor.</div>
        ) : null}

        {visibleClients.map((client) => (
          <button
            className={`${styles.clientCard} ${client.id === selectedId ? styles.clientCardActive : ''}`}
            key={client.id}
            onClick={() => onSelectClient(client.id)}
            type="button"
          >
            <div className={styles.clientTop}>
              <span className={styles.clientAvatar}>{client.initials}</span>
              <span>
                <span className={styles.clientName}>{client.displayName}</span>
                <span className={styles.clientService}>{client.serviceLabel}</span>
              </span>
              <span
                className={`${styles.statusBadge} ${client.status === 'ACTIVE' ? styles.statusBadgeGood : ''}`}
              >
                {client.statusLabel}
              </span>
            </div>
            <span className={styles.clientCardLine} />
            <div className={styles.planRow}>
              <div className={styles.planPills}>
                <span className={styles.miniBadge}>Plan: {client.planLabel}</span>
                {client.nextAppointmentLabel !== '—' ? (
                  <span className={styles.miniBadge}>Sıradaki: {client.nextAppointmentLabel}</span>
                ) : null}
              </div>
            </div>
            <div className={styles.metaRow}>
              <span>KAYIT: {client.createdAtLabel}</span>
              <span className={styles.metaStatus}>{client.statusLabel}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
