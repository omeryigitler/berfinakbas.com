import { useEffect, useState } from 'react';
import { CustomSelect } from './CustomSelect';
import { 
  Search, Phone, Mail, X, Calendar, DollarSign, FileText, Settings, Layers, Lock, 
  ShieldCheck, HelpCircle, LayoutDashboard, Clock, Users, CheckSquare, Zap, 
  History, Sparkles, ArrowRight, TrendingUp, AlertCircle, CreditCard,
  Filter, ArrowUpDown, UserPlus, ChevronDown, Check, RotateCcw, SlidersHorizontal, User
} from 'lucide-react';

interface MyWorkPanelProps {
  selectedLeadId: string;
  onSelectLead: (id: string) => void;
  activeMenuItem: string;
  clients: Client[];
  onAddClient: (newClient: Client) => void;
}

interface WorkItem {
  id: string;
  name: string;
  avatar: string;
  role: string;
  score: number;
  date: string;
  type: 'mail' | 'phone' | 'custom';
  category: string;
  scoreBg: string;
  scoreText: string;
  badgeBorder: string;
}

export interface Client {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  status: 'Aktif' | 'Potansiyel' | 'Pasif' | 'Arşivlenmiş';
  ageGroup: 'Yetişkin' | 'Çocuk';
  service: string;
  activePlan: string;
  paymentStatus: 'Ödendi' | 'Borçlu' | 'Bekleniyor';
  registrationDate: string;
  lastAppointment: string;
  nextAppointment: string;
  parentName: string;
  source: string;
  planRemainingSessions: number;
  isNew?: boolean;
}

const MENU_TITLES: Record<string, string> = {
  'ana-panel': 'Ana Panel Gündemi',
  'randevular': 'Randevular Listesi',
  'takvim-uygunluk': 'Takvim ve Uygunluk',
  'talepler-iletisim': 'Yeni Talepler',
  'danisanlar': 'Danışanlar Listesi',
  'hizmetler': 'Hizmet Paketleri',
  'odeme-planlar': 'Ödemeler ve Planlar',
  'pdf-kaynaklar': 'Kütüphane ve PDFler',
  'site-icerigi': 'Site İçerik Yönetimi',
  'raporlar': 'Performans Raporları',
  'kullanicilar-yetkiler': 'Kullanıcılar ve Yetkiler',
  'ayarlar': 'Sistem Ayarları',
  'arsiv': 'Arşivlenmiş Kayıtlar'
};

export const INITIAL_CLIENTS: Client[] = [];

const CATEGORY_ITEMS: Record<string, WorkItem[]> = {
  'danisanlar': [], // Fallback if needed, we'll override for danisanlar tab!
  'ana-panel': [
    {
      id: 'genel-bakis',
      name: 'Genel Bakış',
      avatar: '',
      role: 'Sistem Durumu ve Özet Bilgiler',
      score: 100,
      date: 'Canlı',
      type: 'custom',
      category: 'Göstergeler',
      scoreBg: 'bg-black',
      scoreText: 'text-white',
      badgeBorder: 'border-white/40'
    },
    {
      id: 'bugunun-ozeti',
      name: 'Bugünün Özeti',
      avatar: '',
      role: 'Günlük Seanslar ve Randevular',
      score: 95,
      date: 'Bugün',
      type: 'custom',
      category: 'Gündem',
      scoreBg: 'bg-[#ecfdf5]',
      scoreText: 'text-emerald-600',
      badgeBorder: 'border-emerald-100'
    },
    {
      id: 'finans-ozeti',
      name: 'Finans Özeti',
      avatar: '',
      role: 'Gelirler ve Beklenen Ödemeler',
      score: 92,
      date: 'Finans',
      type: 'custom',
      category: 'Ödemeler',
      scoreBg: 'bg-[#eafda8]',
      scoreText: 'text-black',
      badgeBorder: 'border-black/20'
    },
    {
      id: 'bekleyen-islemler',
      name: 'Bekleyen İşlemler',
      avatar: '',
      role: 'Onaylar, Yaklaşan İşler ve Eksikler',
      score: 74,
      date: 'Beklemede',
      type: 'custom',
      category: 'İşlemler',
      scoreBg: 'bg-rose-50',
      scoreText: 'text-rose-600',
      badgeBorder: 'border-rose-100'
    },
    {
      id: 'hizli-islemler',
      name: 'Hızlı İşlemler',
      avatar: '',
      role: 'Yeni Randevu, Danışan veya Hizmet',
      score: 100,
      date: 'Kısayol',
      type: 'custom',
      category: 'Aksiyonlar',
      scoreBg: 'bg-emerald-50',
      scoreText: 'text-emerald-600',
      badgeBorder: 'border-emerald-100'
    },
    {
      id: 'son-islemler',
      name: 'Son İşlemler',
      avatar: '',
      role: 'Sistemde Yapılan Son Değişiklikler',
      score: 80,
      date: 'Geçmiş',
      type: 'custom',
      category: 'Loglar',
      scoreBg: 'bg-gray-100',
      scoreText: 'text-gray-600',
      badgeBorder: 'border-gray-200'
    }
  ],
};

const DANISAN_GRUPLARI = [
  { id: 'tum', label: 'Tüm Danışanlar' },
  { id: 'aktif', label: 'Aktif Danışanlar' },
  { id: 'potansiyel', label: 'Potansiyel Danışanlar' },
  { id: 'pasif', label: 'Pasif Danışanlar' },
  { id: 'arsivlenen', label: 'Arşivlenen Danışanlar' },
  { id: 'yetiskin', label: 'Yetişkin Danışanlar' },
  { id: 'cocuk', label: 'Çocuk Danışanlar' },
  { id: 'borclular', label: 'Borcu Bulunanlar' },
  { id: 'yaklasan', label: 'Yaklaşan Randevusu Olanlar' },
  { id: 'randevusuz', label: 'Randevusu Olmayanlar' },
  { id: 'plani_biten', label: 'Planı Bitmek Üzere Olanlar' },
  { id: 'seansi_biten', label: 'Seansı Bitmek Üzere Olanlar' },
  { id: 'yeni_eklenenler', label: 'Yeni Eklenenler' }
];

