'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ClientDetail, ClientListItem } from '@/components/admin/client-dashboard-types';

import { adaptClientDetail } from './adapters/client-detail-adapter';
import type { ClientGroupFilter, ClientSortMode } from './adapters/client-list-adapter';
import styles from './sales-hub-dashboard.module.css';
import Header from './source/Header';
import MyWorkPanel from './source/MyWorkPanel';
import SalesHubModals from './source/SalesHubModals';
import Sidebar from './source/Sidebar';
import WorkspacePanel from './source/WorkspacePanel';
import type { SalesHubTab } from './source/sales-hub-config';
import { DASHBOARD_SOURCE_COMMIT } from './source-version';

interface ExactSalesHubDashboardProps {
  clients: ClientListItem[];
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  loading: boolean;
  onChanged: () => void;
  onNew: () => void;
  onRefresh: () => void;
  onSelectClient: (id: string) => void;
  selectedId: string;
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

function getUserInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0]?.trim() || '';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0]?.charAt(0) ?? ''}${parts.at(-1)?.charAt(0) ?? ''}`.toLocaleUpperCase(
      'tr-TR',
    );
  }
  return parts[0]?.slice(0, 2).toLocaleUpperCase('tr-TR') || '—';
}

export default function ExactSalesHubDashboard({
  clients,
  currentUserEmail = null,
  currentUserName = null,
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
    setDeactivateOpen(false);
    setEditOpen(false);
    setNoteOpen(false);
    void loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const displayName = detail ? adaptClientDetail(detail).displayName : 'Danışan seçilmedi';
  const currentUserInitials = getUserInitials(currentUserName, currentUserEmail);
  const currentUserDisplayName =
    currentUserName?.trim() || currentUserEmail?.split('@')[0]?.trim() || '—';

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

  function refreshDashboard() {
    onRefresh();
    if (selectedId) void loadDetail(selectedId);
  }

  return (
    <div
      className={styles.shell}
      data-dashboard-source={DASHBOARD_SOURCE_COMMIT}
      data-testid="sales-hub-dashboard"
    >
      <Sidebar
        collapsed={menuCollapsed}
        onNavigate={(route) => router.push(route)}
        onToggle={() => setMenuCollapsed((value) => !value)}
      />

      <main className={styles.appArea}>
        <Header
          filterActive={filter !== 'ALL'}
          hasClient={Boolean(detail)}
          onFilter={() => setFilter((value) => (value === 'ALL' ? 'ACTIVE' : 'ALL'))}
          onFocusSearch={() => searchRef.current?.focus()}
          onNewClient={onNew}
          onShowHistory={() =>
            document.getElementById('sales-hub-timeline')?.scrollIntoView({ behavior: 'smooth' })
          }
          onShowInsights={() =>
            document.getElementById('sales-hub-score')?.scrollIntoView({ behavior: 'smooth' })
          }
          userInitials={currentUserInitials}
        />

        <div className={styles.workspaceRow}>
          <MyWorkPanel
            clients={clients}
            filter={filter}
            loading={loading}
            onFilterChange={setFilter}
            onNewClient={onNew}
            onQueryChange={setQuery}
            onSelectClient={onSelectClient}
            onSortChange={setSortBy}
            query={query}
            searchRef={searchRef}
            selectedId={selectedId}
            sortBy={sortBy}
          />

          <WorkspacePanel
            activeTab={activeTab}
            detail={detail}
            detailLoading={detailLoading}
            onBack={() => router.back()}
            onDeactivate={() => setDeactivateOpen(true)}
            onEdit={() => setEditOpen(true)}
            onNewAppointment={openAppointmentRoute}
            onNewNote={() => setNoteOpen(true)}
            onNewPayment={() => openFinanceRoute('payment')}
            onNewPlan={() => openFinanceRoute('plan')}
            onPrint={() => window.print()}
            onRefresh={refreshDashboard}
            onTabChange={setActiveTab}
            representativeInitials={currentUserInitials}
            representativeName={currentUserDisplayName}
            submitting={submitting}
          />
        </div>
      </main>

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <SalesHubModals
        deactivateOpen={deactivateOpen}
        detail={detail}
        displayName={displayName}
        editOpen={editOpen}
        noteOpen={noteOpen}
        onCloseDeactivate={() => setDeactivateOpen(false)}
        onCloseEdit={() => setEditOpen(false)}
        onCloseNote={() => setNoteOpen(false)}
        onDeactivate={() => void deactivateClient()}
        onNoteSubmit={(event) => void addNote(event)}
        onUpdateSubmit={(event) => void updateClient(event)}
        submitting={submitting}
      />
    </div>
  );
}
