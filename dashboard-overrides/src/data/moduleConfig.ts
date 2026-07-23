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
    subtitle: 'Randevu kayıtlarını liste veya takvim üzerinden yönetin.',
    groups: [{ title: 'Görünümler', items: [
      { id: 'liste', label: 'Randevu Listesi', description: 'Talep, onay ve yaklaşan randevular.' },
      { id: 'takvim', label: 'Takvim', description: 'Randevuları günlere göre görüntüleyin.' },
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
        { id: 'entegrasyonlar', label: 'Entegrasyonlar', description: 'Takvim ve bağlı servis durumları.' },
      ] },
    ],
  },
  'talepler-iletisim': {
    title: 'Talepler ve İletişim',
    subtitle: 'Başvurular, iletişim izinleri ve mesaj operasyonları.',
    groups: [{ title: 'Talepler', items: [
      { id: 'talepler', label: 'Talepler', description: 'Yeni ve inceleme bekleyen başvurular.' },
      { id: 'mesaj-sablonlari', label: 'Mesaj Şablonları', description: 'Hazır iletişim metinleri.' },
      { id: 'gonderim-gecmisi', label: 'Gönderim Geçmişi', description: 'Gönderilen mesaj ve e-postalar.' },
      { id: 'iletisim-izinleri', label: 'İletişim İzinleri', description: 'KVKK ve iletişim izinleri.' },
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
    subtitle: 'Danışan planları, taksitler ve ödeme hareketleri.',
    groups: [{ title: 'Finans', items: [
      { id: 'finans-ozeti', label: 'Finans Özeti', description: 'Bakiye, tahsilat ve geciken ödemeler.' },
      { id: 'planlar', label: 'Planlar', description: 'Danışan planları ve seans hakları.' },
      { id: 'odemeler', label: 'Ödemeler', description: 'Tahsilat ve finans hareketleri.' },
    ] }],
  },
  'pdf-kaynaklar': {
    title: 'PDF ve Kaynaklar',
    subtitle: 'Kaynak metadata, yayın durumu ve gönderim ayarları.',
    groups: [{ title: 'Kaynaklar', items: [
      { id: 'pdfler', label: 'PDF ve Kaynaklar', description: 'Yayınlanan ve taslak kaynaklar.' },
      { id: 'talep-kayitlari', label: 'Talep Kayıtları', description: 'Kaynak talep ve gönderim kayıtları.' },
      { id: 'gonderim-ayarlari', label: 'Gönderim Ayarları', description: 'E-posta gönderim ayarları.' },
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
    subtitle: 'Canlı verilerden üretilen operasyon ve finans raporları.',
    groups: [{ title: 'Raporlar', items: [
      { id: 'finans', label: 'Finans', description: 'Tahsilat ve açık bakiye.' },
      { id: 'randevular', label: 'Randevular', description: 'Durum ve zaman dağılımı.' },
      { id: 'danisanlar', label: 'Danışanlar', description: 'Aktiflik ve yaş grubu dağılımı.' },
      { id: 'planlar', label: 'Planlar', description: 'Plan ve seans kullanım özeti.' },
      { id: 'talepler', label: 'Talep ve Dönüşüm', description: 'Talep ve onay dönüşümleri.' },
    ] }],
  },
  'kullanicilar-yetkiler': {
    title: 'Kullanıcılar ve Yetkiler',
    subtitle: 'Yönetim hesapları, roller ve erişim geçmişi.',
    groups: [{ title: 'Erişim', items: [
      { id: 'kullanicilar', label: 'Kullanıcılar', description: 'Aktif ve askıya alınmış hesaplar.' },
      { id: 'roller', label: 'Roller ve Yetkiler', description: 'Rol atamaları ve yetki kapsamı.' },
      { id: 'giris-gecmisi', label: 'Giriş Geçmişi', description: 'Son hesap erişimleri.' },
    ] }],
  },
  ayarlar: {
    title: 'Ayarlar',
    subtitle: 'İşletme, randevu, bildirim ve veri politikaları.',
    groups: [{ title: 'Genel', items: [
      { id: 'isletme', label: 'İşletme', description: 'Terapist ve işletme bilgileri.' },
      { id: 'randevu', label: 'Randevu', description: 'Varsayılan randevu ayarları.' },
      { id: 'bildirimler', label: 'Bildirimler', description: 'E-posta ve panel bildirimleri.' },
      { id: 'entegrasyonlar', label: 'Entegrasyonlar', description: 'Bağlı servisler ve durumları.' },
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