const statusOptions = [
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Potansiyel', label: 'Potansiyel' },
  { value: 'Pasif', label: 'Pasif' },
  { value: 'Arşivlenmiş', label: 'Arşivlenmiş' }
];

const statusFilterOptions = [
  { value: 'Tüm', label: 'Tüm Durumlar' },
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Potansiyel', label: 'Potansiyel' },
  { value: 'Pasif', label: 'Pasif' },
  { value: 'Arşivlenmiş', label: 'Arşivlenmiş' }
];

const ageGroupOptions = [
  { value: 'Yetişkin', label: 'Yetişkin' },
  { value: 'Çocuk', label: 'Çocuk' }
];

const ageGroupFilterOptions = [
  { value: 'Tüm', label: 'Tüm Yaş Grupları' },
  { value: 'Yetişkin', label: 'Yetişkin' },
  { value: 'Çocuk', label: 'Çocuk' }
];

const serviceOptions = [
  { value: 'Diyet ve Beslenme', label: 'Diyet ve Beslenme' },
  { value: 'Bireysel Yaşam Koçluğu', label: 'Bireysel Yaşam Koçluğu' },
  { value: 'Bireysel Psikoterapi', label: 'Bireysel Psikoterapi' },
  { value: 'Çocuk Gelişimi ve Pedagoji', label: 'Çocuk Gelişimi ve Pedagoji' },
  { value: 'Kariyer ve Yönetici Mentorluğu', label: 'Kariyer ve Yönetici Mentorluğu' }
];

const serviceFilterOptions = [
  { value: 'Tüm', label: 'Tüm Hizmetler' },
  { value: 'Diyet ve Beslenme', label: 'Diyet ve Beslenme' },
  { value: 'Bireysel Yaşam Koçluğu', label: 'Bireysel Yaşam Koçluğu' },
  { value: 'Bireysel Psikoterapi', label: 'Bireysel Psikoterapi' },
  { value: 'Çocuk Gelişimi ve Pedagoji', label: 'Çocuk Gelişimi ve Pedagoji' },
  { value: 'Kariyer ve Yönetici Mentorluğu', label: 'Kariyer ve Yönetici Mentorluğu' }
];

const planOptions = [
  { value: '3 Aylık Takip', label: '3 Aylık Takip' },
  { value: 'Haftalık Seans', label: 'Haftalık Seans' },
  { value: 'Aylık Takip', label: 'Aylık Takip' },
  { value: 'Yok', label: 'Plan Yok' }
];

const planFilterOptions = [
  { value: 'Tüm', label: 'Tüm Planlar' },
  { value: '3 Aylık Takip', label: '3 Aylık Takip' },
  { value: 'Haftalık Seans', label: 'Haftalık Seans' },
  { value: 'Aylık Takip', label: 'Aylık Takip' },
  { value: '6 Aylık Takip', label: '6 Aylık Takip' },
  { value: 'Tek Seans', label: 'Tek Seans' },
  { value: 'Yok', label: 'Plan Yok' }
];

const paymentStatusOptions = [
  { value: 'Ödendi', label: 'Ödendi' },
  { value: 'Borçlu', label: 'Borçlu' },
  { value: 'Bekleniyor', label: 'Bekleniyor' }
];

const paymentStatusFilterOptions = [
  { value: 'Tüm', label: 'Tüm Ödemeler' },
  { value: 'Ödendi', label: 'Ödendi' },
  { value: 'Borçlu', label: 'Borçlu' },
  { value: 'Bekleniyor', label: 'Bekleniyor' }
];

