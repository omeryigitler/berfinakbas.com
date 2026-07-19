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
  },
};

export default function DanisanDetayPanel({ selectedDanisanId }: DanisanDetayPanelProps) {
  const danisan = danisanlar[selectedDanisanId] || danisanlar['danisan-1'];

  return (
    <div style={styles.panel}>
      <section style={styles.topSection}>
        <div style={styles.toolbar}>
          <button style={styles.toolBtn} type="button">💾 Kaydet</button>
          <button style={styles.toolBtn} type="button">➕ Yeni</button>
          <button style={styles.toolBtn} type="button">🗑️ Sil</button>
          <button style={styles.toolBtn} type="button">🔄 Yenile</button>
          <button style={styles.toolBtn} type="button">📝 Not Ekle</button>
          <button style={styles.toolBtn} type="button">📊 Raporla</button>
        </div>

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

        <div style={styles.tabs}>
          <button style={styles.tabActive} type="button">Özet</button>
          <button style={styles.tabInactive} type="button">İlerleme</button>
          <button style={styles.tabInactive} type="button">Notlar</button>
          <button style={styles.tabInactive} type="button">İlişkiler</button>
        </div>
      </section>

      <section style={styles.bottomSection}>
        <div style={styles.grid}>
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

          <div style={{ ...styles.card, ...styles.upNextCard }}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitlePlain}>Sonraki Seans</h3>
              <span style={styles.badgeMini}>AKTİF</span>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.sequenceLabel}>Takvim: Haftalık Seanslar</div>
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
                <button style={styles.btnPrimary} type="button">Seansı Başlat</button>
                <button style={styles.btnSecondary} type="button">Tamamla</button>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitlePlain}>İlerleme Puanı</h3>
              <span style={styles.aiLabel}>AI DESTEKLİ</span>
            </div>
            <div style={styles.scoreContainer}>
              <div style={styles.scoreCircle}>
                <span style={styles.scoreNumber}>{danisan.score}</span>
                <span style={styles.scoreGrade}>A</span>
              </div>
              <div style={styles.scoreTrend}>
                <span>🟢 {danisan.trend}</span>
                <p style={styles.trendText}>
                  Seans katılımı, görev tamamlama ve geri bildirim temeli.
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

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📅 Tarihçe</h3>
            <input
              type="text"
              placeholder="Tarihçe ara..."
              style={styles.searchSmall}
            />
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Önemli Notlar</h3>
            <div style={styles.notesArea}>
              <p style={styles.notes}>{danisan.notlar}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  panel: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    borderRadius: 28,
    border: '1px solid rgba(32, 28, 25, 0.12)',
    background: 'linear-gradient(104deg, #e9ff7d 0%, #f2ffd0 28%, #f5f2eb 67%, #ffffff 100%)',
    boxShadow: '0 18px 46px rgba(32, 28, 25, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto',
  },
  topSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    padding: '20px 22px 14px',
    background: 'rgba(255, 255, 255, 0.18)',
    borderBottom: '1px solid rgba(32, 28, 25, 0.08)',
  },
  bottomSection: {
    padding: '18px 22px 22px',
    background: 'linear-gradient(108deg, rgba(228, 255, 96, 0.78) 0%, rgba(241, 255, 193, 0.72) 32%, rgba(247, 245, 239, 0.9) 70%, rgba(255, 255, 255, 0.96) 100%)',
  },
  toolbar: {
    display: 'flex',
    gap: 8,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(32, 28, 25, 0.08)',
    flexWrap: 'wrap' as const,
  },
  toolBtn: {
    minHeight: 32,
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid rgba(32, 28, 25, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 650,
    color: '#4f4a46',
    transition: 'all 0.2s',
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 22,
    border: '1px solid rgba(255, 255, 255, 0.64)',
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
    backgroundColor: '#050505',
    color: '#eaff66',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 25,
    border: '2px solid rgba(255, 255, 255, 0.9)',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  headerName: {
    margin: 0,
    fontSize: 20,
    fontWeight: 750,
    color: '#201c19',
  },
  headerBadges: {
    display: 'flex',
    gap: 6,
  },
  badge1: {
    padding: '4px 10px',
    backgroundColor: '#eaff7a',
    color: '#111111',
    fontSize: 8,
    fontWeight: 750,
    borderRadius: 999,
    textTransform: 'uppercase' as const,
  },
  badge2: {
    padding: '4px 10px',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 750,
    borderRadius: 999,
    textTransform: 'uppercase' as const,
  },
  headerRight: {
    display: 'flex',
    gap: 24,
    alignItems: 'center',
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
    color: '#201c19',
  },
  processCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
    borderRadius: 22,
    border: '1px solid rgba(255, 255, 255, 0.66)',
    padding: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
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
    color: '#201c19',
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
    backgroundColor: '#050505',
    color: '#ffffff',
    padding: '7px 14px',
    borderRadius: 999,
    fontWeight: 650,
  },
  stepInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    color: '#77716c',
    padding: '7px 14px',
    borderRadius: 999,
    fontWeight: 600,
    border: '1px solid rgba(32, 28, 25, 0.1)',
  },
  stepSeparator: {
    color: 'rgba(96, 94, 92, 0.45)',
  },
  tabs: {
    display: 'flex',
    gap: 6,
    paddingBottom: 4,
    fontSize: 12,
    overflowX: 'auto' as const,
  },
  tabActive: {
    padding: '8px 16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
  },
  tabInactive: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'rgba(65, 61, 57, 0.76)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 650,
    whiteSpace: 'nowrap' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gridTemplateRows: 'minmax(250px, auto) minmax(160px, auto)',
    gap: 18,
    alignItems: 'stretch',
  },
  card: {
    minWidth: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    border: '1px solid rgba(32, 28, 25, 0.72)',
    padding: 20,
    boxShadow: '0 8px 24px rgba(32, 28, 25, 0.04)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  upNextCard: {
    background: 'linear-gradient(145deg, rgba(248, 255, 220, 0.96), rgba(238, 247, 205, 0.9))',
  },
  cardTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 750,
    color: '#9298aa',
    borderBottom: '1px solid rgba(32, 28, 25, 0.08)',
    paddingBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  cardTitlePlain: {
    margin: 0,
    fontSize: 14,
    fontWeight: 750,
    color: '#201c19',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(32, 28, 25, 0.08)',
    paddingBottom: 10,
  },
  badgeMini: {
    fontSize: 8,
    fontWeight: 750,
    color: '#111111',
    backgroundColor: '#eaff64',
    padding: '3px 9px',
    borderRadius: 999,
    textTransform: 'uppercase' as const,
  },
  aiLabel: {
    fontSize: 8,
    fontWeight: 750,
    color: '#605e5c',
    backgroundColor: 'rgba(96, 94, 92, 0.08)',
    padding: '3px 9px',
    borderRadius: 999,
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
    gridTemplateColumns: '80px minmax(0, 1fr)',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#9298aa',
    fontWeight: 650,
    fontSize: 11,
  },
  value: {
    color: '#201c19',
    fontWeight: 650,
  },
  valueBlue: {
    color: '#0078d4',
    fontWeight: 650,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sequenceLabel: {
    fontSize: 10,
    fontWeight: 750,
    color: '#605e5c',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    padding: 9,
    borderRadius: 12,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  task: {
    backgroundColor: '#eaff64',
    borderRadius: 18,
    padding: 13,
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
    fontWeight: 750,
    color: '#201c19',
  },
  taskTime: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  taskDesc: {
    margin: 0,
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
    padding: '8px 12px',
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: 999,
    border: 'none',
    fontSize: 10,
    fontWeight: 750,
    cursor: 'pointer',
  },
  btnSecondary: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    color: '#201c19',
    borderRadius: 999,
    border: '1px solid rgba(32, 28, 25, 0.14)',
    fontSize: 10,
    fontWeight: 750,
    cursor: 'pointer',
  },
  searchSmall: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(32, 28, 25, 0.12)',
    backgroundColor: 'rgba(243, 242, 241, 0.52)',
    fontSize: 11,
    fontFamily: 'inherit',
  },
  scoreContainer: {
    display: 'flex',
    gap: 20,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 96,
    height: 96,
    flex: '0 0 96px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '7px solid #050505',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 800,
    color: '#201c19',
  },
  scoreGrade: {
    fontSize: 11,
    fontWeight: 750,
    color: '#16a34a',
    textTransform: 'uppercase' as const,
  },
  scoreTrend: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    fontSize: 12,
    fontWeight: 700,
  },
  trendText: {
    fontSize: 10,
    color: 'rgba(96, 94, 92, 0.8)',
    lineHeight: 1.35,
    margin: 0,
  },
  insights: {
    backgroundColor: 'rgba(243, 242, 241, 0.56)',
    padding: 13,
    borderRadius: 16,
    border: '1px solid rgba(32, 28, 25, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  insightsLabel: {
    fontSize: 10,
    fontWeight: 750,
    color: '#9298aa',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  insightsList: {
    margin: 0,
    paddingLeft: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
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
  },
};