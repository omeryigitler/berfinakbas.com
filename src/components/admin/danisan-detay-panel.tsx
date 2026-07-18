'use client';

interface DanisanDetayPanelProps {
  selectedDanisanId: string;
}

interface Danisan {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  hizmet: string;
  durum: string;
  ilkTarix: string;
  notlar: string;
  score: number;
  trend: string;
}

const danisanlar: Record<string, Danisan> = {
  'danisan-1': {
    id: 'danisan-1',
    ad: 'Ahmet',
    soyad: 'Yılmaz',
    email: 'ahmet@example.com',
    telefon: '0531 234 5678',
    hizmet: 'Psikolojik Danışmanlık',
    durum: 'İlk Konsültasyon',
    ilkTarix: '24/07/2026',
    notlar: 'Başlangıç değerlendirmesi tamamlandı. Haftalık seanslara devam önerildi.',
    score: 90,
    trend: 'İyileşti',
  },
  'danisan-2': {
    id: 'danisan-2',
    ad: 'Fatma',
    soyad: 'Demir',
    email: 'fatma@example.com',
    telefon: '0532 345 6789',
    hizmet: 'Kişisel Gelişim Koçluğu',
    durum: 'Devam Eden Tedavi',
    ilkTarix: '15/06/2026',
    notlar: 'Düzenli seans katılımı. İlerleme gözleniliyor.',
    score: 83,
    trend: 'Gelişti',
  },
  'danisan-3': {
    id: 'danisan-3',
    ad: 'Mehmet',
    soyad: 'Can',
    email: 'mehmet@example.com',
    telefon: '0533 456 7890',
    hizmet: 'Aile Danışmanlığı',
    durum: 'Değerlendirme Bekleme',
    ilkTarix: '20/07/2026',
    notlar: 'İlk seans öncesi değerlendirme formu bekleniyor.',
    score: 72,
    trend: 'Sabit',
  },
  'danisan-4': {
    id: 'danisan-4',
    ad: 'Ayşe',
    soyad: 'Kaya',
    email: 'ayse@example.com',
    telefon: '0534 567 8901',
    hizmet: 'Stres Yönetimi',
    durum: 'Tamamlandı',
    ilkTarix: '10/05/2026',
    notlar: 'Tedavi döngüsü başarıyla tamamlandı. Follow-up randevusu önerildi.',
    score: 32,
    trend: 'Azaldı',
  }
};

