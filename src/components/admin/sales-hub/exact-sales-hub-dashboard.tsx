'use client';

import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ClientDetail, ClientListItem } from '@/components/admin/client-dashboard-types';

import {
  adaptClientDetail,
  formatDashboardDate,
  formatDashboardMoney,
  getDetailEmptyValue,
} from './adapters/client-detail-adapter';
import {
  filterAndSortClientList,
  type ClientGroupFilter,
  type ClientSortMode,
} from './adapters/client-list-adapter';
import { SalesHubIcon, type SalesHubIconName } from './source/sales-hub-icon';
import styles from './sales-hub-dashboard.module.css';

interface ExactSalesHubDashboardProps {
  clients: ClientListItem[];
  loading: boolean;
  onChanged: () => void;
  onNew: () => void;
  onRefresh: () => void;
  onSelectClient: (id: string) => void;
  selectedId: string;
}

const statusLabels: Record<ClientDetail['status'], string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
  PROSPECTIVE: 'Potansiyel',
};

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

type SalesHubTab = (typeof tabs)[number];

const navigationGroups: Array<{
  title: string;
  items: Array<{ id: string; icon: SalesHubIconName; label: string; route?: string }>;
}> = [
  {
    title: 'Panel ve Planlama',
    items: [
      { id: 'ana-panel', icon: 'home', label: 'Ana Panel', route: '/yonetim' },
      { id: 'randevular', icon: 'calendar', label: 'Randevular', route: '/yonetim/randevular' },
      { id: 'takvim-uygunluk', icon: 'calendar', label: 'Takvim ve Uygunluk', route: '/yonetim/randevular' },
      { id: 'talepler-iletisim', icon: 'message', label: 'Talepler ve İletişim', route: '/yonetim/randevular' },
    ],
  },
  {
    title: 'Hizmetler ve Danışanlar',
    items: [
      { id: 'danisanlar', icon: 'users', label: 'Danışanlar', route: '/yonetim/danisanlar' },
      { id: 'hizmetler', icon: 'card', label: 'Hizmetler' },
      { id: 'odeme-planlar', icon: 'credit-card', label: 'Ödeme ve Planlar', route: '/yonetim/odemeler' },
      { id: 'pdf-kaynaklar', icon: 'document', label: 'PDF ve Kaynaklar' },
      { id: 'site-icerigi', icon: 'grid', label: 'Site İçeriği' },
    ],
  },
  {
    title: 'Sistem ve Raporlar',
    items: [
      { id: 'raporlar', icon: 'report', label: 'Raporlar' },
      { id: 'kullanicilar-yetkiler', icon: 'shield', label: 'Kullanıcılar ve Yetkiler' },
      { id: 'ayarlar', icon: 'settings', label: 'Ayarlar' },
      { id: 'arsiv', icon: 'archive', label: 'Arşiv' },
    ],
  },
];

const processStages = [
  ['Ön Görüşme', 'First Contact'],
  ['Değerlendirme', 'Qualify'],
  ['Aktif Terapi', 'Develop'],
  ['Gelişim Takibi', 'Propose'],
  ['Mezuniyet', 'Close'],
] as const;

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

