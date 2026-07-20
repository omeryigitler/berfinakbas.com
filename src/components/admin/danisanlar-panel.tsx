'use client';

import { useMemo, useState } from 'react';

import type { ClientListItem } from './client-dashboard-types';

interface DanisanlarPanelProps {
  clients: ClientListItem[];
  loading: boolean;
  onNew: () => void;
  onRefresh: () => void;
  onSelectDanisan: (id: string) => void;
  selectedId: string;
}

const statusLabels: Record<ClientListItem['status'], string> = {
  ACTIVE: 'Aktif danışan',
  INACTIVE: 'Pasif danışan',
  PROSPECTIVE: 'Aday danışan',
};

function formatAppointment(value: string | undefined) {
  if (!value) return 'Randevu planlanmadı';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Malta',
    year: 'numeric',
  }).format(new Date(value));
}

export default function DanisanlarPanel({
  clients,
  loading,
  onNew,
  onRefresh,
  onSelectDanisan,
  selectedId,
}: DanisanlarPanelProps) {
  const [arama, setArama] = useState('');

  const filteredDanisanlar = useMemo(() => {
    const query = arama.trim().toLocaleLowerCase('tr-TR');
    if (!query) return clients;
    return clients.filter((client) =>
      [client.firstName, client.lastName, client.email ?? '', client.phone ?? '']
        .join(' ')
        .toLocaleLowerCase('tr-TR')
        .includes(query),
    );
  }, [arama, clients]);

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <h2 style={styles.title}>Danışanlar</h2>
        <div style={styles.actionButtons}>
          <button onClick={onRefresh} style={styles.btn} title="Yenile" type="button">↻</button>
          <button onClick={onNew} style={styles.btn} title="Yeni danışan" type="button">＋</button>
          <button onClick={() => setArama('')} style={styles.btn} title="Aramayı temizle" type="button">⌕</button>
        </div>
      </div>

      <div style={styles.searchContainer}>
        <input
          onChange={(event) => setArama(event.target.value)}
          placeholder="Danışan adı, e-posta veya telefon..."
          style={styles.searchInput}
          type="search"
          value={arama}
        />
      </div>

      <div style={styles.dateHeader}>
        <div style={styles.divider} />
        <span style={styles.dateText}>{arama ? 'ARAMA SONUÇLARI' : 'TÜM KAYITLAR'}</span>
        <div style={styles.divider} />
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.noResults}><span style={styles.noResultsText}>Danışanlar yükleniyor...</span></div>
        ) : filteredDanisanlar.length === 0 ? (
          <div style={styles.noResults}><span style={styles.noResultsText}>Sonuç bulunamadı</span></div>
        ) : (
          filteredDanisanlar.map((danisan) => {
            const isActive = selectedId === danisan.id;
            return (
              <button
                key={danisan.id}
                onClick={() => onSelectDanisan(danisan.id)}
                style={{
                  ...styles.card,
                  backgroundColor: isActive ? '#eafda8' : '#ffffff',
                  borderColor: isActive ? 'rgba(0, 0, 0, 0.04)' : 'rgba(226, 225, 223, 0.6)',
                }}
                type="button"
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardInfo}>
                    <span style={styles.cardName}>{danisan.firstName} {danisan.lastName}</span>
                    <span style={styles.cardRole}>{statusLabels[danisan.status]}</span>
                  </div>
                  <div
                    style={{
                      ...styles.actionIcon,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.6)' : 'rgba(243, 242, 241, 1)',
                    }}
                  >
                    {danisan.type === 'CHILD' ? 'Ç' : 'Y'}
                  </div>
                </div>

                <div style={styles.appointmentText}>{formatAppointment(danisan.nextAppointment?.startsAt)}</div>

                <div style={styles.cardBottom}>
                  <div style={styles.badge}>{danisan.type === 'CHILD' ? 'ÇOCUK' : 'YETİŞKİN'}</div>
                  <div style={{ ...styles.score, ...(danisan.score >= 75 ? styles.scoreGood : danisan.score >= 50 ? styles.scoreMid : styles.scoreLow) }}>
                    {danisan.score}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

const styles = {
  panel: {
    width: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    border: '1px solid rgba(226, 225, 223, 0.4)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    height: 'calc(100vh - 160px)',
    flex: '0 0 auto',
  },
  header: {
    padding: '24px',
    paddingBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: '#323130' },
  actionButtons: { display: 'flex', gap: 6 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: '1px solid rgba(104, 100, 100, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    fontSize: 14,
  },
  searchContainer: { paddingLeft: 24, paddingRight: 24, paddingBottom: 12 },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 12,
    border: '1px solid rgba(226, 225, 223, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    color: '#323130',
    fontFamily: 'inherit',
    outline: 0,
  },
  dateHeader: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(226, 225, 223, 0.6)' },
  dateText: {
    fontSize: 9,
    fontWeight: 700,
    color: 'rgba(96, 94, 92, 0.8)',
    letterSpacing: 0.5,
  },
  list: {
    flex: 1,
    overflow: 'auto',
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  noResults: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 },
  noResultsText: { fontSize: 12, color: 'rgba(96, 94, 92, 0.8)' },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid rgba(226, 225, 223, 0.6)',
    font: 'inherit',
    textAlign: 'left' as const,
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardInfo: { display: 'flex', flexDirection: 'column' as const, gap: 3 },
  cardName: { fontSize: 12, fontWeight: 700, color: '#323130' },
  cardRole: { fontSize: 10, color: 'rgba(96, 94, 92, 0.8)', fontWeight: 600 },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    border: '1px solid rgba(226, 225, 223, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 800,
  },
  appointmentText: { color: '#77727d', fontSize: 9, lineHeight: 1.4 },
  cardBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    padding: '4px 8px',
    borderRadius: 8,
    fontSize: 8,
    fontWeight: 700,
    color: 'rgba(96, 94, 92, 0.8)',
    backgroundColor: 'rgba(243, 242, 241, 1)',
    letterSpacing: 0.3,
  },
  score: {
    width: 24,
    height: 24,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
  },
  scoreGood: { backgroundColor: '#050505', color: '#ffffff' },
  scoreMid: { backgroundColor: '#fffbeb', color: '#b45309' },
  scoreLow: { backgroundColor: '#fdf2f2', color: '#dc2626' },
};