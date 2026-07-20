import type { ClientDetail } from '@/components/admin/client-dashboard-types';

import type { SalesHubIconName } from './sales-hub-icon';

export const statusLabels: Record<ClientDetail['status'], string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
  PROSPECTIVE: 'Potansiyel',
};

export const salesHubTabs = [
  'Genel Bakış',
  'İletişim Bilgileri',
  'Randevular',
  'Plan ve Seanslar',
  'Ödemeler',
  'Belgeler',
  'İletişim Geçmişi',
  'Operasyonel Notlar',
  'İşlem Geçmişi',
] as const;

export type SalesHubTab = (typeof salesHubTabs)[number];

export interface SalesHubNavigationItem {
  icon: SalesHubIconName;
  id: string;
  label: string;
  route?: string;
}

export const navigationGroups: Array<{
  items: SalesHubNavigationItem[];
  title: string;
}> = [
  {
    title: 'Panel ve Planlama',
    items: [
      { id: 'ana-panel', icon: 'home', label: 'Ana Panel', route: '/yonetim' },
      { id: 'randevular', icon: 'calendar', label: 'Randevular', route: '/yonetim/randevular' },
      {
        id: 'takvim-uygunluk',
        icon: 'calendar',
        label: 'Takvim ve Uygunluk',
        route: '/yonetim/randevular',
      },
      {
        id: 'talepler-iletisim',
        icon: 'message',
        label: 'Talepler ve İletişim',
        route: '/yonetim/randevular',
      },
    ],
  },
  {
    title: 'Hizmetler ve Danışanlar',
    items: [
      { id: 'danisanlar', icon: 'users', label: 'Danışanlar', route: '/yonetim/danisanlar' },
      { id: 'hizmetler', icon: 'card', label: 'Hizmetler' },
      {
        id: 'odeme-planlar',
        icon: 'credit-card',
        label: 'Ödeme ve Planlar',
        route: '/yonetim/odemeler',
      },
      { id: 'pdf-kaynaklar', icon: 'document', label: 'PDF ve Kaynaklar' },
      { id: 'site-icerigi', icon: 'grid', label: 'Site İçeriği' },
    ],
  },
  {
    title: 'Sistem ve Raporlar',
    items: [
      { id: 'raporlar', icon: 'report', label: 'Raporlar' },
      {
        id: 'kullanicilar-yetkiler',
        icon: 'shield',
        label: 'Kullanıcılar ve Yetkiler',
      },
      { id: 'ayarlar', icon: 'settings', label: 'Ayarlar' },
      { id: 'arsiv', icon: 'archive', label: 'Arşiv' },
    ],
  },
];

export const processStages = [
  ['Ön Görüşme', 'First Contact'],
  ['Değerlendirme', 'Qualify'],
  ['Aktif Terapi', 'Develop'],
  ['Gelişim Takibi', 'Propose'],
  ['Mezuniyet', 'Close'],
] as const;