export default function ExactSalesHubDashboard({
  clients,
  loading,
  onChanged,
  onNew,
  onRefresh,
  onSelectClient,
  selectedId,
}: ExactSalesHubDashboardProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SalesHubTab>('Genel Bakış');
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [filter, setFilter] = useState<ClientGroupFilter>('ALL');
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<ClientSortMode>('updated');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const loadDetail = useCallback(async (clientId: string) => {
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
      setDetail(null);
      setToast(error instanceof Error ? error.message : 'Danışan bilgileri yüklenemedi.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    setActiveTab('Genel Bakış');
    void loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const visibleClients = useMemo(
    () => filterAndSortClientList(clients, filter, query, sortBy),
    [clients, filter, query, sortBy],
  );
  const detailView = detail ? adaptClientDetail(detail) : null;
  const displayName = detailView?.displayName ?? 'Danışan seçilmedi';
  const emptyValue = getDetailEmptyValue();

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
    if (!detail) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/clients/${detail.id}`, {
        headers: { 'x-correlation-id': crypto.randomUUID() },
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(await readError(response));
      setDeactivateOpen(false);
      await loadDetail(detail.id);
      onChanged();
      setToast('Danışan kaydı pasife alındı.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Danışan pasife alınamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  function openAppointmentRoute() {
    if (!detail) return;
    router.push(`/yonetim/randevular?clientId=${encodeURIComponent(detail.id)}`);
  }

  function openFinanceRoute(action: 'plan' | 'payment') {
    if (!detail) return;
    router.push(`/yonetim/odemeler?clientId=${encodeURIComponent(detail.id)}&action=${action}`);
  }

  function renderOverview(): ReactNode {
    if (!detail || !detailView) return null;
    const nextAppointment = detailView.nextAppointment;

    return (
      <div className={styles.contentGrid}>
        <article className={styles.card}>
          <div className={styles.cardTitle}><h3>İletişim Bilgileri</h3></div>
          <div className={styles.infoRows}>
            <div className={styles.infoRow}><span>Telefon</span><strong>{detail.phone ?? emptyValue}</strong></div>
            <div className={styles.infoRow}><span>E-posta</span><a href={detail.email ? `mailto:${detail.email}` : undefined}>{detail.email ?? emptyValue}</a></div>
            <div className={styles.infoRow}><span>İletişim Tercihi</span><strong>{emptyValue}</strong></div>
            <div className={styles.infoRow}><span>Danışan Tipi</span><strong>{detail.type === 'CHILD' ? 'Çocuk' : 'Yetişkin'}</strong></div>
            <div className={styles.infoRow}><span>Veli</span><strong>{detail.guardians[0] ? `${detail.guardians[0].guardian.firstName} ${detail.guardians[0].guardian.lastName}` : emptyValue}</strong></div>
          </div>
        </article>

        <article className={`${styles.card} ${styles.cardSoftGreen}`} id="sales-hub-next-appointment">
          <div className={styles.cardTitle}><h3>Up Next</h3><span>{nextAppointment ? 'Planlandı' : 'Boş'}</span></div>
          <div className={styles.nextCardBody}>
            <div className={styles.nextAction}>
              <span className={styles.nextActionIcon}><SalesHubIcon name="phone" size={16} /></span>
              <span className={styles.nextActionText}>
                <strong>{nextAppointment?.serviceNameSnapshot ?? emptyValue}</strong>
                <span>{formatDashboardDate(nextAppointment?.startsAt, true)}</span>
                <span>{nextAppointment ? nextAppointment.practitioner.displayName : emptyValue}</span>
              </span>
            </div>
            <div className={styles.nextAction}>
              <span className={styles.nextActionIcon}><SalesHubIcon name="mail" size={16} /></span>
              <span className={styles.nextActionText}><strong>Follow Up</strong><span>{detail.notes[0]?.note ?? emptyValue}</span></span>
            </div>
          </div>
        </article>

        <article className={styles.card} id="sales-hub-score">
          <div className={styles.cardTitle}><h3>Danışan Gelişim Skoru</h3></div>
          <div className={styles.scoreBody}>
            <span className={styles.scoreCircle}><strong>{detail.score}%</strong></span>
            <span className={styles.scoreCopy}><strong>{detailView.scoreTitle}</strong><p>İletişim, seans, plan ve operasyonel kayıtların bütünlüğünden hesaplanır.</p></span>
          </div>
        </article>

        <article className={`${styles.card} ${styles.cardPeach}`} id="sales-hub-timeline">
          <div className={styles.cardTitle}><h3>Tedavi Zaman Tüneli</h3><span>{detail.appointments.length} kayıt</span></div>
          <div className={styles.appointmentList}>
            {detail.appointments.slice(0, 5).map((appointment) => (
              <div className={styles.listItem} key={appointment.id}>
                <strong>{appointment.serviceNameSnapshot}</strong>
                <span>{formatDashboardDate(appointment.startsAt, true)}</span>
                <small>{appointment.status} · {appointment.practitioner.displayName}</small>
              </div>
            ))}
            {detail.appointments.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}><h3>Finansal Göstergeler</h3><span>{detail.financeEntries.length} hareket</span></div>
          <div className={styles.infoRows}>
            <div className={styles.infoRow}><span>Aktif Plan</span><strong>{detailView.activePlan?.name ?? emptyValue}</strong></div>
            <div className={styles.infoRow}><span>Plan Tutarı</span><strong>{detailView.activePlan ? formatDashboardMoney(BigInt(detailView.activePlan.totalAmountMinor), detailView.activePlan.currency) : emptyValue}</strong></div>
            <div className={styles.infoRow}><span>Kalan Bakiye</span><strong>{formatDashboardMoney(detailView.balance.amountMinor, detailView.balance.currency)}</strong></div>
            <div className={styles.infoRow}><span>Seans Sayısı</span><strong>{detailView.activePlan?.sessionCount ?? emptyValue}</strong></div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}><h3>Operasyonel Notlar</h3><button className={styles.smallPillButton} onClick={() => setNoteOpen(true)} type="button"><SalesHubIcon name="plus" size={12} /> NOT</button></div>
          <div className={styles.noteList}>
            {detail.notes.slice(0, 5).map((note) => (
              <div className={styles.listItem} key={note.id}>
                <strong>{note.category}</strong>
                <span>{note.note}</span>
                <small>{formatDashboardDate(note.createdAt, true)} · {note.createdBy.name ?? emptyValue}</small>
              </div>
            ))}
            {detail.notes.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
          </div>
        </article>
      </div>
    );
  }

  function renderTabContent(): ReactNode {
    if (!detail || !detailView) return null;
    if (activeTab === 'Genel Bakış') return renderOverview();

    if (activeTab === 'İletişim Bilgileri') {
      return (
        <div className={styles.contentGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}><h3>Danışan İletişimi</h3></div>
            <div className={styles.infoRows}>
              <div className={styles.infoRow}><span>Telefon</span><strong>{detail.phone ?? emptyValue}</strong></div>
              <div className={styles.infoRow}><span>E-posta</span><strong>{detail.email ?? emptyValue}</strong></div>
              <div className={styles.infoRow}><span>Tercih Edilen Ad</span><strong>{detail.preferredName ?? emptyValue}</strong></div>
              <div className={styles.infoRow}><span>Doğum Yılı</span><strong>{detail.birthYear ?? emptyValue}</strong></div>
            </div>
          </article>
          <article className={styles.card}>
            <div className={styles.cardTitle}><h3>Veli Bilgileri</h3></div>
            <div className={styles.noteList}>
              {detail.guardians.map((relation) => (
                <div className={styles.listItem} key={relation.guardian.id}>
                  <strong>{relation.guardian.firstName} {relation.guardian.lastName}</strong>
                  <span>{relation.relationship}</span>
                  <small>{relation.guardian.phone} · {relation.guardian.email ?? emptyValue}</small>
                </div>
              ))}
              {detail.guardians.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'Randevular') {
      return (
        <div className={styles.contentGrid}>
          <article className={`${styles.card} ${styles.cardPeach}`}>
            <div className={styles.cardTitle}><h3>Randevu Geçmişi</h3><span>{detail.appointments.length} kayıt</span></div>
            <div className={styles.appointmentList}>
              {detail.appointments.map((appointment) => (
                <div className={styles.listItem} key={appointment.id}>
                  <strong>{appointment.serviceNameSnapshot}</strong>
                  <span>{formatDashboardDate(appointment.startsAt, true)} · {appointment.durationMinutesSnapshot} dk</span>
                  <small>{appointment.status} · {appointment.locationTypeSnapshot} · {appointment.practitioner.displayName}</small>
                </div>
              ))}
              {detail.appointments.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'Plan ve Seanslar') {
      return (
        <div className={styles.contentGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}><h3>Plan Geçmişi</h3><span>{detail.plans.length} kayıt</span></div>
            <div className={styles.noteList}>
              {detail.plans.map((plan) => (
                <div className={styles.listItem} key={plan.id}>
                  <strong>{plan.name}</strong>
                  <span>{plan.sessionCount} seans · {plan.sessionDurationMinutes} dk</span>
                  <small>{formatDashboardDate(plan.validFrom)} – {formatDashboardDate(plan.validUntil)} · {plan.status}</small>
                </div>
              ))}
              {detail.plans.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'Ödemeler') {
      return (
        <div className={styles.contentGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}><h3>Ödeme Geçmişi</h3><span>{detail.financeEntries.length} hareket</span></div>
            <div className={styles.noteList}>
              {detail.financeEntries.map((entry) => (
                <div className={styles.listItem} key={entry.id}>
                  <strong>{entry.type} · {formatDashboardMoney(BigInt(entry.amountMinor), entry.currency)}</strong>
                  <span>{entry.plan?.name ?? emptyValue}</span>
                  <small>{formatDashboardDate(entry.occurredAt, true)} · {entry.paymentMethod?.name ?? emptyValue}</small>
                </div>
              ))}
              {detail.financeEntries.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
            </div>
          </article>
        </div>
      );
    }

    if (activeTab === 'Operasyonel Notlar') {
      return (
        <div className={styles.contentGrid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}><h3>Operasyonel Notlar</h3><button className={styles.smallPillButton} onClick={() => setNoteOpen(true)} type="button"><SalesHubIcon name="plus" size={12} /> NOT</button></div>
            <div className={styles.noteList}>
              {detail.notes.map((note) => (
                <div className={styles.listItem} key={note.id}>
                  <strong>{note.category}</strong>
                  <span>{note.note}</span>
                  <small>{formatDashboardDate(note.createdAt, true)} · {note.createdBy.name ?? emptyValue}</small>
                </div>
              ))}
              {detail.notes.length === 0 ? <p className={styles.emptyText}>{emptyValue}</p> : null}
            </div>
          </article>
        </div>
      );
    }

    return (
      <div className={styles.contentGrid}>
        <article className={styles.card}>
          <div className={styles.cardTitle}><h3>{activeTab}</h3></div>
          <p className={styles.emptyText}>{emptyValue}</p>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.shell} data-dashboard-source="9ae54ee737b446766ff3affd43d7fdca7de0a4d4" data-testid="sales-hub-dashboard">
      <aside className={`${styles.sidebar} ${menuCollapsed ? styles.sidebarCollapsed : ''}`} data-testid="sales-hub-sidebar">
        <div className={styles.brandRow}>
          <span className={styles.waffle}><SalesHubIcon name="waffle" size={21} /></span>
          <div className={styles.brandText}><strong>Dynamic 365</strong><span className={styles.brandDivider} /><span>Sales Hub</span></div>
        </div>
        <div className={styles.navScroll}>
          <div className={styles.menuHeading}>
            <strong>Menu</strong>
            <button className={styles.circleButton} onClick={() => setMenuCollapsed((value) => !value)} title={menuCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'} type="button">
              <SalesHubIcon name={menuCollapsed ? 'arrow-right' : 'arrow-left'} size={14} />
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
                      disabled={!item.route}
                      key={item.id}
                      onClick={() => item.route && router.push(item.route)}
                      title={menuCollapsed ? item.label : undefined}
                      type="button"
                    >
                      <span className={styles.navIcon}><SalesHubIcon name={item.icon} size={16} /></span>
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
        <header className={styles.topbar} data-testid="sales-hub-header">
          <button className={styles.iconButton} onClick={() => searchRef.current?.focus()} title="Ara" type="button"><SalesHubIcon name="search" /></button>
          <button className={styles.iconButton} disabled={!detail} onClick={() => document.getElementById('sales-hub-timeline')?.scrollIntoView({ behavior: 'smooth' })} title="Geçmiş" type="button"><SalesHubIcon name="clock" /></button>
          <button className={styles.iconButton} onClick={onNew} title="Yeni danışan" type="button"><SalesHubIcon name="plus" /></button>
          <button className={styles.iconButton} disabled={!detail} onClick={() => document.getElementById('sales-hub-score')?.scrollIntoView({ behavior: 'smooth' })} title="İçgörüler" type="button"><SalesHubIcon name="insight" /></button>
          <button className={`${styles.iconButton} ${filter !== 'ALL' ? styles.iconButtonActive : ''}`} onClick={() => setFilter((value) => value === 'ALL' ? 'ACTIVE' : 'ALL')} title="Filtre" type="button"><SalesHubIcon name="filter" /></button>
          <button className={styles.iconButton} disabled title="Ayarlar" type="button"><SalesHubIcon name="settings" /></button>
          <button className={styles.iconButton} disabled title="Yardım" type="button"><SalesHubIcon name="help" /></button>
          <button className={styles.iconButton} disabled title="Destek" type="button"><SalesHubIcon name="support" /></button>
          <div className={styles.avatarTop}>ÖY<span className={styles.onlineDot} /></div>
        </header>

        <div className={styles.workspaceRow}>
          <section className={styles.portfolio} data-testid="client-portfolio-panel">
            <header className={styles.portfolioHeader}>
              <div><h1>Danışan Portföyü</h1><p>Sistemdeki danışanların akıllı listesi.</p></div>
              <button className={styles.addClientButton} onClick={onNew} title="Yeni danışan" type="button"><SalesHubIcon name="user-plus" size={17} /></button>
            </header>

            <div className={styles.portfolioControls}>
              <label className={styles.selectLike}>
                <SalesHubIcon name="users" size={16} />
                <span>Grup:</span>
                <select onChange={(event) => setFilter(event.target.value as ClientGroupFilter)} value={filter}>
                  <option value="ALL">Tüm Danışanlar</option>
                  <option value="ACTIVE">Aktif Danışanlar</option>
                  <option value="PROSPECTIVE">Potansiyel Danışanlar</option>
                  <option value="CHILD">Çocuk Danışanlar</option>
                  <option value="INACTIVE">Pasif Danışanlar</option>
                </select>
              </label>
              <label className={styles.searchBox}>
                <SalesHubIcon name="search" size={16} />
                <input onChange={(event) => setQuery(event.target.value)} placeholder="Danışan ara..." ref={searchRef} value={query} />
              </label>
              <div className={styles.controlButtons}>
                <button className={styles.smallPillButton} onClick={() => setFilter((value) => value === 'ALL' ? 'ACTIVE' : 'ALL')} type="button"><SalesHubIcon name="filter" size={13} /> FİLTRELE</button>
                <button className={styles.smallPillButton} onClick={() => setSortBy((value) => value === 'updated' ? 'name' : 'updated')} type="button"><SalesHubIcon name="sort" size={13} /> SIRALA</button>
              </div>
            </div>

            <div className={styles.clientList}>
              {loading ? <div className={styles.loadingLayer}>Danışanlar yükleniyor...</div> : null}
              {!loading && visibleClients.length === 0 ? <div className={styles.loadingLayer}>Bu filtrede danışan bulunmuyor.</div> : null}
              {visibleClients.map((client) => (
                <button
                  className={`${styles.clientCard} ${client.id === selectedId ? styles.clientCardActive : ''}`}
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  type="button"
                >
                  <div className={styles.clientTop}>
                    <span className={styles.clientAvatar}>{client.initials}</span>
                    <span><span className={styles.clientName}>{client.displayName}</span><span className={styles.clientService}>{client.serviceLabel}</span></span>
                    <span className={`${styles.statusBadge} ${client.status === 'ACTIVE' ? styles.statusBadgeGood : ''}`}>{client.statusLabel}</span>
                  </div>
                  <span className={styles.clientCardLine} />
                  <div className={styles.planRow}>
                    <div className={styles.planPills}>
                      <span className={styles.miniBadge}>Plan: {client.planLabel}</span>
                      {client.nextAppointmentLabel !== emptyValue ? <span className={styles.miniBadge}>Sıradaki: {client.nextAppointmentLabel}</span> : null}
                    </div>
                  </div>
                  <div className={styles.metaRow}><span>KAYIT: {client.createdAtLabel}</span><span className={styles.metaStatus}>{client.statusLabel}</span></div>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.detailPanel} data-testid="client-detail-panel">
            <div className={styles.detailScroll}>
              <div className={styles.detailTop}>
                <div className={styles.toolbar}>
                  <div className={styles.toolbarLeft}>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => setEditOpen(true)} type="button"><SalesHubIcon name="edit" size={13} /> Düzenle</button>
                    <button className={styles.toolbarButton} onClick={onNew} type="button"><SalesHubIcon name="plus" size={13} /> Yeni</button>
                    <button className={styles.toolbarButton} disabled={!detail || submitting} onClick={() => setDeactivateOpen(true)} type="button"><SalesHubIcon name="trash" size={13} /> Sil</button>
                    <button className={styles.toolbarButton} onClick={() => { onRefresh(); if (selectedId) void loadDetail(selectedId); }} type="button"><SalesHubIcon name="refresh" size={13} /> Yenile</button>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => openFinanceRoute('plan')} type="button"><SalesHubIcon name="workflow" size={13} /> Plan Tanımla</button>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => window.print()} type="button"><SalesHubIcon name="file-down" size={13} /> To PDF</button>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => openFinanceRoute('payment')} type="button"><SalesHubIcon name="credit-card" size={13} /> Ödeme Al</button>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => document.getElementById('sales-hub-process')?.scrollIntoView({ behavior: 'smooth' })} type="button"><SalesHubIcon name="workflow" size={13} /> Süreç</button>
                    <button className={styles.toolbarButton} disabled={!detail} onClick={() => setNoteOpen(true)} title="Operasyonel not ekle" type="button"><SalesHubIcon name="more" size={14} /></button>
                  </div>
                  <button className={styles.backButton} onClick={() => router.back()} type="button"><SalesHubIcon name="arrow-left" size={13} /> Geri Dön</button>
                </div>

                <div className={styles.heroRow}>
                  <div className={styles.heroIdentity}>
                    <span className={styles.heroAvatar}>{detailView?.initials ?? emptyValue}</span>
                    <div>
                      <div className={styles.heroNameRow}><h2>{displayName}</h2>{detail ? <span className={styles.clientNumber}>DNS-{detail.id.slice(0, 4).toUpperCase()}</span> : null}</div>
                      <div className={styles.heroBadges}>
                        <span className={styles.heroBadge}>{detail ? statusLabels[detail.status] : emptyValue}</span>
                        <span className={styles.heroBadge}>{detail ? (detail.type === 'CHILD' ? 'Çocuk Danışan' : 'Yetişkin Danışan') : emptyValue}</span>
                        {detailView?.age !== null && detailView?.age !== undefined ? <span className={styles.heroBadge}>{detailView.age} Yaşında</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className={styles.heroStats}>
                    <div className={styles.stat}><span>Kayıt Tarihi</span><strong>{formatDashboardDate(detail?.createdAt)}</strong></div>
                    <div className={styles.stat}><span>Kalan Bakiye</span><strong>{detailView ? formatDashboardMoney(detailView.balance.amountMinor, detailView.balance.currency) : emptyValue}</strong></div>
                    <div className={styles.stat}><span>Aktif Plan</span><strong>{detailView?.activePlan?.name ?? emptyValue}</strong></div>
                    <div className={styles.ownerPill}><span className={styles.clientAvatar}>{emptyValue}</span><span>TEMSİLCİ<strong>{emptyValue}</strong></span></div>
                  </div>
                </div>

                <div className={styles.processRow} id="sales-hub-process">
                  <div className={styles.processLabel}><strong>Opportunity Sales Process</strong><small>Active for {detailView?.activeDays ?? 0} Days</small></div>
                  <div className={styles.processStages}>
                    {processStages.map(([label, caption], index) => (
                      <div className={`${styles.processStage} ${detailView && index < detailView.processIndex ? styles.processStageDone : ''} ${detailView && index === detailView.processIndex ? styles.processStageCurrent : ''}`} key={label}>
                        <span className={styles.stageCircle}><SalesHubIcon name={detailView && index < detailView.processIndex ? 'check' : 'lock'} size={11} /></span>
                        <span className={styles.stageText}><strong>{label}</strong><small>{caption}</small></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.tabs}>{tabs.map((tab) => <button className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} key={tab} onClick={() => setActiveTab(tab)} type="button">{tab}</button>)}</div>
              </div>

              <div className={styles.contentArea}>
                {detailLoading ? <div className={styles.loadingLayer}>Danışan ayrıntıları yükleniyor...</div> : null}
                {!detailLoading && !detail ? <div className={styles.loadingLayer}>Portföyden bir danışan seçin.</div> : null}
                {!detailLoading && detail ? renderTabContent() : null}
              </div>
            </div>
          </section>
        </div>
      </main>

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      {editOpen && detail ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}><div><h2>Danışanı düzenle</h2><p>{displayName} kayıt bilgileri</p></div><button className={styles.circleButton} onClick={() => setEditOpen(false)} type="button"><SalesHubIcon name="x" size={15} /></button></div>
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
            <div className={styles.modalHeader}><div><h2>Operasyonel not ekle</h2><p>{displayName}</p></div><button className={styles.circleButton} onClick={() => setNoteOpen(false)} type="button"><SalesHubIcon name="x" size={15} /></button></div>
            <form onSubmit={addNote}>
              <div className={styles.formGrid}>
                <label className={styles.field}>Kategori<select defaultValue="GENERAL" name="category"><option value="GENERAL">Genel</option><option value="APPOINTMENT">Randevu</option><option value="PAYMENT">Ödeme</option><option value="PLAN">Plan</option></select></label>
                <label className={`${styles.field} ${styles.fieldWide}`}>Not<textarea name="note" required /></label>
              </div>
              <div className={styles.modalActions}><button className={styles.secondaryAction} onClick={() => setNoteOpen(false)} type="button">Vazgeç</button><button className={styles.primaryAction} disabled={submitting} type="submit">{submitting ? 'Ekleniyor...' : 'Notu ekle'}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {deactivateOpen && detail ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}><div><h2>Danışanı pasife al</h2><p>{displayName} kaydı silinmez; pasif duruma geçirilir.</p></div><button className={styles.circleButton} onClick={() => setDeactivateOpen(false)} type="button"><SalesHubIcon name="x" size={15} /></button></div>
            <div className={styles.modalActions}><button className={styles.secondaryAction} onClick={() => setDeactivateOpen(false)} type="button">Vazgeç</button><button className={styles.primaryAction} disabled={submitting} onClick={() => void deactivateClient()} type="button">{submitting ? 'İşleniyor...' : 'Pasife al'}</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