const sourceOptions = [
  { value: 'Web Sitesi', label: 'Web Sitesi' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Referans', label: 'Referans' },
  { value: 'Diğer', label: 'Diğer' }
];

const sourceFilterOptions = [
  { value: 'Tüm', label: 'Tüm Kaynaklar' },
  { value: 'Web Sitesi', label: 'Web Sitesi' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Referans', label: 'Referans' },
  { value: 'Diğer', label: 'Diğer' }
];

export default function MyWorkPanel({ selectedLeadId, onSelectLead, activeMenuItem, clients, onAddClient }: MyWorkPanelProps) {
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Group state
  const [activeGroup, setActiveGroup] = useState<string>('tum');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  // Sorting state
  const [sortOption, setSortOption] = useState<string>('isim-az');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filters Form state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  // Filter Fields
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fStatus, setFStatus] = useState('Tüm');
  const [fAgeGroup, setFAgeGroup] = useState('Tüm');
  const [fService, setFService] = useState('Tüm');
  const [fActivePlan, setFActivePlan] = useState('Tüm');
  const [fPaymentStatus, setFPaymentStatus] = useState('Tüm');
  const [fRegDate, setFRegDate] = useState('');
  const [fLastApp, setFLastApp] = useState('');
  const [fNextApp, setFNextApp] = useState('');
  const [fParent, setFParent] = useState('');
  const [fSource, setFSource] = useState('Tüm');

  // Add New Client form state
  const [showAddModal, setShowAddModal] = useState(false);

  // Real active services drive both the "new client" and the filter dropdowns; the
  // hardcoded serviceOptions/serviceFilterOptions are only a fallback before the fetch.
  const [realServiceOptions, setRealServiceOptions] = useState(serviceOptions);
  const [realServiceFilterOptions, setRealServiceFilterOptions] = useState(serviceFilterOptions);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/appointment-prerequisites', { headers: { accept: 'application/json' } });
        if (!res.ok) return;
        const payload = await res.json();
        const svcs = (payload?.data?.services ?? []).map((s: any) => ({ value: s.name, label: s.name }));
        if (!cancelled && svcs.length > 0) {
          setRealServiceOptions(svcs);
          setRealServiceFilterOptions([{ value: 'Tüm', label: 'Tüm Hizmetler' }, ...svcs]);
        }
      } catch {
        /* keep the demo fallback lists when the API is unavailable */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'Aktif' as Client['status'],
    ageGroup: 'Yetişkin' as Client['ageGroup'],
    service: '',
    activePlan: 'Yok',
    paymentStatus: 'Ödendi' as Client['paymentStatus'],
    parentName: '',
    source: 'Web Sitesi',
    planRemainingSessions: 0
  });

  const handleClearFilters = () => {
    setFName('');
    setFPhone('');
    setFEmail('');
    setFStatus('Tüm');
    setFAgeGroup('Tüm');
    setFService('Tüm');
    setFActivePlan('Tüm');
    setFPaymentStatus('Tüm');
    setFRegDate('');
    setFLastApp('');
    setFNextApp('');
    setFParent('');
    setFSource('Tüm');
    setIsFilterActive(false);
  };

  // Dynamically calculate counts for groups badge
  const getGroupCount = (groupId: string) => {
    return clients.filter(c => {
      if (groupId === 'tum') return true;
      if (groupId === 'aktif') return c.status === 'Aktif';
      if (groupId === 'potansiyel') return c.status === 'Potansiyel';
      if (groupId === 'pasif') return c.status === 'Pasif';
      if (groupId === 'arsivlenen') return c.status === 'Arşivlenmiş';
      if (groupId === 'yetiskin') return c.ageGroup === 'Yetişkin';
      if (groupId === 'cocuk') return c.ageGroup === 'Çocuk';
      if (groupId === 'borclular') return c.paymentStatus === 'Borçlu';
      if (groupId === 'yaklasan') return c.nextAppointment !== '';
      if (groupId === 'randevusuz') return c.nextAppointment === '';
      if (groupId === 'plani_biten') return c.planRemainingSessions <= 2 && c.activePlan !== 'Yok';
      if (groupId === 'seansi_biten') return c.planRemainingSessions === 1;
      if (groupId === 'yeni_eklenenler') return !!c.isNew;
      return true;
    }).length;
  };

  // Match logic for filtering
  const filteredAndSortedClients = clients.filter(c => {
    // 1. Group check
    if (activeGroup === 'aktif' && c.status !== 'Aktif') return false;
    if (activeGroup === 'potansiyel' && c.status !== 'Potansiyel') return false;
    if (activeGroup === 'pasif' && c.status !== 'Pasif') return false;
    if (activeGroup === 'arsivlenen' && c.status !== 'Arşivlenmiş') return false;
    if (activeGroup === 'yetiskin' && c.ageGroup !== 'Yetişkin') return false;
    if (activeGroup === 'cocuk' && c.ageGroup !== 'Çocuk') return false;
    if (activeGroup === 'borclular' && c.paymentStatus !== 'Borçlu') return false;
    if (activeGroup === 'yaklasan' && c.nextAppointment === '') return false;
    if (activeGroup === 'randevusuz' && c.nextAppointment !== '') return false;
    if (activeGroup === 'plani_biten' && (c.planRemainingSessions > 2 || c.activePlan === 'Yok')) return false;
    if (activeGroup === 'seansi_biten' && c.planRemainingSessions !== 1) return false;
    if (activeGroup === 'yeni_eklenenler' && !c.isNew) return false;

    // 2. Search bar check
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.parentName.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // 3. Detailed Filters form check
    if (isFilterActive) {
      if (fName && !c.name.toLowerCase().includes(fName.toLowerCase())) return false;
      if (fPhone && !c.phone.toLowerCase().includes(fPhone.toLowerCase())) return false;
      if (fEmail && !c.email.toLowerCase().includes(fEmail.toLowerCase())) return false;
      if (fStatus !== 'Tüm' && c.status !== fStatus) return false;
      if (fAgeGroup !== 'Tüm' && c.ageGroup !== fAgeGroup) return false;
      if (fService !== 'Tüm' && c.service !== fService) return false;
      if (fActivePlan !== 'Tüm' && c.activePlan !== fActivePlan) return false;
      if (fPaymentStatus !== 'Tüm' && c.paymentStatus !== fPaymentStatus) return false;
      if (fRegDate && !c.registrationDate.includes(fRegDate)) return false;
      if (fLastApp && !c.lastAppointment.includes(fLastApp)) return false;
      if (fNextApp && !c.nextAppointment.includes(fNextApp)) return false;
      if (fParent && !c.parentName.toLowerCase().includes(fParent.toLowerCase())) return false;
      if (fSource !== 'Tüm' && c.source !== fSource) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortOption === 'isim-az') {
      return a.name.localeCompare(b.name, 'tr');
    }
    if (sortOption === 'isim-za') {
      return b.name.localeCompare(a.name, 'tr');
    }
    if (sortOption === 'tarih-yeni') {
      return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
    }
    if (sortOption === 'tarih-eski') {
      return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
    }
    if (sortOption === 'seans-azalan') {
      return b.planRemainingSessions - a.planRemainingSessions;
    }
    if (sortOption === 'seans-artan') {
      return a.planRemainingSessions - b.planRemainingSessions;
    }
    return 0;
  });

  const [nameError, setNameError] = useState(false);
  const handleSaveNewClient = () => {
    if (!newClient.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    const newId = newClient.name.toLowerCase().replace(/\s+/g, '_');
    const newlyCreated: Client = {
      id: newId,
      name: newClient.name,
      avatar: '', // initials avatar, consistent with API-loaded clients
      phone: newClient.phone || 'Girilmedi',
      email: newClient.email || 'Girilmedi',
      status: newClient.status,
      ageGroup: newClient.ageGroup,
      service: newClient.service,
      activePlan: newClient.activePlan,
      paymentStatus: newClient.paymentStatus,
      registrationDate: new Date().toISOString().split('T')[0],
      lastAppointment: '',
      nextAppointment: '',
      parentName: newClient.ageGroup === 'Çocuk' ? newClient.parentName : '',
      source: newClient.source,
      planRemainingSessions: Number(newClient.planRemainingSessions) || 0,
      isNew: true
    };

    onAddClient(newlyCreated);
    setShowAddModal(false);
    onSelectLead(newId); // auto select the new lead!
    
    // reset form fields
    setNewClient({
      name: '',
      phone: '',
      email: '',
      status: 'Aktif',
      ageGroup: 'Yetişkin',
      service: '',
      activePlan: 'Yok',
      paymentStatus: 'Ödendi',
      parentName: '',
      source: 'Web Sitesi',
      planRemainingSessions: 0
    });
  };

  // Fallback items calculation for other tabs
  const currentItems = CATEGORY_ITEMS[activeMenuItem] || CATEGORY_ITEMS.danisanlar;
  const panelTitle = MENU_TITLES[activeMenuItem] || 'Danışanlar';

  const otherFilteredItems = currentItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      id="my-work-panel"
      className="w-[340px] bg-crm-panel rounded-[2.5rem] border border-gray-300/40 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-5rem)] shrink-0 select-none relative"
    >
      {/* ----------------------------------------------------------------- */}
      {/* EXCLUSIVE STATEFUL VIEW FOR 'DANISANLAR' TAB */}
      {/* ----------------------------------------------------------------- */}
      {activeMenuItem === 'danisanlar' ? (
        <>
          {/* Header */}
          <div className="p-5 pb-3 flex items-center justify-between border-b border-black/[0.02]">
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Danışan Portföyü</h2>
              <span className="text-[10px] text-gray-400 font-bold mt-1.5">Sistemdeki danışanların akıllı listesi.</span>
            </div>
            
            {/* New Client action icon */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-8 h-8 rounded-full bg-black text-[#eafda8] hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Yeni Danışan Ekle"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Group Filter Dropdown Trigger Button */}
          <div className="px-4 py-2 border-b border-black/[0.02] bg-white/40">
            <button 
              onClick={() => {
                setShowGroupDropdown(!showGroupDropdown);
                setShowSortDropdown(false);
              }}
              className="w-full px-3.5 py-2 rounded-2xl bg-white border border-gray-200 hover:border-black/20 text-left text-xs font-black text-gray-800 flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400 font-bold">Grup:</span> 
                {DANISAN_GRUPLARI.find(g => g.id === activeGroup)?.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Group dropdown panel */}
          {showGroupDropdown && (
            <div className="absolute left-4 right-4 top-[105px] bg-white border border-gray-200 rounded-[2rem] shadow-xl z-20 overflow-hidden max-h-[350px] overflow-y-auto animate-fade-in p-2.5 space-y-1">
              <span className="text-[9px] text-gray-400 font-black tracking-widest uppercase block px-3 py-1.5 border-b border-gray-50">DANIŞAN GRUPLARI</span>
              {DANISAN_GRUPLARI.map(group => {
                const count = getGroupCount(group.id);
                const isSelected = activeGroup === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveGroup(group.id);
                      setShowGroupDropdown(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-[#eafda8] text-gray-950 font-black' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    <span>{group.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isSelected ? 'bg-black text-[#eafda8]' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Operational Tools Bar: Search input + Actions line */}
          <div className="px-4 pt-3 pb-2 flex flex-col gap-2 bg-white/20 border-b border-black/[0.01]">
            {/* Inline search bar always ready */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Danışan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200/80 rounded-2xl py-2 pl-9 pr-8 text-xs text-gray-950 placeholder-gray-400 focus:outline-none focus:border-black/30 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-black focus:outline-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sub-Operations Row (Filtrele, Sırala, Filtreleri Temizle) */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                {/* Advanced Filter drawer toggle */}
                <button
                  onClick={() => {
                    setShowFilterDrawer(true);
                    setShowGroupDropdown(false);
                    setShowSortDropdown(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 transition-all cursor-pointer ${
                    isFilterActive 
                      ? 'bg-black border-black text-[#eafda8]' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-black/20 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filtrele
                </button>

                {/* Sort Toggle dropdown trigger */}
                <button
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowGroupDropdown(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-black/20 hover:bg-gray-50 text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sırala
                </button>
              </div>

              {/* Clear filters shortcut indicator */}
              {(isFilterActive || searchQuery !== '') && (
                <button
                  onClick={() => {
                    handleClearFilters();
                    setSearchQuery('');
                  }}
                  className="text-[10px] font-black text-rose-600 hover:text-rose-700 hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* Quick Sort dropdown */}
          {showSortDropdown && (
            <div className="absolute left-4 right-4 top-[170px] bg-white border border-gray-200 rounded-[2rem] shadow-xl z-20 overflow-hidden animate-fade-in p-2.5 space-y-1">
              <span className="text-[9px] text-gray-400 font-black tracking-widest uppercase block px-3 py-1.5 border-b border-gray-50">Sıralama Seçenekleri</span>
              {[
                { id: 'isim-az', label: 'Ad Soyad (A - Z)' },
                { id: 'isim-za', label: 'Ad Soyad (Z - A)' },
                { id: 'tarih-yeni', label: 'Kayıt Tarihi (En Yeni)' },
                { id: 'tarih-eski', label: 'Kayıt Tarihi (En Eski)' },
                { id: 'seans-azalan', label: 'Kalan Seans (Azalan)' },
                { id: 'seans-artan', label: 'Kalan Seans (Artan)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortOption(opt.id);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    sortOption === opt.id 
                      ? 'bg-black text-[#eafda8] font-black' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortOption === opt.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Filter Badge indicator line if filter is active */}
          {isFilterActive && (
            <div className="px-4 py-1.5 bg-[#eafda8]/20 border-b border-black/[0.01] flex items-center justify-between">
              <span className="text-[9px] font-black text-gray-700 uppercase tracking-tight">Özel Detaylı Filtre Aktif</span>
              <button 
                onClick={handleClearFilters}
                className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
              >
                İptal Et
              </button>
            </div>
          )}

          {/* Clients List area */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-4">
            {filteredAndSortedClients.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <span className="text-xs text-gray-400 font-extrabold block uppercase tracking-wider">Hiç Danışan Bulunamadı</span>
                <p className="text-[10px] text-gray-400 mt-1">Belirttiğiniz kriterlere uygun kayıt bulunamadı.</p>
                <button 
                  onClick={() => {
                    handleClearFilters();
                    setSearchQuery('');
                    setActiveGroup('tum');
                  }}
                  className="mt-4 px-3 py-1.5 rounded-xl bg-black text-[#eafda8] text-[9px] font-black uppercase tracking-wider cursor-pointer hover:bg-gray-800"
                >
                  Tümünü Göster
                </button>
              </div>
            ) : (
              filteredAndSortedClients.map(c => {
                const isActive = selectedLeadId === c.id;
                
                // Color configuration depending on ageGroup or balance
                const isDebt = c.paymentStatus === 'Borçlu';
                const isChild = c.ageGroup === 'Çocuk';
                
                return (
                  <div key={c.id} className="flex flex-col gap-1.5 animate-fade-in">
                    <div 
                      onClick={() => onSelectLead(c.id)}
                      className={`transition-all duration-300 rounded-[2.2rem] p-4.5 flex flex-col gap-3 cursor-pointer border relative overflow-hidden group ${
                        isActive 
                          ? 'bg-gradient-to-br from-[#eafda8] to-[#dcfb61] border-black/10 shadow-lg shadow-[#eafda8]/20 scale-[1.01]' 
                          : 'bg-white hover:bg-[#eafda8]/5 border-gray-100 hover:border-[#eafda8]/30 hover:shadow-xs'
                      }`}
                    >
                      {/* Card upper content: Photo + name + type badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-xs border shrink-0 transition-all group-hover:scale-105 ${
                              isActive 
                                ? 'bg-black text-[#eafda8] border-black/10' 
                                : 'bg-black text-[#eafda8] border-black/5'
                            }`}>
                              {getInitials(c.name)}
                            </div>
                            {c.isNew && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white animate-pulse" />
                            )}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className={`text-[13px] font-black tracking-tight leading-tight ${isActive ? 'text-gray-950' : 'text-gray-900'}`}>
                              {c.name}
                            </span>
                            <span className={`text-[10px] ${isActive ? 'text-gray-800 font-semibold' : 'text-gray-400'} mt-0.5`}>
                              {c.service}
                            </span>
                          </div>
                        </div>

                        {/* Guardian indicator or right status arrow */}
                        <div className="flex items-center gap-1.5">
                          {isChild && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase border border-indigo-100/40">
                              Çocuk
                            </span>
                          )}
                          {isDebt && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[8px] font-black uppercase border border-rose-100/40 animate-pulse">
                              Borç
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Micro Info tags: Registered / Last Appointment */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/[0.03] text-[9.5px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-black/10 text-gray-950' : 'bg-gray-50 text-gray-500'
                        }`}>
                          Plan: {c.activePlan}
                        </span>
                        
                        {c.planRemainingSessions > 0 && (
                          <span className={`px-2 py-0.5 rounded-full font-black ${
                            c.planRemainingSessions <= 2 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                              : isActive ? 'bg-black/10 text-gray-800' : 'bg-lime-50 text-lime-800'
                          }`}>
                            Kalan {c.planRemainingSessions} Seans
                          </span>
                        )}
                      </div>

                      {/* Bottom line: Timestamps */}
                      <div className="flex justify-between items-center text-[8.5px] font-bold text-gray-400 uppercase tracking-wider pt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-300" />
                          Kayıt: {c.registrationDate}
                        </span>
                        <span>{c.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SLIDING advanced filtering drawer panel inside middle section */}
          {/* ------------------------------------------------------------- */}
          {showFilterDrawer && (
            <div className="absolute inset-0 bg-crm-panel/95 backdrop-blur-md z-30 p-5 flex flex-col justify-between animate-fade-in border-r border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/[0.04] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gray-700" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Portföy Filtreleri</h3>
                </div>
                <button 
                  onClick={() => setShowFilterDrawer(false)}
                  className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer shadow-2xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input elements for all 13 filters requested by the user */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-4 text-left">
                {/* 1. Ad ve soyad */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider">Ad ve Soyad</label>
                  <input 
                    type="text" 
                    placeholder="Danışan ad soyad..."
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* 2. Telefon */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider">Telefon</label>
                  <input 
                    type="text" 
                    placeholder="Telefon no..."
                    value={fPhone}
                    onChange={(e) => setFPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* 3. E-posta */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider">E-posta</label>
                  <input 
                    type="text" 
                    placeholder="E-posta adresi..."
                    value={fEmail}
                    onChange={(e) => setFEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* 4. Danışan durumu */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Danışan Durumu"
                    options={statusFilterOptions}
                    value={fStatus}
                    onChange={(val) => setFStatus(val)}
                  />
                </div>

                {/* 5. Çocuk / Yetişkin */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Çocuk / Yetişkin"
                    options={ageGroupFilterOptions}
                    value={fAgeGroup}
                    onChange={(val) => setFAgeGroup(val)}
                  />
                </div>

                {/* 6. Hizmet */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Hizmet"
                    options={realServiceFilterOptions}
                    value={fService}
                    onChange={(val) => setFService(val)}
                  />
                </div>

                {/* 7. Aktif plan */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Aktif Plan"
                    options={planFilterOptions}
                    value={fActivePlan}
                    onChange={(val) => setFActivePlan(val)}
                  />
                </div>

                {/* 8. Ödeme durumu */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Ödeme Durumu"
                    options={paymentStatusFilterOptions}
                    value={fPaymentStatus}
                    onChange={(val) => setFPaymentStatus(val)}
                  />
                </div>

                {/* 9. Kayıt tarihi */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider">Kayıt Tarihi (Yıl/Ay/Gün)</label>
                  <input 
                    type="text" 
                    placeholder="Örn: 2026-07..."
                    value={fRegDate}
                    onChange={(e) => setFRegDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* 10. Son randevu */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider">Son Randevu Tarihi</label>
                  <input 
                    type="text" 
                    placeholder="Örn: 2026-07-15..."
                    value={fLastApp}
                    onChange={(e) => setFLastApp(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* 11. Sonraki randevu */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider">Sonraki Randevu Tarihi</label>
                  <input 
                    type="text" 
                    placeholder="Örn: 2026-07-22..."
                    value={fNextApp}
                    onChange={(e) => setFNextApp(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* 12. Veli */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider">Veli Adı Soyadı</label>
                  <input 
                    type="text" 
                    placeholder="Veli adı..."
                    value={fParent}
                    onChange={(e) => setFParent(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* 13. Kayıt kaynağı */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Kayıt Kaynağı"
                    options={sourceFilterOptions}
                    value={fSource}
                    onChange={(val) => setFSource(val)}
                  />
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex gap-2.5 pt-3.5 border-t border-black/[0.04] bg-white/50">
                <button 
                  onClick={handleClearFilters}
                  className="flex-1 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-black font-extrabold text-[10.5px] uppercase tracking-wider cursor-pointer"
                >
                  Sıfırla
                </button>
                <button 
                  onClick={() => {
                    setIsFilterActive(true);
                    setShowFilterDrawer(false);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-black text-[#eafda8] hover:bg-gray-800 font-extrabold text-[10.5px] uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Uygula ({filteredAndSortedClients.length})
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SLIDING NEW CLIENT DRAWER                                     */}
          {/* ------------------------------------------------------------- */}
          {showAddModal && (
            <div className="absolute inset-0 bg-crm-panel/95 backdrop-blur-md z-30 p-5 flex flex-col justify-between animate-fade-in border-r border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/[0.04] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-gray-700" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Yeni Danışan</h3>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer shadow-2xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input Fields */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-4 text-left">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider block">Adı ve Soyadı *</label>
                  <input
                    type="text"
                    placeholder="Adı Soyadı"
                    value={newClient.name}
                    onChange={(e) => { setNewClient({ ...newClient, name: e.target.value }); if (nameError) setNameError(false); }}
                    className={`w-full bg-white border rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none ${nameError ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 focus:border-black/30'}`}
                  />
                  {nameError && <span className="text-[10px] text-rose-600 font-bold block mt-1">Lütfen danışanın adını ve soyadını girin.</span>}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider block">Telefonu</label>
                  <input 
                    type="text" 
                    placeholder="05XX-XXX-XXXX"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider block">E-postası</label>
                  <input 
                    type="email" 
                    placeholder="danisan@e-posta.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Danışan Durumu"
                    options={statusOptions}
                    value={newClient.status}
                    onChange={(val) => setNewClient({ ...newClient, status: val as Client['status'] })}
                  />
                </div>

                {/* Child or Adult */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Yaş Grubu"
                    options={ageGroupOptions}
                    value={newClient.ageGroup}
                    onChange={(val) => setNewClient({ ...newClient, ageGroup: val as Client['ageGroup'] })}
                  />
                </div>

                {/* Conditional Veli input if age group is Kid */}
                {newClient.ageGroup === 'Çocuk' && (
                  <div className="space-y-1 animate-fade-in bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/30">
                    <label className="text-[9.5px] font-black text-indigo-800 uppercase tracking-wider block">Veli Adı Soyadı *</label>
                    <input 
                      type="text" 
                      placeholder="Annesi veya Babası"
                      value={newClient.parentName}
                      onChange={(e) => setNewClient({ ...newClient, parentName: e.target.value })}
                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-indigo-300"
                    />
                  </div>
                )}

                {/* Service type */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Hizmet Seansı"
                    options={realServiceOptions}
                    value={newClient.service}
                    onChange={(val) => setNewClient({ ...newClient, service: val })}
                  />
                </div>

                {/* Active Plan */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Plan Paketi"
                    options={planOptions}
                    value={newClient.activePlan}
                    onChange={(val) => setNewClient({ ...newClient, activePlan: val })}
                  />
                </div>

                {/* Plan remaining sessions */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black text-gray-500 uppercase tracking-wider block">Kalan Toplam Seans</label>
                  <input 
                    type="number" 
                    placeholder="10"
                    value={newClient.planRemainingSessions}
                    onChange={(e) => setNewClient({ ...newClient, planRemainingSessions: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black/30"
                  />
                </div>

                {/* Payment status */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Ödeme Durumu"
                    options={paymentStatusOptions}
                    value={newClient.paymentStatus}
                    onChange={(val) => setNewClient({ ...newClient, paymentStatus: val as Client['paymentStatus'] })}
                  />
                </div>

                {/* Registration source */}
                <div className="space-y-1">
                  <CustomSelect
                    label="Kayıt Kaynağı"
                    options={sourceOptions}
                    value={newClient.source}
                    onChange={(val) => setNewClient({ ...newClient, source: val })}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-3.5 border-t border-black/[0.04] bg-white/50">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-black font-extrabold text-[10.5px] uppercase tracking-wider cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  onClick={handleSaveNewClient}
                  className="flex-1 py-2.5 rounded-2xl bg-black text-[#eafda8] hover:bg-gray-800 font-extrabold text-[10.5px] uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Panel Header */}
          <div className="p-6 pb-2.5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{panelTitle}</h2>
            
            {/* Only Search Toggle Button */}
            <button 
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-200 cursor-pointer focus:outline-none ${
                showSearch 
                  ? 'bg-black border-black text-white' 
                  : 'border-gray-400/20 bg-white/40 text-gray-500 hover:bg-gray-100 hover:text-black'
              }`}
              title="Ara"
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery('');
              }}
            >
              <Search className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>

          {/* Expandable Search Input */}
          {showSearch && (
            <div className="px-6 pb-3 animate-fade-in">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="İsim veya filtre ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/60 border border-gray-300/60 rounded-xl py-1.5 pl-9 pr-8 text-xs text-gray-950 placeholder-gray-400 focus:outline-none focus:border-black/50 transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 hover:text-black text-gray-400 focus:outline-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Date Subheader */}
          <div className="px-6 pb-3">
            <div className="flex items-center justify-center gap-2">
              <div className="flex-1 h-[1px] bg-gray-200/60"></div>
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                {searchQuery ? 'Arama Sonuçları' : 'Güncel Liste'}
              </span>
              <div className="flex-1 h-[1px] bg-gray-200/60"></div>
            </div>
          </div>

          {/* Cards List Container */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
            
            {otherFilteredItems.length === 0 ? (
              <div className="text-center py-10 px-4">
                <span className="text-xs text-gray-400 font-semibold block">Arama sonucu bulunamadı: "{searchQuery}"</span>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-[10px] font-bold text-gray-600 hover:text-black underline uppercase tracking-wider"
                >
                  Aramayı Temizle
                </button>
              </div>
            ) : (
              otherFilteredItems.map((item) => {
                const isActive = selectedLeadId === item.id;
                
                if (activeMenuItem === 'ana-panel') {
                  // Redesigned gorgeous custom dashboard cards!
                  let Icon = LayoutDashboard;
                  let iconBg = 'bg-indigo-50 text-indigo-600';
                  let badgeText = 'ÖZET';
                  let statsBadge = '';
                  let statsBg = 'bg-indigo-50 text-indigo-700';

                  if (item.id === 'genel-bakis') {
                    Icon = LayoutDashboard;
                    iconBg = isActive ? 'bg-black text-[#eafda8]' : 'bg-gray-100 text-gray-900';
                    badgeText = 'GÖSTERGE';
                    statsBadge = 'Aktif';
                    statsBg = isActive ? 'bg-black/15 text-gray-900' : 'bg-gray-100 text-gray-800';
                  } else if (item.id === 'bugunun-ozeti') {
                    Icon = Clock;
                    iconBg = isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-600';
                    badgeText = 'GÜNDEM';
                    statsBadge = '4 Seans';
                    statsBg = 'bg-emerald-100 text-emerald-800';
                  } else if (item.id === 'siradaki-randevular') {
                    Icon = Calendar;
                    iconBg = isActive ? 'bg-amber-950 text-amber-300' : 'bg-amber-50 text-amber-600';
                    badgeText = 'PROGRAM';
                    statsBadge = 'Sıradaki';
                    statsBg = 'bg-amber-100 text-amber-800';
                  } else if (item.id === 'finans-ozeti') {
                    Icon = DollarSign;
                    iconBg = isActive ? 'bg-lime-950 text-lime-300' : 'bg-lime-50 text-lime-700';
                    badgeText = 'FİNANS';
                    statsBadge = '6k TL';
                    statsBg = 'bg-[#eafda8] text-lime-950';
                  } else if (item.id === 'danisan-ozeti') {
                    Icon = Users;
                    iconBg = isActive ? 'bg-cyan-950 text-cyan-300' : 'bg-cyan-50 text-cyan-600';
                    badgeText = 'LİSTE';
                    statsBadge = '28 Aktif';
                    statsBg = 'bg-cyan-100 text-cyan-800';
                  } else if (item.id === 'bekleyen-islemler') {
                    Icon = CheckSquare;
                    iconBg = isActive ? 'bg-rose-950 text-rose-300' : 'bg-rose-50 text-rose-600';
                    badgeText = 'GÖREVLER';
                    statsBadge = '7 Bekleyen';
                    statsBg = 'bg-rose-100 text-rose-800';
                  } else if (item.id === 'hizli-islemler') {
                    Icon = Zap;
                    iconBg = isActive ? 'bg-orange-950 text-orange-300' : 'bg-orange-50 text-orange-600';
                    badgeText = 'KISAYOL';
                    statsBadge = '7 Aksiyon';
                    statsBg = 'bg-orange-100 text-orange-800';
                  } else if (item.id === 'son-islemler') {
                    Icon = History;
                    iconBg = isActive ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-600';
                    badgeText = 'LOGLAR';
                    statsBadge = 'Son 4';
                    statsBg = 'bg-slate-200 text-slate-800';
                  }

                  return (
                    <div key={item.id} className="flex flex-col gap-1.5 animate-fade-in">
                      <div 
                        onClick={() => onSelectLead(item.id)}
                        className={`transition-all duration-300 rounded-[2rem] p-4.5 flex flex-col gap-3.5 cursor-pointer border relative overflow-hidden group ${
                          isActive 
                            ? 'bg-gradient-to-br from-[#eafda8] to-[#dcfb61] border-black/10 shadow-lg shadow-[#eafda8]/20 scale-[1.01]' 
                            : 'bg-white hover:bg-[#eafda8]/5 border-gray-100 hover:border-[#eafda8]/30 hover:shadow-xs'
                        }`}
                      >
                        {/* Upper Card Content */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            {/* Beautiful Modern Icon Frame */}
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-xs shrink-0 ${
                              isActive ? 'bg-black text-[#eafda8] rotate-3' : `${iconBg} group-hover:rotate-6`
                            }`}>
                              <Icon className="w-5.5 h-5.5 stroke-[2]" />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[13.5px] font-black tracking-tight leading-snug ${isActive ? 'text-gray-950' : 'text-gray-900'}`}>
                                {item.name}
                              </span>
                              <span className={`text-[10px] mt-0.5 font-bold leading-normal ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                                {item.role}
                              </span>
                            </div>
                          </div>

                          {/* Small visual accent or action arrow */}
                          <div className="flex items-center justify-center">
                            <ArrowRight className={`w-4 h-4 transition-all duration-300 ${
                              isActive 
                                ? 'text-black translate-x-0' 
                                : 'text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                            }`} />
                          </div>
                        </div>

                        {/* Progress Indicator or Soft Stats Display */}
                        {item.id === 'bugunun-ozeti' && (
                          <div className="w-full bg-black/5 rounded-full h-1 mt-0.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isActive ? 'bg-black w-2/4' : 'bg-emerald-500 w-2/4'}`} />
                          </div>
                        )}
                        {item.id === 'finans-ozeti' && (
                          <div className="w-full bg-black/5 rounded-full h-1 mt-0.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isActive ? 'bg-black w-[60%]' : 'bg-lime-600 w-[60%]'}`} />
                          </div>
                        )}
                        {item.id === 'danisan-ozeti' && (
                          <div className="w-full bg-black/5 rounded-full h-1 mt-0.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isActive ? 'bg-black w-[75%]' : 'bg-cyan-500 w-[75%]'}`} />
                          </div>
                        )}
                        {item.id === 'bekleyen-islemler' && (
                          <div className="w-full bg-black/5 rounded-full h-1 mt-0.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isActive ? 'bg-black w-[40%]' : 'bg-rose-500 w-[40%]'}`} />
                          </div>
                        )}

                        {/* Bottom Metadata row */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.03]">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold tracking-widest uppercase ${
                              isActive 
                                ? 'bg-black/10 text-gray-950' 
                                : 'bg-gray-50 text-gray-400'
                            }`}>
                              {badgeText}
                            </span>
                            
                            {/* Secondary micro pill */}
                            <span className={`text-[9px] font-bold ${isActive ? 'text-black/60' : 'text-gray-400'}`}>
                              • {item.date}
                            </span>
                          </div>
                          
                          {/* Interactive pill showing value */}
                          {statsBadge && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tight ${
                              isActive ? 'bg-black text-white shadow-xs' : statsBg
                            }`}>
                              {statsBadge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Below-card status / meta row */}
                      <div className="px-4 flex items-center justify-between text-[9px] font-black tracking-wider text-gray-400 uppercase mt-0.5 mb-1 animate-fade-in">
                        <span>{item.category}</span>
                        <span className="font-bold text-gray-300">GÜNCEL</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.id} className="flex flex-col gap-1.5 animate-fade-in">
                    <div 
                      onClick={() => onSelectLead(item.id)}
                      className={`transition-all duration-200 rounded-[2rem] p-4 flex flex-col gap-3 cursor-pointer shadow-xs border ${
                        isActive 
                          ? 'bg-[#eafda8] border-black/[0.04]' 
                          : 'bg-white hover:bg-gray-50/50 border-gray-200/60'
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border shrink-0 ${
                            isActive 
                              ? 'bg-black text-[#eafda8] border-black/10' 
                              : 'bg-black text-[#eafda8] border-black/5'
                          }`}>
                            {getInitials(item.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                              {item.name}
                            </span>
                            <span className={`text-[10px] ${isActive ? 'text-black/60' : 'text-gray-400'} font-semibold`}>
                              {item.role}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Icon on Right */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs border transition-colors ${
                          isActive 
                            ? 'bg-white/60 text-black/60 border-white/40' 
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}>
                          {item.type === 'mail' ? (
                            <Mail className="w-3.5 h-3.5 stroke-[1.8]" />
                          ) : item.type === 'phone' ? (
                            <Phone className="w-3.5 h-3.5 stroke-[1.8]" />
                          ) : (
                            <Calendar className="w-3.5 h-3.5 stroke-[1.8]" />
                          )}
                        </div>
                      </div>

                      {/* Bottom row */}
                      <div className="flex items-center justify-between">
                        {/* Category Pill */}
                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider ${
                          isActive 
                            ? 'bg-white/40 text-black/50' 
                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                        }`}>
                          {item.category.toUpperCase()}
                        </div>
                        
                        {/* Score badge */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-xs border ${item.scoreBg} ${item.scoreText} ${item.badgeBorder}`}>
                          {item.score}
                        </div>
                      </div>
                    </div>

                    {/* External Card Metadata */}
                    <div className="flex justify-between px-4 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>{item.category}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                );
              })
            )}

          </div>
        </>
      )}
    </div>
  );
}
