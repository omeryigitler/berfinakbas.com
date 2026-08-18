export interface ModuleItem {
  id: string;
  label: string;
  description: string;
}

export interface ModuleGroup {
  title: string;
  items: ModuleItem[];
}

export interface ModuleConfig {
  title: string;
  subtitle: string;
  groups: ModuleGroup[];
}

const configs: Record<string, ModuleConfig> = {
  randevular: {
    title: 'Randevular',
    subtitle: 'Randevu kayıtlarını oluşturun ve yönetin.',
    groups: [{ title: 'Randevular', items: [
      { id: 'liste', label: 'Randevu Listesi', description: 'Talep, onay ve yaklaşan randevular.' },
      { id: 'takvim', label: 'Takvim', description: 'Randevuları günlere göre görüntüleyin.' },
      { id: 'yeni', label: 'Yeni Randevu', description: 'Danışana yeni randevu oluşturun.' },
    ] }],
  },
  'takvim-uygunluk': {
    title: 'Takvim ve Uygunluk',
    subtitle: 'Çalışma saatleri, istisnalar ve rezervasyon kuralları.',
    groups: [
      { title: 'Takvim', items: [
        { id: 'takvim', label: 'Takvim', description: 'Randevu ve uygunluk takvimi.' },
        { id: 'calisma-saatleri', label: 'Çalışma Saatleri', description: 'Haftalık çalışma düzeni.' },
        { id: 'ozel-saatler', label: 'Özel Saatler', description: 'Belirli tarihler için özel çalışma saatleri.' },
        { id: 'kapali-zamanlar', label: 'Kapalı Zamanlar', description: 'İzin ve kapalı zaman blokları.' },
      ] },
      { title: 'Kurallar', items: [
        { id: 'randevu-kurallari', label: 'Randevu Kuralları', description: 'Rezervasyon, tampon ve iptal kuralları.' },
        { id: 'ilk-gorusme', label: 'İlk Görüşme', description: 'İlk görüşme süresi ve varsayılanları.' },
      ] },
    ],
  },
  'talepler-iletisim': {
    title: 'Talepler ve İletişim',
    subtitle: 'Yeni başvuruları ve inceleme bekleyen randevu taleplerini yönetin.',
    groups: [{ title: 'Talepler', items: [
      { id: 'talepler', label: 'Talepler', description: 'Yeni ve inceleme bekleyen başvurular.' },
    ] }],
  },
  hizmetler: {
    title: 'Hizmetler',
    subtitle: 'Hizmetleri, süreleri, görünürlüğü ve rezervasyon politikalarını yönetin.',
    groups: [{ title: 'Hizmetler', items: [
      { id: 'hizmetler', label: 'Hizmet Listesi', description: 'Aktif, taslak ve pasif hizmetler.' },
    ] }],
  },
  'odeme-planlar': {
    title: 'Ödeme ve Planlar',
    subtitle: 'Danışan planları, kalan borçlar ve alınan ödemeler.',
    groups: [{ title: 'Finans', items: [
      { id: 'finans-ozeti', label: 'Finans Özeti', description: 'Plan toplamı, tahsilat ve açık bakiye.' },
      { id: 'planlar', label: 'Planlar', description: 'Danışan planları ve seans hakları.' },
      { id: 'odemeler', label: 'Ödemeler', description: 'Planlara bağlı ödeme kayıtları.' },
    ] }],
  },
  'pdf-kaynaklar': {
    title: 'Kontrol ve Çıktılar',
    subtitle: 'Randevu ve ödemeleri günlük veya tüm zamanlar için kontrol edin, yazdırın ya da PDF olarak kaydedin.',
    groups: [{ title: 'Kontrol', items: [
      { id: 'gunluk', label: 'Günlük Kontrol', description: 'Seçilen günün randevu ve alınan ödemelerini birlikte kontrol edin.' },
      { id: 'tum-zamanlar', label: 'Tüm Zamanlar', description: 'Tüm randevu ve ödeme geçmişini tek listede inceleyin ve çıktı alın.' },
    ] }],
  },
  'site-icerigi': {
    title: 'İletişim ve Sosyal Medya',
    subtitle: 'FAB menüsü, bağlantılar, görünürlük ve sıralama.',
    groups: [{ title: 'Yönetim', items: [
      { id: 'iletisim-ayarlari', label: 'Tüm İletişim Ayarları', description: 'WhatsApp, Instagram, telefon ve e-posta.' },
    ] }],
  },
  raporlar: {
    title: 'Raporlar',
    subtitle: 'Canlı verilerden üretilen operasyon ve finans özetleri.',
    groups: [{ title: 'Raporlar', items: [
      { id: 'finans', label: 'Finans', description: 'Tahsilat ve açık bakiye.' },
      { id: 'randevular', label: 'Randevular', description: 'Randevu durum dağılımı.' },
      { id: 'danisanlar', label: 'Danışanlar', description: 'Danışan durum dağılımı.' },
      { id: 'planlar', label: 'Planlar', description: 'Plan durum özeti.' },
      { id: 'talepler', label: 'Başvuru ve Randevu Sonuçları', description: 'Başvuru, onay ve randevu sonuçları.' },
    ] }],
  },
  'kullanicilar-yetkiler': {
    title: 'Kullanıcılar ve Yetkiler',
    subtitle: 'Yönetim hesapları ve gerçek yetki kapsamları.',
    groups: [{ title: 'Erişim', items: [
      { id: 'kullanicilar', label: 'Kullanıcılar', description: 'Aktif ve askıya alınmış hesaplar.' },
      { id: 'roller', label: 'Rol ve Yetki Özeti', description: 'Sistemde tanımlı rollerin gerçek yetkileri.' },
      { id: 'giris-gecmisi', label: 'Son Girişler', description: 'Her hesabın son başarılı giriş zamanı.' },
    ] }],
  },
  ayarlar: {
    title: 'Ayarlar',
    subtitle: 'İşletme, entegrasyon ve veri politikaları.',
    groups: [{ title: 'Genel', items: [
      { id: 'isletme', label: 'İşletme', description: 'Terapist ve işletme bilgileri.' },
      { id: 'entegrasyonlar', label: 'Entegrasyonlar', description: 'Servislerin yapılandırma durumu.' },
      { id: 'kvkk', label: 'KVKK ve Veri', description: 'Veri saklama ve izin ayarları.' },
      { id: 'gorunum', label: 'Görünüm', description: 'Yönetim paneli görünümü.' },
    ] }],
  },
  arsiv: {
    title: 'Arşiv',
    subtitle: 'Pasif kayıtlar, geri yükleme ve işlem geçmişi.',
    groups: [{ title: 'Arşiv', items: [
      { id: 'arsivlenenler', label: 'Arşivlenen Kayıtlar', description: 'Pasif danışan ve hizmetler.' },
      { id: 'islem-gecmisi', label: 'İşlem Geçmişi', description: 'Son yönetim işlemleri.' },
    ] }],
  },
};

export function getModuleConfig(activeMenuItem: string): ModuleConfig | null {
  return configs[activeMenuItem] ?? null;
}

export function getDefaultModuleItemId(activeMenuItem: string): string {
  return getModuleConfig(activeMenuItem)?.groups[0]?.items[0]?.id ?? '';
}

export function findModuleItem(activeMenuItem: string, id: string): ModuleItem | null {
  const config = getModuleConfig(activeMenuItem);
  if (!config) return null;
  return config.groups.flatMap((group) => group.items).find((item) => item.id === id) ?? null;
}
