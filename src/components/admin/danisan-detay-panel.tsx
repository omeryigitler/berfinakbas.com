'use client';

import styles from './danisan-detay-panel.module.css';

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
    <section className={styles.panel}>
      <div className={styles.topSection}>
        <div className={styles.toolbar}>
          <button className={styles.toolBtn} type="button">💾 Kaydet</button>
          <button className={styles.toolBtn} type="button">➕ Yeni</button>
          <button className={styles.toolBtn} type="button">🗑️ Sil</button>
          <button className={styles.toolBtn} type="button">🔄 Yenile</button>
          <button className={styles.toolBtn} type="button">📝 Not Ekle</button>
          <button className={styles.toolBtn} type="button">📊 Raporla</button>
        </div>

        <div className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>👤</div>
            <div className={styles.headerInfo}>
              <h1 className={styles.headerName}>{danisan.ad} {danisan.soyad}</h1>
              <div className={styles.headerBadges}>
                <span className={styles.badge}>DANIŞAN</span>
                <span className={styles.badgeDark}>✨ Kaydedildi</span>
              </div>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>HİZMET</span>
              <span className={styles.statValue}>{danisan.hizmet}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>DURUM</span>
              <span className={styles.statValue}>{danisan.durum}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>İLK TARİH</span>
              <span className={styles.statValue}>{danisan.ilkTarix}</span>
            </div>
          </div>
        </div>

        <div className={styles.processCard}>
          <div className={styles.processLeft}>
            <span className={styles.processTitle}>Danışmanlık Süreci</span>
            <span className={styles.processSubtitle}>Etkin - 3 seansda</span>
          </div>
          <div className={styles.processSteps}>
            <div className={styles.stepActive}>
              <span>✓</span>
              <span>Değerlendirme (7.25)</span>
            </div>
            <div className={styles.stepInactive}>
              <span>🔒</span>
              <span>Müdahale</span>
            </div>
            <div className={styles.stepInactive}>
              <span>🔒</span>
              <span>İzleme</span>
            </div>
            <div className={styles.stepInactive}>
              <span>🔒</span>
              <span>Sonlandırma</span>
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={styles.tabActive} type="button">Özet</button>
          <button className={styles.tabInactive} type="button">İlerleme</button>
          <button className={styles.tabInactive} type="button">Notlar</button>
          <button className={styles.tabInactive} type="button">İlişkiler</button>
        </div>
      </div>

      <div className={styles.lowerSection}>
        <div className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>👤 Danışan Bilgileri</h2>
            <div className={styles.cardContent}>
              <div className={styles.field}>
                <span className={styles.label}>Ad</span>
                <span className={styles.value}>{danisan.ad}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Soyad</span>
                <span className={styles.value}>{danisan.soyad}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Email</span>
                <span className={styles.valueBlue}>{danisan.email}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Telefon</span>
                <span className={styles.value}>📞 {danisan.telefon}</span>
              </div>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardAccent}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Sonraki Seans</h2>
              <span className={styles.badgeMini}>AKTİF</span>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.sequenceLabel}>Takvim: Haftalık Seanslar</div>
              <div className={styles.task}>
                <span className={styles.taskIcon}>📞</span>
                <div className={styles.taskInfo}>
                  <span className={styles.taskName}>Seans 4</span>
                  <span className={styles.taskTime}>Adım 4 • 3 gün içinde</span>
                </div>
              </div>
              <p className={styles.taskDesc}>İlerleme değerlendirmesi yap ve sonraki hedefleri belirle.</p>
              <div className={styles.taskButtons}>
                <button className={styles.btnPrimary} type="button">Seansı Başlat</button>
                <button className={styles.btnSecondary} type="button">Tamamla</button>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>İlerleme Puanı</h2>
              <span className={styles.aiLabel}>AI DESTEKLİ</span>
            </div>
            <div className={styles.scoreContainer}>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreNumber}>{danisan.score}</span>
                <span className={styles.scoreGrade}>A</span>
              </div>
              <div className={styles.scoreTrend}>
                <span>🟢 {danisan.trend}</span>
                <p className={styles.trendText}>Seans katılımı, görev tamamlama ve geri bildirim temeli.</p>
              </div>
            </div>
            <div className={styles.insights}>
              <span className={styles.insightsLabel}>Gözlemler</span>
              <ul className={styles.insightsList}>
                <li>Seansa düzenli katılım</li>
                <li>Ev ödevi uyumluluğu yüksek</li>
                <li>Hedeflere doğru ilerleme</li>
                <li>Pozitif tutum değişimi</li>
              </ul>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>🎯 Hizmet Bilgileri</h2>
            <div className={styles.cardContent}>
              <div className={styles.field}>
                <span className={styles.label}>Hizmet</span>
                <span className={styles.value}>{danisan.hizmet}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>İlk Seans</span>
                <span className={styles.value}>{danisan.ilkTarix}</span>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>📅 Tarihçe</h2>
            <input className={styles.searchSmall} placeholder="Tarihçe ara..." type="text" />
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Önemli Notlar</h2>
            <div className={styles.notesArea}>
              <p className={styles.notes}>{danisan.notlar}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