export default function DanisanDetayPanel({ selectedDanisanId }: DanisanDetayPanelProps) {
  const danisan = danisanlar[selectedDanisanId] || danisanlar['danisan-1'];

  return (
    <div style={styles.panel}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <button style={styles.toolBtn}>💾 Kaydet</button>
        <button style={styles.toolBtn}>➕ Yeni</button>
        <button style={styles.toolBtn}>🗑️ Sil</button>
        <button style={styles.toolBtn}>🔄 Yenile</button>
        <button style={styles.toolBtn}>📝 Not Ekle</button>
        <button style={styles.toolBtn}>📊 Raporla</button>
      </div>

      {/* Header Card */}
      <div style={styles.headerCard}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>👤</div>
          <div style={styles.headerInfo}>
            <h1 style={styles.headerName}>{danisan.ad} {danisan.soyad}</h1>
            <div style={styles.headerBadges}>
              <span style={styles.badge1}>DANIŞAN</span>
              <span style={styles.badge2}>✨ Kaydedildi</span>
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.stat}>
            <span style={styles.statLabel}>HİZMET</span>
            <span style={styles.statValue}>{danisan.hizmet}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>DURUM</span>
            <span style={styles.statValue}>{danisan.durum}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>İLK TARİH</span>
            <span style={styles.statValue}>{danisan.ilkTarix}</span>
          </div>
        </div>
      </div>

      {/* Process Tracker */}
      <div style={styles.processCard}>
        <div style={styles.processLeft}>
          <span style={styles.processTitle}>Danışmanlık Süreci</span>
          <span style={styles.processSubtitle}>Etkin - 3 seansda</span>
        </div>
        <div style={styles.processSteps}>
          <div style={styles.stepActive}>
            <span>✓</span>
            <span>Değerlendirme (7.25)</span>
          </div>
          <span style={styles.stepSeparator}>›</span>
          <div style={styles.stepInactive}>
            <span>🔒</span>
            <span>Müdahale</span>
          </div>
          <span style={styles.stepSeparator}>›</span>
          <div style={styles.stepInactive}>
            <span>🔒</span>
            <span>İzleme</span>
          </div>
          <span style={styles.stepSeparator}>›</span>
          <div style={styles.stepInactive}>
            <span>🔒</span>
            <span>Sonlandırma</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={styles.tabActive}>Özet</button>
        <button style={styles.tabInactive}>İlerleme</button>
        <button style={styles.tabInactive}>Notlar</button>
        <button style={styles.tabInactive}>İlişkiler</button>
      </div>

      {/* 3-Column Grid */}
      <div style={styles.grid}>

        {/* COLUMN 1 */}
        <div style={styles.column}>
          {/* Contact Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>👤 Danışan Bilgileri</h3>
            <div style={styles.cardContent}>
              <div style={styles.field}>
                <span style={styles.label}>Ad</span>
                <span style={styles.value}>{danisan.ad}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Soyad</span>
                <span style={styles.value}>{danisan.soyad}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Email</span>
                <span style={styles.valueBlue}>{danisan.email}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Telefon</span>
                <span style={styles.value}>📞 {danisan.telefon}</span>
              </div>
            </div>
          </div>

          {/* Service Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🎯 Hizmet Bilgileri</h3>
            <div style={styles.cardContent}>
              <div style={styles.field}>
                <span style={styles.label}>Hizmet</span>
                <span style={styles.value}>{danisan.hizmet}</span>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>İlk Seans</span>
                <span style={styles.value}>{danisan.ilkTarix}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2 */}
        <div style={styles.column}>
          {/* Next Session */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Sonraki Seans</h3>
              <span style={styles.badgeMini}>AKTIF</span>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.sequenceLabel}>Takvim: Haftalık Seanslart</div>
              <div style={styles.task}>
                <div style={styles.taskIcon}>📞</div>
                <div style={styles.taskInfo}>
                  <span style={styles.taskName}>Seans 4</span>
                  <span style={styles.taskTime}>Adım 4 • 3 gün içinde</span>
                </div>
              </div>
              <p style={styles.taskDesc}>
                İlerleme değerlendirmesi yap ve sonraki hedefleri belirle.
              </p>
              <div style={styles.taskButtons}>
                <button style={styles.btnPrimary}>Seansı Başlat</button>
                <button style={styles.btnSecondary}>Tamamla</button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📅 Tarihçe</h3>
            <input
              type="text"
              placeholder="Tarihçe ara..."
              style={styles.searchSmall}
            />
          </div>
        </div>

        {/* COLUMN 3 */}
        <div style={styles.column}>
          {/* Score Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>İlerleme Puanı</h3>
              <span style={styles.aiLabel}>AI DESTEKLI</span>
            </div>
            <div style={styles.scoreContainer}>
              <div style={styles.scoreCircle}>
                <span style={styles.scoreNumber}>{danisan.score}</span>
                <span style={styles.scoreGrade}>A</span>
              </div>
              <div style={styles.scoreTrend}>
                <span>🟢 {danisan.trend}</span>
                <p style={styles.trendText}>
                  Seans katılımı, görevtamamlama ve geri bildirim temeli.
                </p>
              </div>
            </div>

            <div style={styles.insights}>
              <span style={styles.insightsLabel}>Gözlemler</span>
              <ul style={styles.insightsList}>
                <li>Seansa düzenli katılım</li>
                <li>Ev ödevi uyumluluğu yüksek</li>
                <li>Hedeflere doğru ilerleme</li>
                <li>Pozitif tutum değişimi</li>
              </ul>
            </div>
          </div>

          {/* Notes Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Önemli Notlar</h3>
            <div style={styles.notesArea}>
              <p style={styles.notes}>{danisan.notlar}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  panel: {
    flex: 1,
    backgroundColor: 'rgba(234, 253, 168, 0.75)',
    borderRadius: 20,
    border: '1px solid rgba(226, 225, 223, 0.4)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto',
    gap: 20,
  },
  toolbar: {
    display: 'flex',
    gap: 8,
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    paddingBottom: 16,
    flexWrap: 'wrap' as const,
  },
  toolBtn: {
    padding: '6px 12px',
    borderRadius: 20,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: '#605e5c',
    transition: 'all 0.2s',
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    border: '1px solid rgba(255, 255, 255, 0.6)',
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  headerLeft: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: '#e8e7e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    border: '2px solid white',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  headerName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#323130',
  },
  headerBadges: {
    display: 'flex',
    gap: 6,
  },
  badge1: {
    padding: '4px 10px',
    backgroundColor: '#eafda8',
    color: '#000000',
    fontSize: 8,
    fontWeight: 700,
    borderRadius: 12,
    textTransform: 'uppercase' as const,
  },
  badge2: {
    padding: '4px 10px',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 700,
    borderRadius: 12,
    textTransform: 'uppercase' as const,
  },
  headerRight: {
    display: 'flex',
    gap: 24,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: 'rgba(96, 94, 92, 0.8)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 700,
    color: '#323130',
  },
  processCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    border: '1px solid rgba(255, 255, 255, 0.6)',
    padding: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  processLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    paddingLeft: 8,
  },
  processTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#323130',
  },
  processSubtitle: {
    fontSize: 10,
    color: 'rgba(96, 94, 92, 0.8)',
  },
  processSteps: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
  },
  stepActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    color: 'white',
    paddingLeft: 16,
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 20,
    fontWeight: 600,
  },
  stepInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    color: '#605e5c',
    paddingLeft: 16,
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 8,
    fontWeight: 600,
    border: '1px solid rgba(226, 225, 223, 0.6)',
  },
  stepSeparator: {
    color: 'rgba(96, 94, 92, 0.4)',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
    paddingBottom: 8,
    fontSize: 12,
  },
  tabActive: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
  },
  tabInactive: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    color: 'rgba(96, 94, 92, 0.8)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 20,
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    border: '1px solid rgba(226, 225, 223, 0.6)',
    padding: 20,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#323130',
    borderBottom: '1px solid rgba(226, 225, 223, 0.6)',
    paddingBottom: 8,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(226, 225, 223, 0.6)',
    paddingBottom: 8,
  },
  badgeMini: {
    fontSize: 8,
    fontWeight: 700,
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'uppercase' as const,
  },
  aiLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: '#605e5c',
    backgroundColor: 'rgba(96, 94, 92, 0.08)',
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
    fontSize: 12,
  },
  field: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: 'rgba(96, 94, 92, 0.8)',
    fontWeight: 600,
    fontSize: 11,
  },
  value: {
    color: '#323130',
    fontWeight: 600,
  },
  valueBlue: {
    color: '#0078d4',
    fontWeight: 600,
  },
  sequenceLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(96, 94, 92, 0.8)',
    backgroundColor: 'rgba(243, 242, 241, 1)',
    padding: '8px',
    borderRadius: 8,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  task: {
    backgroundColor: '#eafda8',
    borderRadius: 16,
    padding: 12,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  taskIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  taskInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  taskName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#323130',
  },
  taskTime: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  taskDesc: {
    fontSize: 11,
    color: '#605e5c',
    lineHeight: 1.4,
  },
  taskButtons: {
    display: 'flex',
    gap: 8,
  },
  btnPrimary: {
    flex: 1,
    padding: '6px 12px',
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: 8,
    border: 'none',
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSecondary: {
    flex: 1,
    padding: '6px 12px',
    backgroundColor: '#ffffff',
    color: '#323130',
    borderRadius: 8,
    border: '1px solid rgba(226, 225, 223, 0.6)',
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
  },
  searchSmall: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(226, 225, 223, 0.6)',
    backgroundColor: 'rgba(243, 242, 241, 0.5)',
    fontSize: 11,
    fontFamily: 'inherit',
  },
  scoreContainer: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  },
  scoreCircle: {
    width: 112,
    height: 112,
    borderRadius: '50%',
    backgroundColor: '#f0fdf4',
    border: '8px solid #16a34a',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 800,
    color: '#323130',
  },
  scoreGrade: {
    fontSize: 12,
    fontWeight: 700,
    color: '#16a34a',
    textTransform: 'uppercase' as const,
  },
  scoreTrend: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    color: 'rgba(96, 94, 92, 0.8)',
    lineHeight: 1.3,
    margin: 0,
  },
  insights: {
    backgroundColor: 'rgba(243, 242, 241, 0.5)',
    padding: 14,
    borderRadius: 16,
    border: '1px solid rgba(226, 225, 223, 0.6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  insightsLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(96, 94, 92, 0.8)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  insightsList: {
    margin: 0,
    paddingLeft: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    fontSize: 11,
    color: '#605e5c',
  },
  notesArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  notes: {
    fontSize: 12,
    color: '#605e5c',
    lineHeight: 1.5,
    margin: 0,
  }
};
