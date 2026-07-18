'use client';

import { useState } from 'react';

interface DanisanlarPanelProps {
  selectedId: string;
  onSelectDanisan: (id: string) => void;
}

interface Danisan {
  id: string;
  ad: string;
  telefon: string;
  email: string;
  durumu: string;
  randevuTarihi: string;
  score: number;
  scoreBg: string;
  scoreColor: string;
}

const danisanlar: Danisan[] = [
  {
    id: 'danisan-1',
    ad: 'Ahmet Yılmaz',
    telefon: '0531 234 5678',
    email: 'ahmet@example.com',
    durumu: 'İlk Konsültasyon',
    randevuTarihi: '24/07/2026, 10:00',
    score: 90,
    scoreBg: '#000000',
    scoreColor: '#ffffff',
  },
  {
    id: 'danisan-2',
    ad: 'Fatma Demir',
    telefon: '0532 345 6789',
    email: 'fatma@example.com',
    durumu: 'Devam Eden Tedavi',
    randevuTarihi: '24/07/2026, 14:30',
    score: 83,
    scoreBg: '#ecfdf5',
    scoreColor: '#16a34a',
  },
  {
    id: 'danisan-3',
    ad: 'Mehmet Can',
    telefon: '0533 456 7890',
    email: 'mehmet@example.com',
    durumu: 'Değerlendirme Bekleme',
    randevuTarihi: '25/07/2026, 09:00',
    score: 72,
    scoreBg: '#fffbeb',
    scoreColor: '#b45309',
  },
  {
    id: 'danisan-4',
    ad: 'Ayşe Kaya',
    telefon: '0534 567 8901',
    email: 'ayse@example.com',
    durumu: 'Tamamlandı',
    randevuTarihi: '20/07/2026, 16:00',
    score: 32,
    scoreBg: '#fdf2f2',
    scoreColor: '#dc2626',
  }
];

export default function DanisanlarPanel({ selectedId, onSelectDanisan }: DanisanlarPanelProps) {
  const [arama, setArama] = useState('');

  const filteredDanisanlar = danisanlar.filter(d =>
    d.ad.toLowerCase().includes(arama.toLowerCase()) ||
    d.email.toLowerCase().includes(arama.toLowerCase())
  );

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Danışanlar</h2>
        <div style={styles.actionButtons}>
          <button style={styles.btn} title="Yenile">🔄</button>
          <button style={styles.btn} title="Liste">📋</button>
          <button style={styles.btn} title="Arama">🔍</button>
        </div>
      </div>

      {/* Arama */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Danışan adı veya email..."
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Tarih Başlığı */}
      <div style={styles.dateHeader}>
        <div style={styles.divider}></div>
        <span style={styles.dateText}>{arama ? 'ARAMA SONUÇLARI' : 'BUGÜN'}</span>
        <div style={styles.divider}></div>
      </div>

      {/* Danışan Listesi */}
      <div style={styles.list}>
        {filteredDanisanlar.length === 0 ? (
          <div style={styles.noResults}>
            <span style={styles.noResultsText}>Sonuç bulunamadı</span>
          </div>
        ) : (
          filteredDanisanlar.map((danisan) => {
            const isActive = selectedId === danisan.id;
            return (
              <div
                key={danisan.id}
                onClick={() => onSelectDanisan(danisan.id)}
                style={{
                  ...styles.card,
                  backgroundColor: isActive ? '#eafda8' : '#ffffff',
                  borderColor: isActive ? 'rgba(0, 0, 0, 0.04)' : 'rgba(226, 225, 223, 0.6)',
                }}
              >
                {/* Top Row */}
                <div style={styles.cardTop}>
                  <div style={styles.cardInfo}>
                    <span style={styles.cardName}>{danisan.ad}</span>
                    <span style={styles.cardRole}>{danisan.durumu}</span>
                  </div>
                  <div style={{
                    ...styles.actionIcon,
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.6)' : 'rgba(243, 242, 241, 1)',
                  }}>
                    📞
                  </div>
                </div>

                {/* Bottom Row */}
                <div style={styles.cardBottom}>
                  <div style={styles.badge}>DANIŞAN</div>
                  <div style={{
                    ...styles.score,
                    backgroundColor: danisan.scoreBg,
                    color: danisan.scoreColor,
                  }}>
                    {danisan.score}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
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
  },
  header: {
    padding: '24px',
    paddingBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#323130',
  },
  actionButtons: {
    display: 'flex',
    gap: 6,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: '1px solid rgba(104, 100, 100, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 12,
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 12,
    border: '1px solid rgba(226, 225, 223, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    color: '#323130',
    fontFamily: 'inherit',
  },
  dateHeader: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(226, 225, 223, 0.6)',
  },
  dateText: {
    fontSize: 9,
    fontWeight: 700,
    color: 'rgba(96, 94, 92, 0.8)',
    textTransform: 'uppercase' as const,
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
  noResults: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  noResultsText: {
    fontSize: 12,
    color: 'rgba(96, 94, 92, 0.8)',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid rgba(226, 225, 223, 0.6)',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#323130',
  },
  cardRole: {
    fontSize: 10,
    color: 'rgba(96, 94, 92, 0.8)',
    fontWeight: 600,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    border: '1px solid rgba(226, 225, 223, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  cardBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: 8,
    fontSize: 8,
    fontWeight: 700,
    color: 'rgba(96, 94, 92, 0.8)',
    backgroundColor: 'rgba(243, 242, 241, 1)',
    textTransform: 'uppercase' as const,
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
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  }
};
