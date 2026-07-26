import { useEffect, useState } from 'react';
import ClientListView from './ClientListView';
import ClientDetailsHub from './ClientDetailsHub';
import { ClientDetails } from '../types';
import { 
  Save, Plus, Trash2, RotateCw, Key, FileText, Award, GitBranch, MoreHorizontal,
  Mail, Phone, ShieldCheck, ChevronRight, Search, SlidersHorizontal, PlusCircle,
  HelpCircle, Check, Lock, Star, Sparkles, Building2, User2, RefreshCw, Calendar, CreditCard, Activity, Landmark,
  Globe, History, Settings, LayoutDashboard, Clock, Users, CheckSquare, Zap, TrendingUp, ArrowRight, AlertCircle, ThumbsUp, CheckCircle, Ban, CalendarCheck, ArrowUpRight, UserPlus
} from 'lucide-react';

interface WorkspacePanelProps {
  selectedLeadId: string;
  activeMenuItem: string;
  onSelectLead?: (id: string) => void;
  clientsDb: Record<string, ClientDetails>;
  onUpdateClientDetails: (id: string, updatedClient: ClientDetails) => void;
  onDeleteClient: (id: string) => void;
  onOpenWorkspace?: (menuItem: string, itemId: string) => void;
}

export default function WorkspacePanel({ 
  selectedLeadId, 
  activeMenuItem, 
  onSelectLead,
  clientsDb,
  onUpdateClientDetails,
  onDeleteClient,
  onOpenWorkspace
}: WorkspacePanelProps) {
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Ana Panel overview screens (Genel Bakış, Bugünün Özeti, Bekleyen İşlemler)
  // are fed from a single real aggregate endpoint; the layout below is unchanged
  // and simply reads live figures instead of hardcoded demo numbers.
  const [overview, setOverview] = useState<any>(null);
  useEffect(() => {
    if (activeMenuItem !== 'ana-panel') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/dashboard-overview', {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) return;
        const payload = await res.json();
        if (!cancelled) setOverview(payload?.data ?? null);
      } catch {
        /* keep the static layout when the API is unavailable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeMenuItem]);

  const fmtMinor = (minor: string | number | undefined) =>
    `${new Intl.NumberFormat('tr-TR').format(Math.round(Number(minor ?? 0) / 100))} TL`;

  // Render content based on active tab
  if (activeMenuItem !== 'danisanlar') {
    // If it's the main dashboard (ana-panel), render dedicated interactive screens
    if (activeMenuItem === 'ana-panel') {
      if (selectedLeadId === 'genel-bakis') {
        const s = overview?.sessions ?? {};
        const f = overview?.finance ?? {};
        const c = overview?.clients ?? {};
        const p = overview?.plans ?? {};
        return (
          <div className="flex-1 bg-gradient-to-br from-[#eafda8]/65 via-white to-white rounded-[2.5rem] border border-gray-300/40 p-8 flex flex-col h-[calc(100vh-5rem)] shadow-xs overflow-y-auto select-none gap-6 transition-all duration-300 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.04] pb-5">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Genel Bakış</h1>
                <p className="text-xs text-gray-500 font-semibold mt-1">Sistem genel durumu, danışan hareketleri ve günlük operasyon özeti.</p>
              </div>

            </div>

            {/* Gorgeous Custom Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Card 1: Bugünün Seans Analizi */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-black text-[#eafda8] flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 tracking-tight uppercase">GÜNLÜK SEANS ANALİZİ</h3>
                      <p className="text-[10px] text-gray-400 font-bold">Bugün planlanan seans durumu</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black">Bugün</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Bugünkü Toplam</span>
                    <span className="text-4xl font-black text-gray-950 tracking-tight mt-1">{s.total ?? 0} <span className="text-sm font-bold text-gray-400">Randevu</span></span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent flex items-center justify-center font-black text-xs text-emerald-600">
                    {s.completionRate ?? 0}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-3 bg-emerald-50/40 border border-emerald-100/30 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] text-emerald-800 font-extrabold">Tamamlanan</span>
                    <span className="text-xs font-black text-emerald-950">{s.completed ?? 0} Seans</span>
                  </div>
                  <div className="p-3 bg-amber-50/40 border border-amber-100/30 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] text-amber-800 font-extrabold">Bekleyen</span>
                    <span className="text-xs font-black text-amber-950">{s.pending ?? 0} Seans</span>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 font-extrabold">İptal Edilen</span>
                    <span className="text-xs font-black text-gray-950">{s.cancelled ?? 0} Seans</span>
                  </div>
                  <div className="p-3 bg-rose-50/40 border border-rose-100/30 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] text-rose-800 font-extrabold">Gelmeyen</span>
                    <span className="text-xs font-black text-rose-950">{s.noShow ?? 0} Seans</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Bugünün Finansal Durumu */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-black text-[#eafda8] flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 tracking-tight uppercase">GÜNÜN FİNANSAL DURUMU</h3>
                      <p className="text-[10px] text-gray-400 font-bold">Ödeme ve ciro akışı</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-lime-50 text-lime-800 text-[10px] font-black">Tahsilat</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Bugün Alınan</span>
                    <span className="text-3xl font-black text-gray-950 tracking-tight mt-1">{fmtMinor(f.todayCollectedMinor)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Toplam Beklenen</span>
                    <span className="text-sm font-bold text-gray-900 block mt-0.5">{fmtMinor(f.expectedTotalMinor)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="p-3 bg-emerald-50/40 border border-emerald-100/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] text-emerald-800 font-extrabold">Bugün Alınan Ödeme</span>
                    </div>
                    <span className="text-xs font-black text-emerald-950">{fmtMinor(f.todayCollectedMinor)}</span>
                  </div>
                  <div className="p-3 bg-blue-50/40 border border-blue-100/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[11px] text-blue-800 font-extrabold">Bugün Beklenen Ödeme</span>
                    </div>
                    <span className="text-xs font-black text-blue-950">{fmtMinor(f.dueTodayOutstandingMinor)}</span>
                  </div>
                  <div className="p-3 bg-rose-50/40 border border-rose-100/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[11px] text-rose-800 font-extrabold">Gecikmiş Ödeme</span>
                    </div>
                    <span className="text-xs font-black text-rose-950">{fmtMinor(f.overdueOutstandingMinor)}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Danışan Portföyü */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-black text-[#eafda8] flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 tracking-tight uppercase">DANIŞAN DAĞILIMI</h3>
                      <p className="text-[10px] text-gray-400 font-bold">Aktif portföy verileri</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 text-[10px] font-black">Portföy</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Aktif Danışan</span>
                    <span className="text-3xl font-black text-gray-950 tracking-tight mt-1">{c.active ?? 0} <span className="text-xs font-bold text-gray-400">Danışan</span></span>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#a9df20]" />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="p-3 bg-cyan-50/40 border border-cyan-100/30 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] text-cyan-800 font-extrabold">Aktif Danışan</span>
                    <span className="text-xs font-black text-cyan-950">{c.active ?? 0} Kişi</span>
                  </div>
                  <div className="p-3 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] text-indigo-800 font-extrabold">Yeni Danışan (Bu Hafta)</span>
                    <span className="text-xs font-black text-indigo-950">+{c.newThisWeek ?? 0} Kişi</span>
                  </div>
                  <div className="p-3 bg-teal-50/40 border border-teal-100/30 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] text-teal-800 font-extrabold">Potansiyel Danışan</span>
                    <span className="text-xs font-black text-teal-950">{c.prospective ?? 0} Aday</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Aktif Plan ve Seans Takibi */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-black text-[#eafda8] flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 tracking-tight uppercase">PLAN & SEANS GELİŞİMİ</h3>
                      <p className="text-[10px] text-gray-400 font-bold">Tanımlanan paketlerin genel durumu</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 text-[10px] font-black">Planlar</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Aktif Plan Sayısı</span>
                    <span className="text-3xl font-black text-gray-950 tracking-tight mt-1">{p.activeCount ?? 0} Plan</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Kalan Toplam Seans</span>
                    <span className="text-sm font-bold text-gray-950 mt-1">{p.remainingSessions ?? 0} Seans</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-extrabold text-gray-600">
                      <span>Plan Seans Tüketim Oranı</span>
                      <span>{p.consumptionRate ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-black h-full rounded-full" style={{ width: `${p.consumptionRate ?? 0}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3 bg-orange-50/40 border border-orange-100/30 rounded-2xl">
                      <span className="text-[9px] text-gray-400 font-black uppercase block">Aktif Plan Sayısı</span>
                      <span className="text-base font-black text-gray-900 mt-1 block">{p.activeCount ?? 0} Plan</span>
                    </div>
                    <div className="p-3 bg-cyan-50/40 border border-cyan-100/30 rounded-2xl">
                      <span className="text-[9px] text-gray-400 font-black uppercase block">Kalan Toplam Seans</span>
                      <span className="text-base font-black text-gray-900 mt-1 block">{p.remainingSessions ?? 0} Seans</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        );
      }

      if (selectedLeadId === 'bugunun-ozeti') {
        const todayAppointments = (overview?.todayAppointments ?? []) as Array<{
          clientId: string; name: string; time: string; service: string;
          duration: string; type: string; status: string; payment: string;
        }>;

        return (
          <div className="flex-1 bg-gradient-to-br from-[#eafda8]/65 via-white to-white rounded-[2.5rem] border border-gray-300/40 p-8 flex flex-col h-[calc(100vh-5rem)] shadow-sm overflow-y-auto select-none gap-6 transition-all duration-300 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.04] pb-5">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bugünün Özeti</h1>
                <p className="text-xs text-gray-500 font-semibold mt-1">Bugün planlanmış tüm randevularınız ve seans katılım durumları.</p>
              </div>

            </div>

            {/* Beautiful Cards mimicking the screenshot layout */}
            <div className="flex flex-col gap-4.5">
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block -mb-1">BUGÜNKÜ RANDEVU LİSTESİ</span>
              
              {todayAppointments.map((app, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-gray-100 hover:border-black/10 transition-all duration-300 rounded-[2.2rem] p-5.5 flex flex-col gap-4 group hover:shadow-md relative overflow-hidden"
                >
                  {/* Top Row: Avatar + Name & Subtitle + Action Icons */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar with beautiful border */}
                      <div className="w-13 h-13 rounded-full border-2 border-gray-100 bg-black text-[#eafda8] flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        {getInitials(app.name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-gray-950 tracking-tight leading-snug group-hover:text-black transition-colors">
                          {app.name}
                        </span>
                        <span className="text-[10.5px] font-bold text-gray-400 mt-0.5 leading-none">
                          {app.service}
                        </span>
                      </div>
                    </div>

                    {/* Left & Right action buttons or duration indicator */}
                    <div className="flex items-center gap-2">
                      {/* Small duration circle badge */}
                      <div className="w-9 h-9 rounded-full bg-black text-[#eafda8] flex flex-col items-center justify-center shadow-xs">
                        <span className="text-[10px] font-black leading-none">{app.duration.replace(' dk', '')}</span>
                        <span className="text-[6px] font-extrabold tracking-tight leading-none mt-0.5">DK</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges row with category & timestamps */}
                  <div className="flex items-center justify-between pt-3 border-t border-black/[0.03]">
                    <div className="flex items-center gap-1.5">
                      {/* Status badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                        app.status === 'Tamamlandı' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/40' :
                        app.status === 'Sıradaki' ? 'bg-amber-50 text-amber-700 border border-amber-100/40 animate-pulse' :
                        'bg-rose-50 text-rose-700 border border-rose-100/40'
                      }`}>
                        {app.status}
                      </span>

                      {/* Payment badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                        app.payment === 'Ödendi' ? 'bg-[#eafda8]/20 text-lime-900 border border-lime-200/40' :
                        app.payment === 'Bekleniyor' ? 'bg-amber-500/10 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {app.payment}
                      </span>
                    </div>

                    {/* Time */}
                    <span className="text-[10px] font-extrabold text-gray-400">
                      BUGÜN, {app.time}
                    </span>
                  </div>

                  {/* Actions buttons bottom drawer block */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                      onClick={() => onOpenWorkspace?.('randevular', 'liste')}
                      className="px-4 py-2.5 rounded-2xl bg-black text-[#eafda8] hover:bg-gray-800 active:scale-95 transition-all text-[10.5px] font-black cursor-pointer text-center shadow-sm"
                    >
                      Randevuyu aç
                    </button>
                    <button 
                      onClick={() => onOpenWorkspace?.('danisanlar', app.clientId)}
                      className="px-4 py-2.5 rounded-2xl bg-white border border-gray-200/80 text-gray-700 hover:text-black hover:bg-gray-50 active:scale-95 transition-all text-[10.5px] font-black cursor-pointer text-center shadow-2xs"
                    >
                      Danışanı aç
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (selectedLeadId === 'bekleyen-islemler') {
        const pg = overview?.pending ?? {};
        const pendingTasks = [
          { title: 'Onay bekleyen randevular', items: (pg.onayBekleyen ?? []) as string[], icon: CalendarCheck, color: 'bg-amber-500 text-white', btnText: 'Onay Sayfası', action: () => onOpenWorkspace?.('randevular', 'liste') },
          { title: 'Yaklaşan ödemeler', items: (pg.yaklasanOdemeler ?? []) as string[], icon: CreditCard, color: 'bg-blue-500 text-white', btnText: 'Detaylar', action: () => onOpenWorkspace?.('odeme-planlar', 'odemeler') },
          { title: 'Geciken ödemeler', items: (pg.gecikenOdemeler ?? []) as string[], icon: AlertCircle, color: 'bg-rose-500 text-white', btnText: 'Bakiye Bildir', action: () => onOpenWorkspace?.('odeme-planlar', 'odemeler') },
          { title: 'Planı bitmek üzere olanlar', items: (pg.planiBitmekUzere ?? []) as string[], icon: Award, color: 'bg-purple-500 text-white', btnText: 'Teklif Yap', action: () => onOpenWorkspace?.('odeme-planlar', 'planlar') },
          { title: 'Seansı bitmek üzere olanlar', items: (pg.seansiBitmekUzere ?? []) as string[], icon: Clock, color: 'bg-orange-500 text-white', btnText: 'Seans Ekle', action: () => onOpenWorkspace?.('odeme-planlar', 'planlar') },
          { title: 'Yanıt bekleyen talepler', items: (pg.yanitBekleyen ?? []) as string[], icon: Mail, color: 'bg-teal-500 text-white', btnText: 'Mesajları Aç', action: () => onOpenWorkspace?.('talepler-iletisim', 'talepler') },
          { title: 'Eksik bilgili danışanlar', items: (pg.eksikBilgili ?? []) as string[], icon: ShieldCheck, color: 'bg-indigo-500 text-white', btnText: 'Eksik Tamamla', action: () => onOpenWorkspace?.('danisanlar', '') }
        ];

        return (
          <div className="flex-1 bg-gradient-to-br from-[#eafda8]/65 via-white to-white rounded-[2.5rem] border border-gray-300/40 p-8 flex flex-col h-[calc(100vh-5rem)] shadow-sm overflow-y-auto select-none gap-6 transition-all duration-300 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.04] pb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bekleyen İşlemler</h1>
                <p className="text-xs text-gray-500 font-semibold mt-1">Hızlıca aksiyon almanız gereken bekleyen görevler ve onay listesi.</p>
              </div>
              <span className="bg-rose-50 text-rose-700 px-3.5 py-1.5 rounded-full text-[10px] font-black border border-rose-100/40 tracking-wider uppercase">
                Aksiyon Gerekli
              </span>
            </div>

            {/* List of Tasks */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block -mb-1">BEKLEYEN AKSİYONLAR</span>
              
              {pendingTasks.map((task, idx) => {
                const Icon = task.icon;
                return (
                  <div 
                    key={idx} 
                    className="bg-white border border-gray-100 rounded-[2rem] p-5 flex flex-col gap-3.5 hover:shadow-xs transition-shadow relative overflow-hidden group"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${task.color} flex items-center justify-center shadow-2xs`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-xs font-black text-gray-900 tracking-tight uppercase">{task.title}</h3>
                      </div>

                      {/* Small pill badge count */}
                      <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black text-gray-600">
                        {task.items.length}
                      </span>
                    </div>

                    {/* Content Item List */}
                    <div className="space-y-1.5">
                      {task.items.map((item, subIdx) => (
                        <div key={subIdx} className="text-xs font-bold text-gray-700 bg-gray-50/50 border border-gray-100 p-3 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-black/30 shrink-0" />
                            <span className="leading-tight">{item}</span>
                          </div>
                          
                          {/* Chevron */}
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        </div>
                      ))}
                    </div>

                    {/* Interactive inline button to solve task */}
                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={task.action}
                        className="px-3.5 py-1.5 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-gray-600 transition-all text-[9.5px] font-black tracking-tight flex items-center gap-1 cursor-pointer"
                      >
                        {task.btnText}
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      if (selectedLeadId === 'hizli-islemler') {
        const quickActions = [
          { label: 'Yeni Danışan', desc: 'Sisteme yeni bir danışan kartı tanımlayın.', icon: UserPlus, color: 'text-indigo-600 bg-indigo-50 border-indigo-100/40', action: () => onOpenWorkspace?.('danisanlar', '') },
          { label: 'Yeni Randevu', desc: 'Randevu takvimine yeni seans atayın.', icon: Calendar, color: 'text-amber-600 bg-amber-50 border-amber-100/40', action: () => onOpenWorkspace?.('randevular', 'liste') },
          { label: 'Yeni Ödeme', desc: 'Ödeme tahsilat kaydı girin.', icon: CreditCard, color: 'text-lime-700 bg-lime-50 border-lime-100/40', action: () => onOpenWorkspace?.('odeme-planlar', 'odemeler') },
          { label: 'Yeni Plan', desc: 'Danışana seans sepeti ve plan tanımlayın.', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-100/40', action: () => onOpenWorkspace?.('odeme-planlar', 'planlar') },
          { label: 'Takvimi Kapat', desc: 'Belirli tarihleri rezerve dışı bırakın.', icon: Ban, color: 'text-rose-600 bg-rose-50 border-rose-100/40', action: () => onOpenWorkspace?.('takvim-uygunluk', 'kapali-zamanlar') },
          { label: 'Yeni Hizmet', desc: 'Yeni hizmet paketi veya seans tipi ekleyin.', icon: PlusCircle, color: 'text-cyan-600 bg-cyan-50 border-cyan-100/40', action: () => onOpenWorkspace?.('hizmetler', 'hizmetler') },
          { label: 'İçerik Düzenle', desc: 'Web sitenizin içeriklerini düzenleyin.', icon: Settings, color: 'text-slate-600 bg-slate-100 border-slate-200/40', action: () => onOpenWorkspace?.('site-icerigi', 'iletisim-ayarlari') }
        ];

        return (
          <div className="flex-1 bg-gradient-to-br from-[#eafda8]/65 via-white to-white rounded-[2.5rem] border border-gray-300/40 p-8 flex flex-col h-[calc(100vh-5rem)] shadow-sm overflow-y-auto select-none gap-6 transition-all duration-300 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.04] pb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hızlı İşlemler</h1>
                <p className="text-xs text-gray-500 font-semibold mt-1">Sık kullanılan işlemlere ve kısayollara tek tıkla ulaşın.</p>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((act, idx) => {
                const Icon = act.icon;
                return (
                  <button 
                    key={idx}
                    onClick={act.action}
                    className="bg-white border border-gray-100 rounded-[2rem] p-5.5 hover:bg-black hover:text-white hover:border-black hover:scale-[1.02] transition-all duration-300 text-left cursor-pointer shadow-2xs hover:shadow-lg group flex flex-col justify-between min-h-34 focus:outline-none relative overflow-hidden"
                  >
                    {/* Circle Icon Badge */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 group-hover:bg-white/10 group-hover:text-white group-hover:border-transparent ${act.color}`}>
                      <Icon className="w-5.5 h-5.5 stroke-[2]" />
                    </div>

                    <div className="mt-4">
                      <span className="text-[13.5px] font-black group-hover:text-[#eafda8] transition-colors tracking-tight flex items-center gap-1.5">
                        {act.label}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </span>
                      <p className="text-[10.5px] text-gray-400 group-hover:text-gray-300 font-bold leading-relaxed mt-1.5">
                        {act.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // Detailed views for the secondary list selections to ensure premium integration
      if (selectedLeadId === 'finans-ozeti') {
        const f = overview?.finance ?? {};
        const payments = (overview?.recentPayments ?? []) as Array<{ name: string; label: string; amountMinor: string }>;
        return (
          <div className="flex-1 bg-gradient-to-br from-[#eafda8]/65 via-white to-white rounded-[2.5rem] border border-gray-300/40 p-8 flex flex-col h-[calc(100vh-5rem)] shadow-sm overflow-y-auto select-none gap-6 transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-black/[0.04] pb-5">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-md">
                <CreditCard className="w-6 h-6 text-[#eafda8]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Finans Özeti</h1>
                <p className="text-xs text-gray-500 font-semibold mt-1">Bugün alınan ve beklenen ödeme akışları, geciken bakiyelerin detayları.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-gray-100 rounded-3xl">
                <span className="text-[10px] text-gray-400 font-black block uppercase">Bugün Alınan</span>
                <span className="text-2xl font-black text-emerald-600 block mt-1">{fmtMinor(f.todayCollectedMinor)}</span>
                <span className="text-[9px] text-emerald-700 font-bold block mt-1">Tamamlanmış Tahsilat</span>
              </div>
              <div className="p-5 bg-white border border-gray-100 rounded-3xl">
                <span className="text-[10px] text-gray-400 font-black block uppercase">Bugün Beklenen</span>
                <span className="text-2xl font-black text-blue-600 block mt-1">{fmtMinor(f.dueTodayOutstandingMinor)}</span>
                <span className="text-[9px] text-blue-700 font-bold block mt-1">Günün Kalan Bakiyesi</span>
              </div>
              <div className="p-5 bg-white border border-gray-100 rounded-3xl">
                <span className="text-[10px] text-gray-400 font-black block uppercase">Gecikmiş Ödeme</span>
                <span className="text-2xl font-black text-rose-600 block mt-1">{fmtMinor(f.overdueOutstandingMinor)}</span>
                <span className="text-[9px] text-rose-700 font-bold block mt-1">Takip Edilen Tutar</span>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Finansal İşlemler</span>
              <div className="space-y-2">
                {payments.length === 0 ? (
                  <div className="p-3.5 text-center text-gray-400 text-[11px] font-semibold">Henüz kaydedilmiş tahsilat bulunmuyor.</div>
                ) : (
                  payments.map((pay, idx) => (
                    <div key={idx} className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>{pay.name} - {pay.label}</span>
                      <span className="text-emerald-600 font-black">+{fmtMinor(pay.amountMinor)} (Ödendi)</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      }


      if (selectedLeadId === 'son-islemler') {
        const iconFor = (t: string) => {
          if (t === 'Belge') return { icon: FileText, color: 'bg-blue-50 text-blue-600' };
          if (t === 'Not') return { icon: FileText, color: 'bg-amber-50 text-amber-600' };
          if (t === 'İletişim') return { icon: Mail, color: 'bg-teal-50 text-teal-600' };
          if (t === 'Randevu') return { icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-600' };
          if (t === 'Finans') return { icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' };
          if (t === 'Danışan') return { icon: UserPlus, color: 'bg-indigo-50 text-indigo-600' };
          if (t === 'Arşiv') return { icon: Clock, color: 'bg-gray-100 text-gray-600' };
          return { icon: CheckCircle, color: 'bg-gray-50 text-gray-600' };
        };
        const logs = ((overview?.recentActivity ?? []) as Array<{ desc: string; time: string; type: string }>).map((a) => ({ ...a, ...iconFor(a.type) }));

        return (
          <div className="flex-1 bg-gradient-to-br from-[#eafda8]/65 via-white to-white rounded-[2.5rem] border border-gray-300/40 p-8 flex flex-col h-[calc(100vh-5rem)] shadow-sm overflow-y-auto select-none gap-6 transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-black/[0.04] pb-5">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-md">
                <History className="w-6 h-6 text-[#eafda8]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Son İşlemler</h1>
                <p className="text-xs text-gray-500 font-semibold mt-1">Sistem üzerinde gerçekleştirilen en son operasyonel ve finansal loglar.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block -mb-1">İŞLEM GEÇMİŞİ LİSTESİ</span>
              
              {logs.map((log, idx) => {
                const Icon = log.icon;
                return (
                  <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-5 flex gap-4 hover:shadow-2xs transition-shadow">
                    <div className={`w-10 h-10 rounded-2xl ${log.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col justify-between">
                      <span className="text-xs font-black text-gray-900">{log.desc}</span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[8px] font-black uppercase">{log.type}</span>
                        <span className="text-[9px] text-gray-400 font-bold">• {log.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    return null;
  }


  // Check if we are selecting a client
  const client = clientsDb[selectedLeadId];

  if (client) {
    return (
      <ClientDetailsHub 
        client={client}
        onUpdateClient={onUpdateClientDetails}
        onDeselect={() => onSelectLead && onSelectLead('')}
        onDeleteClient={onDeleteClient}
      />
    );
  }

  // If no client selected, show the ClientListView
  return (
    <ClientListView 
      clientsDb={clientsDb}
      onSelectLead={(id) => onSelectLead && onSelectLead(id)}
    />
  );
}
