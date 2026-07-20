'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ClientDetail, ClientListItem } from '@/components/admin/client-dashboard-types';

import styles from './sales-hub-dashboard.module.css';

type IconName =
  | 'archive'
  | 'arrow-left'
  | 'calendar'
  | 'card'
  | 'clock'
  | 'document'
  | 'filter'
  | 'grid'
  | 'help'
  | 'history'
  | 'home'
  | 'insight'
  | 'message'
  | 'more'
  | 'plus'
  | 'refresh'
  | 'report'
  | 'search'
  | 'settings'
  | 'shield'
  | 'sort'
  | 'support'
  | 'user-plus'
  | 'users'
  | 'waffle';

interface SalesHubDashboardProps {
  clients: ClientListItem[];
  loading: boolean;
  onChanged: () => void;
  onNew: () => void;
  onRefresh: () => void;
  onSelectClient: (id: string) => void;
  selectedId: string;
}

const statusLabels = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
  PROSPECTIVE: 'Potansiyel',
} as const;

const tabs = [
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

const navigationGroups = [
  {
    title: 'Panel ve Planlama',
    items: [
      { id: 'ana-panel', icon: 'home' as const, label: 'Ana Panel' },
      { id: 'randevular', icon: 'calendar' as const, label: 'Randevular' },
      { id: 'takvim-uygunluk', icon: 'calendar' as const, label: 'Takvim ve Uygunluk' },
      { id: 'talepler-iletisim', icon: 'message' as const, label: 'Talepler ve İletişim' },
    ],
  },
  {
    title: 'Hizmetler ve Danışanlar',
    items: [
      { id: 'danisanlar', icon: 'users' as const, label: 'Danışanlar' },
      { id: 'hizmetler', icon: 'card' as const, label: 'Hizmetler' },
      { id: 'odeme-planlar', icon: 'card' as const, label: 'Ödeme ve Planlar' },
      { id: 'pdf-kaynaklar', icon: 'document' as const, label: 'PDF ve Kaynaklar' },
      { id: 'site-icerigi', icon: 'grid' as const, label: 'Site İçeriği' },
    ],
  },
  {
    title: 'Sistem ve Raporlar',
    items: [
      { id: 'raporlar', icon: 'report' as const, label: 'Raporlar' },
      { id: 'kullanicilar-yetkiler', icon: 'shield' as const, label: 'Kullanıcılar ve Yetkiler' },
      { id: 'ayarlar', icon: 'settings' as const, label: 'Ayarlar' },
      { id: 'arsiv', icon: 'archive' as const, label: 'Arşiv' },
    ],
  },
] as const;

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

function initials(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toLocaleUpperCase('tr-TR');
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    hour: withTime ? '2-digit' : undefined,
    minute: withTime ? '2-digit' : undefined,
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatMoney(amountMinor: bigint, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(amountMinor) / 100);
}

function balanceFor(detail: ClientDetail | null) {
  if (!detail) return { amount: 0n, currency: 'TRY' };
  let amount = 0n;
  let currency = detail.financeEntries[0]?.currency ?? detail.plans[0]?.currency ?? 'TRY';
  for (const entry of detail.financeEntries) {
    const value = BigInt(entry.amountMinor);
    currency = entry.currency || currency;
    if (entry.type === 'ACCRUAL') amount += value;
    if (entry.type === 'PAYMENT') amount -= value;
    if (entry.type === 'REFUND') amount += value;
    if (entry.type === 'ADJUSTMENT') amount += value;
  }
  return { amount: amount > 0n ? amount : 0n, currency };
}

function Icon({ name, size = 17 }: { name: IconName; size?: number }) {
  const common = {
    fill: 'none',
    height: size,
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.7,
    viewBox: '0 0 24 24',
    width: size,
  };

  const paths: Record<IconName, React.ReactNode> = {
    archive: <><path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3zM9 11h6"/></>,
    'arrow-left': <><path d="M15 18l-6-6 6-6"/><path d="M9 12h10"/></>,
    calendar: <><rect height="16" rx="2" width="18" x="3" y="5"/><path d="M8 3v4m8-4v4M3 10h18"/></>,
    card: <><rect height="15" rx="2" width="19" x="2.5" y="5"/><path d="M2.5 10h19M6 15h4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    document: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6m-6 4h6"/></>,
    filter: <><path d="M3 5h18l-7 8v5l-4 2v-7z"/></>,
    grid: <><rect height="7" rx="1" width="7" x="3" y="3"/><rect height="7" rx="1" width="7" x="14" y="3"/><rect height="7" rx="1" width="7" x="3" y="14"/><rect height="7" rx="1" width="7" x="14" y="14"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 114.2 1.6c-.9.8-1.9 1.2-1.9 2.7M12 17h.01"/></>,
    history: <><path d="M3 12a9 9 0 109-9 9.5 9.5 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
    home: <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    insight: <><path d="M9 18h6M10 22h4"/><path d="M8.5 14.5A6 6 0 1115.5 14.5c-.9.8-1.5 1.6-1.5 2.5h-4c0-.9-.6-1.7-1.5-2.5z"/></>,
    message: <><path d="M4 5h16v12H8l-4 4z"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 10-2 5"/></>,
    report: <><path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6v.2h-4V21a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 00.3-1.9A1.7 1.7 0 003 14H2.8v-4H3a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 009 4.6 1.7 1.7 0 0010 3V2.8h4V3a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.6 1h.2v4H21a1.7 1.7 0 00-1.6 1z"/></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></>,
    sort: <><path d="M8 6h10M8 12h7M8 18h4M4 4v16m0 0l-2-2m2 2l2-2"/></>,
    support: <><path d="M4 14v-2a8 8 0 0116 0v2"/><path d="M4 14h3v6H5a2 2 0 01-2-2v-2a2 2 0 012-2zm16 0h-3v6h2a2 2 0 002-2v-2a2 2 0 00-2-2z"/></>,
    'user-plus': <><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7 2.2 0 4.2 1 5.5 2.5M18 8v6m-3-3h6"/></>,
    users: <><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M16 5a4 4 0 010 7m2 3c2.4.7 4 2.8 4 6"/></>,
    waffle: <>{[4, 10, 16].flatMap((x) => [4, 10, 16].map((y) => <rect fill="currentColor" height="3" key={`${x}-${y}`} rx=".5" stroke="none" width="3" x={x} y={y}/>))}</>,
  };

  return <svg aria-hidden="true" {...common}>{paths[name]}</svg>;
}

export default function SalesHubDashboard({
  clients,
  loading,
  onChanged,
  onNew,
  onRefresh,
  onSelectClient,
  selectedId,
}: SalesHubDashboardProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Genel Bakış');
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  async function loadDetail(clientId = selectedId) {
    if (!clientId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as { data: ClientDetail };
      setDetail(payload.data);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Danışan bilgileri yüklenemedi.');
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDetail();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [selectedId]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const visibleClients = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    const filtered = clients.filter((client) => {
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'ACTIVE' && client.status === 'ACTIVE') ||
        (filter === 'PROSPECTIVE' && client.status === 'PROSPECTIVE') ||
        (filter === 'CHILD' && client.type === 'CHILD') ||
        (filter === 'INACTIVE' && client.status === 'INACTIVE');
      if (!matchesFilter) return false;
      if (!normalized) return true;
      return `${client.firstName} ${client.lastName} ${client.email ?? ''} ${client.phone ?? ''}`
        .toLocaleLowerCase('tr-TR')
        .includes(normalized);
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === 'name') {
        return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`, 'tr');
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  }, [clients, filter, query, sortBy]);

  const selectedListClient = clients.find((client) => client.id === selectedId) ?? null;
  const activePlan = detail?.plans.find((plan) => plan.status === 'ACTIVE') ?? detail?.plans[0] ?? null;
  const balance = balanceFor(detail);
  const nextAppointment = detail?.nextAppointment ?? null;
  const completedAppointments = detail?.appointments.filter((appointment) => appointment.status === 'COMPLETED').length ?? 0;
  const processIndex = detail?.status === 'ACTIVE' ? (activePlan ? 2 : 1) : detail?.status === 'INACTIVE' ? 4 : 0;
  const age = detail?.birthYear ? Math.max(0, new Date().getFullYear() - detail.birthYear) : null;
  const displayName = detail
    ? `${detail.firstName} ${detail.lastName}`
    : selectedListClient
      ? `${selectedListClient.firstName} ${selectedListClient.lastName}`
      : 'Danışan seçilmedi';

  function navigateMenu(id: string) {
    if (id === 'danisanlar' || id === 'ana-panel') return;
    if (id === 'randevular' || id === 'takvim-uygunluk' || id === 'talepler-iletisim') {
      router.push('/yonetim/randevular');
      return;
    }
    if (id === 'odeme-planlar') {
      router.push('/yonetim/odemeler');
      return;
    }
    setToast('Bu bölüm tasarım içinde hazır; sistem bağlantısı sonraki modül sırasında açılacak.');
  }

  async function updateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/clients/${detail.id}`, {
        body: JSON.stringify({
          birthYear: data.get('birthYear') ? Number(data.get('birthYear')) : null,
          email: String(data.get('email') ?? '').trim() || null,
          firstName: String(data.get('firstName') ?? '').trim(),
          lastName: String(data.get('lastName') ?? '').trim(),
          phone: String(data.get('phone') ?? '').trim() || null,
          preferredName: String(data.get('preferredName') ?? '').trim() || null,
          status: String(data.get('status') ?? detail.status),
        }),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
        },
        method: 'PATCH',
      });
      if (!response.ok) throw new Error(await readError(response));
      setEditOpen(false);
      await loadDetail(detail.id);
      onChanged();
      setToast('Danışan bilgileri kaydedildi.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Danışan güncellenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/clients/${detail.id}/notes`, {
        body: JSON.stringify({
          category: String(data.get('category') ?? 'GENERAL'),
          note: String(data.get('note') ?? '').trim(),
        }),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
        },
        method: 'POST',
      });
      if (!response.ok) throw new Error(await readError(response));
      setNoteOpen(false);
      await loadDetail(detail.id);
      onChanged();
      setToast('Operasyonel not eklendi.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Not eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deactivateClient() {
    if (!detail || !window.confirm(`${displayName} kaydı pasife alınsın mı?`)) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/clients/${detail.id}`, {
        headers: { 'x-correlation-id': crypto.randomUUID() },
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(await readError(response));
      await loadDetail(detail.id);
      onChanged();
      setToast('Danışan kaydı pasife alındı.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Danışan pasife alınamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  const processStages = [
    ['Ön Görüşme', 'First Contact'],
    ['Değerlendirme', 'Qualify'],
    ['Aktif Terapi', 'Develop'],
    ['Gelişim Takibi', 'Propose'],
    ['Mezuniyet', 'Close'],
  ] as const;

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${menuCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.brandRow}>
          <span className={styles.waffle}><Icon name="waffle" size={21} /></span>
          <div className={styles.brandText}>
            <strong>Dynamic 365</strong>
            <span className={styles.brandDivider} />
            <span>Sales Hub</span>
          </div>
        </div>
        <div className={styles.navScroll}>
          <div className={styles.menuHeading}>
            <strong>Menu</strong>
            <button className={styles.circleButton} onClick={() => setMenuCollapsed((value) => !value)} title="Menüyü daralt" type="button">
              <Icon name="arrow-left" size={14} />
            </button>
          </div>
          {navigationGroups.map((group) => (
            <section className={styles.navGroup} key={group.title}>
              <span className={styles.navGroupTitle}>{group.title}</span>
              <div className={styles.navItems}>
                {group.items.map((item) => {
                  const active = item.id === 'danisanlar';
                  return (
                    <button
                      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                      key={item.id}
                      onClick={() => navigateMenu(item.id)}
                      title={menuCollapsed ? item.label : undefined}
                      type="button"
                    >
                      <span className={styles.navIcon}><Icon name={item.icon} size={16} /></span>
                      <span className={styles.navLabel}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <main className={styles.appArea}>
        <header className={styles.topbar}>
          <button className={styles.iconButton} onClick={() => searchRef.current?.focus()} title="Ara" type="button"><Icon name="search" /></button>
          <button className={styles.iconButton} onClick={() => setToast('Son hareketler danışan zaman çizelgesinde gösteriliyor.')} title="Geçmiş" type="button"><Icon name="clock" /></button>
          <button className={styles.iconButton} onClick={onNew} title="Yeni danışan" type="button"><Icon name="plus" /></button>
          <button className={styles.iconButton} onClick={() => setToast('Canlı içgörüler kayıt puanı kartında gösteriliyor.')} title="İçgörüler" type="button"><Icon name="insight" /></button>
          <button className={`${styles.iconButton} ${filter !== 'ALL' ? styles.iconButtonActive : ''}`} onClick={() => setFilter((value) => value === 'ALL' ? 'ACTIVE' : 'ALL')} title="Filtre" type="button"><Icon name="filter" /></button>
          <button className={styles.iconButton} onClick={() => setToast('Görsel yapı Dashboard kaynak tasarımına sabitlendi.')} title="Ayarlar" type="button"><Icon name="settings" /></button>
          <button className={styles.iconButton} onClick={() => setToast('Yönetim yardımı için işlem başlığını seçin.')} title="Yardım" type="button"><Icon name="help" /></button>
          <button className={styles.iconButton} onClick={() => setToast('Destek bağlantısı hazır.')} title="Destek" type="button"><Icon name="support" /></button>
          <div className={styles.avatarTop}>ÖY<span className={styles.onlineDot} /></div>
        </header>

        <div className={styles.workspaceRow}>
          <section className={styles.portfolio}>
            <header className={styles.portfolioHeader}>
              <div>
                <h1>Danışan Portföyü</h1>
                <p>Sistemdeki danışanların akıllı listesi.</p>
              </div>
              <button className={styles.addClientButton} onClick={onNew} title="Yeni danışan" type="button"><Icon name="user-plus" size={17} /></button>
            </header>

            <div className={styles.portfolioControls}>
              <label className={styles.selectLike}>
                <Icon name="users" size={16} />
                <span>Grup:</span>
                <select onChange={(event) => setFilter(event.target.value)} value={filter}>
                  <option value="ALL">Tüm Danışanlar</option>
                  <option value="ACTIVE">Aktif Danışanlar</option>
                  <option value="PROSPECTIVE">Potansiyel Danışanlar</option>
                  <option value="CHILD">Çocuk Danışanlar</option>
                  <option value="INACTIVE">Pasif Danışanlar</option>
                </select>
              </label>
              <label className={styles.searchBox}>
                <Icon name="search" size={16} />
                <input onChange={(event) => setQuery(event.target.value)} placeholder="Danışan ara..." ref={searchRef} value={query} />
              </label>
              <div className={styles.controlButtons}>
                <button className={styles.smallPillButton} onClick={() => setFilter((value) => value === 'ALL' ? 'ACTIVE' : 'ALL')} type="button"><Icon name="filter" size={13} /> FİLTRELE</button>
                <button className={styles.smallPillButton} onClick={() => setSortBy((value) => value === 'updated' ? 'name' : 'updated')} type="button"><Icon name="sort" size={13} /> SIRALA</button>
              </div>
            </div>

            <div className={styles.clientList}>
              {loading ? <div className={styles.loadingLayer}>Danışanlar yükleniyor...</div> : null}
              {!loading && visibleClients.length === 0 ? <div className={styles.loadingLayer}>Bu filtrede danışan bulunmuyor.</div> : null}
              {visibleClients.map((client) => {
                const active = client.id === selectedId;
                const service = client.nextAppointment?.serviceNameSnapshot ?? (client.type === 'CHILD' ? 'Çocuk Dil ve Konuşma' : 'Dil ve Konuşma Terapisi');
                return (
                  <button
                    className={`${styles.clientCard} ${active ? styles.clientCardActive : ''}`}
                    key={client.id}
                    onClick={() => onSelectClient(client.id)}
                    type="button"
                  >
                    <div className={styles.clientTop}>
                      <span className={styles.clientAvatar}>{initials(client.firstName, client.lastName)}</span>
                      <span>
                        <span className={styles.clientName}>{client.firstName} {client.lastName}</span>
                        <span className={styles.clientService}>{service}</span>
                      </span>
                      <span className={`${styles.statusBadge} ${client.status === 'ACTIVE' ? styles.statusBadgeGood : ''}`}>
                        {client.status === 'ACTIVE' ? 'AKTİF' : client.status === 'INACTIVE' ? 'PASİF' : 'YENİ'}
                      </span>
                    </div>
                    <span className={styles.clientCardLine} />
                    <div className={styles.planRow}>
                      <div className={styles.planPills}>
                        <span className={styles.miniBadge}>Plan: {client.plansCount > 0 ? `${client.plansCount} kayıt` : 'Yok'}</span>
                        {client.nextAppointment ? <span className={styles.miniBadge}>Sıradaki: {formatDate(client.nextAppointment.startsAt)}</span> : null}
                      </div>
                    </div>
                    <div className={styles.metaRow}>
                      <span>KAYIT: {formatDate(client.createdAt ?? client.updatedAt)}</span>
                      <span className={styles.metaStatus}>{statusLabels[client.status]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.detailPanel}>
            <div className={styles.detailScroll}>
              <div className={styles.detailTop}>
                <div className={styles.toolbar}>
                  <div className={styles.toolbarLeft}>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => setEditOpen(true)} type="button">⚙ Düzenle</button>
                    <button className={styles.toolbarButton} onClick={onNew} type="button">＋ Yeni</button>
                    <button className={styles.toolbarButton} disabled={!detail || submitting} onClick={() => void deactivateClient()} type="button">♲ Sil</button>
                    <button className={styles.toolbarButton} onClick={() => { onRefresh(); void loadDetail(); }} type="button">↻ Yenile</button>
                    <button className={styles.toolbarButton} onClick={() => router.push('/yonetim/odemeler')} type="button">⌘ Plan Tanımla</button>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => window.print()} type="button">▤ To PDF</button>
                    <button className={styles.toolbarButton} onClick={() => router.push('/yonetim/odemeler')} type="button">▣ Ödeme Al</button>
                    <button className={styles.toolbarButton} onClick={() => document.getElementById('sales-hub-process')?.scrollIntoView({ behavior: 'smooth' })} type="button">⌁ Süreç</button>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => setNoteOpen(true)} title="Operasyonel not ekle" type="button"><Icon name="more" size={14} /></button>
                  </div>
                  <button className={styles.backButton} onClick={() => router.back()} type="button">← Geri Dön</button>
                </div>

                <div className={styles.heroRow}>
                  <div className={styles.heroIdentity}>
                    <span className={styles.heroAvatar}>{detail ? initials(detail.firstName, detail.lastName) : '—'}</span>
                    <div>
                      <div className={styles.heroNameRow}>
                        <h2>{displayName}</h2>
                        {detail ? <span className={styles.clientNumber}>DNS-{detail.id.slice(0, 4).toUpperCase()}</span> : null}
                      </div>
                      <div className={styles.heroBadges}>
                        <span className={styles.heroBadge}>{detail ? statusLabels[detail.status] : '—'}</span>
                        <span className={styles.heroBadge}>{detail?.type === 'CHILD' ? 'Çocuk Danışan' : 'Yetişkin Danışan'}</span>
                        {age !== null ? <span className={styles.heroBadge}>{age} Yaşında</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className={styles.heroStats}>
                    <div className={styles.stat}><span>Kayıt Tarihi</span><strong>{formatDate(detail?.createdAt)}</strong></div>
                    <div className={styles.stat}><span>Kalan Bakiye</span><strong>{formatMoney(balance.amount, balance.currency)}</strong></div>
                    <div className={styles.stat}><span>Aktif Plan</span><strong>{activePlan?.name ?? 'Plan yok'}</strong></div>
                    <div className={styles.ownerPill}>
                      <span className={styles.clientAvatar}>ÖY</span>
                      <span>TEMSİLCİ<strong>Ömer Yiğitler</strong></span>
                    </div>
                  </div>
                </div>

                <div className={styles.processRow} id="sales-hub-process">
                  <div className={styles.processLabel}><strong>Opportunity Sales Process</strong><small>Active for {Math.max(1, completedAppointments)} Days</small></div>
                  <div className={styles.processStages}>
                    {processStages.map(([label, caption], index) => (
                      <div className={`${styles.processStage} ${index < processIndex ? styles.processStageDone : ''} ${index === processIndex ? styles.processStageCurrent : ''}`} key={label}>
                        <span className={styles.stageCircle}>{index < processIndex ? '✓' : index === processIndex ? '●' : '○'}</span>
                        <span className={styles.stageText}><strong>{label}</strong><small>{caption}</small></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.tabs}>
                  {tabs.map((tab) => <button className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} key={tab} onClick={() => setActiveTab(tab)} type="button">{tab}</button>)}
                </div>
              </div>

              <div className={styles.contentArea}>
                {detailLoading ? <div className={styles.loadingLayer}>Danışan ayrıntıları yükleniyor...</div> : null}
                {!detailLoading && !detail ? <div className={styles.loadingLayer}>Portföyden bir danışan seçin.</div> : null}
                {!detailLoading && detail ? (
                  <div className={styles.contentGrid}>
                    <article className={styles.card}>
                      <div className={styles.cardTitle}><h3>İletişim Bilgileri</h3></div>
                      <div className={styles.infoRows}>
                        <div className={styles.infoRow}><span>Telefon</span><strong>{detail.phone ?? '—'}</strong></div>
                        <div className={styles.infoRow}><span>E-posta</span><a href={detail.email ? `mailto:${detail.email}` : undefined}>{detail.email ?? '—'}</a></div>
                        <div className={styles.infoRow}><span>İletişim Tercihi</span><strong>{detail.phone ? 'WhatsApp' : 'E-posta'}</strong></div>
                        <div className={styles.infoRow}><span>Danışan Tipi</span><strong>{detail.type === 'CHILD' ? 'Çocuk' : 'Yetişkin'}</strong></div>
                        {detail.guardians[0] ? <div className={styles.infoRow}><span>Veli</span><strong>{detail.guardians[0].guardian.firstName} {detail.guardians[0].guardian.lastName}</strong></div> : null}
                      </div>
                    </article>

                    <article className={`${styles.card} ${styles.cardSoftGreen}`}>
                      <div className={styles.cardTitle}><h3>Up Next</h3><span>{nextAppointment ? 'Planlandı' : 'Boş'}</span></div>
                      <div className={styles.nextCardBody}>
                        <div className={styles.nextAction}>
                          <span className={styles.nextActionIcon}>☎</span>
                          <span className={styles.nextActionText}>
                            <strong>{nextAppointment ? nextAppointment.serviceNameSnapshot : 'First Customer Call'}</strong>
                            <span>{nextAppointment ? formatDate(nextAppointment.startsAt, true) : 'Henüz planlanmış randevu yok'}</span>
                            <span>{nextAppointment ? `Uzman: ${nextAppointment.practitioner.displayName}` : 'Yeni randevu oluşturabilirsiniz.'}</span>
                          </span>
                        </div>
                        <div className={styles.nextAction}>
                          <span className={styles.nextActionIcon}>✉</span>
                          <span className={styles.nextActionText}><strong>Follow Up</strong><span>{detail.notes[0]?.note ?? 'Görüşme sonrası takip notu bulunmuyor.'}</span></span>
                        </div>
                      </div>
                    </article>

                    <article className={styles.card}>
                      <div className={styles.cardTitle}><h3>Danışan Gelişim Skoru</h3></div>
                      <div className={styles.scoreBody}>
                        <span className={styles.scoreCircle}><strong>{detail.score}%</strong></span>
                        <span className={styles.scoreCopy}><strong>{detail.score >= 80 ? 'Kapsamlı Gelişim' : detail.score >= 55 ? 'Gelişmekte' : 'Geliştirilmeli'}</strong><p>İletişim, seans, plan ve operasyonel kayıtların bütünlüğünden hesaplanır.</p></span>
                      </div>
                    </article>

                    <article className={`${styles.card} ${styles.cardPeach}`}>
                      <div className={styles.cardTitle}><h3>Tedavi Zaman Tüneli</h3><span>{detail.appointments.length} kayıt</span></div>
                      <div className={styles.appointmentList}>
                        {detail.appointments.slice(0, 5).map((appointment) => <div className={styles.listItem} key={appointment.id}><strong>{appointment.serviceNameSnapshot}</strong><span>{formatDate(appointment.startsAt, true)}</span><small>{appointment.status} · {appointment.practitioner.displayName}</small></div>)}
                        {detail.appointments.length === 0 ? <p className={styles.emptyText}>Henüz randevu kaydı bulunmuyor.</p> : null}
                      </div>
                    </article>

                    <article className={styles.card}>
                      <div className={styles.cardTitle}><h3>Finansal Göstergeler</h3><span>{detail.financeEntries.length} hareket</span></div>
                      <div className={styles.infoRows}>
                        <div className={styles.infoRow}><span>Aktif Plan</span><strong>{activePlan?.name ?? 'Plan yok'}</strong></div>
                        <div className={styles.infoRow}><span>Plan Tutarı</span><strong>{activePlan ? formatMoney(BigInt(activePlan.totalAmountMinor), activePlan.currency) : '—'}</strong></div>
                        <div className={styles.infoRow}><span>Kalan Bakiye</span><strong>{formatMoney(balance.amount, balance.currency)}</strong></div>
                        <div className={styles.infoRow}><span>Seans Sayısı</span><strong>{activePlan?.sessionCount ?? 0}</strong></div>
                      </div>
                    </article>

                    <article className={styles.card}>
                      <div className={styles.cardTitle}><h3>Operasyonel Notlar</h3><button className={styles.smallPillButton} onClick={() => setNoteOpen(true)} type="button">＋ NOT</button></div>
                      <div className={styles.noteList}>
                        {detail.notes.slice(0, 5).map((note) => <div className={styles.listItem} key={note.id}><strong>{note.category}</strong><span>{note.note}</span><small>{formatDate(note.createdAt, true)} · {note.createdBy.name ?? 'Yönetim'}</small></div>)}
                        {detail.notes.length === 0 ? <p className={styles.emptyText}>Henüz operasyonel not eklenmedi.</p> : null}
                      </div>
                    </article>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </main>

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      {editOpen && detail ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}><div><h2>Danışanı düzenle</h2><p>{displayName} kayıt bilgileri</p></div><button className={styles.circleButton} onClick={() => setEditOpen(false)} type="button">×</button></div>
            <form onSubmit={updateClient}>
              <div className={styles.formGrid}>
                <label className={styles.field}>Ad<input defaultValue={detail.firstName} name="firstName" required /></label>
                <label className={styles.field}>Soyad<input defaultValue={detail.lastName} name="lastName" required /></label>
                <label className={styles.field}>Tercih edilen ad<input defaultValue={detail.preferredName ?? ''} name="preferredName" /></label>
                <label className={styles.field}>Doğum yılı<input defaultValue={detail.birthYear ?? ''} max={new Date().getFullYear()} min="1900" name="birthYear" type="number" /></label>
                <label className={styles.field}>Telefon<input defaultValue={detail.phone ?? ''} name="phone" /></label>
                <label className={styles.field}>E-posta<input defaultValue={detail.email ?? ''} name="email" type="email" /></label>
                <label className={styles.field}>Durum<select defaultValue={detail.status} name="status"><option value="PROSPECTIVE">Potansiyel</option><option value="ACTIVE">Aktif</option><option value="INACTIVE">Pasif</option></select></label>
              </div>
              <div className={styles.modalActions}><button className={styles.secondaryAction} onClick={() => setEditOpen(false)} type="button">Vazgeç</button><button className={styles.primaryAction} disabled={submitting} type="submit">{submitting ? 'Kaydediliyor...' : 'Kaydet'}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {noteOpen && detail ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}><div><h2>Operasyonel not ekle</h2><p>{displayName}</p></div><button className={styles.circleButton} onClick={() => setNoteOpen(false)} type="button">×</button></div>
            <form onSubmit={addNote}>
              <div className={styles.formGrid}>
                <label className={styles.field}>Kategori<select defaultValue="GENERAL" name="category"><option value="GENERAL">Genel</option><option value="APPOINTMENT">Randevu</option><option value="FINANCE">Finans</option><option value="PLAN">Plan</option></select></label>
                <label className={`${styles.field} ${styles.fieldWide}`}>Not<textarea maxLength={500} name="note" required /></label>
              </div>
              <div className={styles.modalActions}><button className={styles.secondaryAction} onClick={() => setNoteOpen(false)} type="button">Vazgeç</button><button className={styles.primaryAction} disabled={submitting} type="submit">{submitting ? 'Ekleniyor...' : 'Notu ekle'}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
