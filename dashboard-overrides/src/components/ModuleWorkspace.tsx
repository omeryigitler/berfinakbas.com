import { useCallback, useEffect, useMemo, useState } from 'react';
import ContactSocialWorkspace from './ContactSocialWorkspace';
import KediWorkspace from './KediWorkspace';
import { findModuleItem, getDefaultModuleItemId, getModuleConfig } from '../data/moduleConfig';
import ModuleViews from './workspaces/ModuleViews';
import WorkspaceFrame, { type WorkspaceToast } from './workspaces/WorkspaceFrame';

interface ModuleWorkspaceProps {
  activeMenuItem: string;
  selectedItemId: string;
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'Yönetim verisi yüklenemedi.';
}

function exportRows(activeMenuItem: string, selectedItemId: string, data: any) {
  if (!data) return [['Bölüm', 'Görünüm', 'Kayıt']];

  if (activeMenuItem === 'randevular' || activeMenuItem === 'talepler-iletisim') {
    return [
      ['Danışan', 'Hizmet', 'Başlangıç', 'Durum', 'Referans'],
      ...(data.appointments ?? []).map((item: any) => [
        `${item.client?.firstName ?? ''} ${item.client?.lastName ?? ''}`.trim(),
        item.serviceNameSnapshot,
        item.startsAt,
        item.status,
        item.publicReference,
      ]),
    ];
  }

  if (activeMenuItem === 'takvim-uygunluk') {
    if (selectedItemId === 'calisma-saatleri') {
      return [
        ['Gün', 'Başlangıç', 'Bitiş', 'Slot', 'Durum'],
        ...(data.rules ?? []).map((item: any) => [
          item.weekday,
          item.localStartTime,
          item.localEndTime,
          item.slotIncrementMinutes,
          item.status,
        ]),
      ];
    }
    if (selectedItemId === 'ozel-saatler' || selectedItemId === 'kapali-zamanlar') {
      return [
        ['Tarih', 'Tür', 'Başlangıç', 'Bitiş', 'Sebep', 'Durum'],
        ...(data.exceptions ?? []).map((item: any) => [
          item.localDate,
          item.type,
          item.localStartTime,
          item.localEndTime,
          item.reasonCode,
          item.status,
        ]),
      ];
    }
    return [
      ['Ayar', 'Değer'],
      ...Object.entries(data.settings ?? {}).map(([key, value]: [string, any]) => [
        key,
        JSON.stringify(value?.value ?? value),
      ]),
    ];
  }

  if (activeMenuItem === 'hizmetler') {
    return [
      ['Hizmet', 'Slug', 'Durum', 'Süre', 'Konum', 'Görünürlük'],
      ...(data.services ?? []).map((item: any) => [
        item.name,
        item.slug,
        item.status,
        item.defaultDurationMinutes,
        item.locationType,
        item.publicVisible,
      ]),
    ];
  }

  if (activeMenuItem === 'odeme-planlar') {
    return [
      ['Danışan', 'Plan', 'Durum', 'Tutar', 'Para birimi', 'Seans'],
      ...(data.plans ?? []).map((item: any) => [
        `${item.client?.firstName ?? ''} ${item.client?.lastName ?? ''}`.trim(),
        item.name,
        item.status,
        item.totalAmountMinor,
        item.currency,
        item.sessionCount,
      ]),
    ];
  }

  if (activeMenuItem === 'pdf-kaynaklar') {
    const resources = data.settings?.PDF_RESOURCE_LIBRARY?.value;
    return [
      ['Başlık', 'Dil', 'Durum', 'URL'],
      ...(Array.isArray(resources)
        ? resources.map((item: any) => [item.title, item.language, item.status, item.url])
        : []),
    ];
  }

  if (activeMenuItem === 'kullanicilar-yetkiler') {
    return [
      ['Ad', 'E-posta', 'Durum', 'Roller', 'Son giriş'],
      ...(data.users ?? []).map((item: any) => [
        item.name,
        item.email,
        item.status,
        item.roles?.map((role: any) => role.role.name).join(', '),
        item.lastLoginAt,
      ]),
    ];
  }

  if (activeMenuItem === 'arsiv') {
    if (selectedItemId === 'islem-gecmisi') {
      return [
        ['İşlem', 'Varlık', 'Kullanıcı', 'Tarih', 'Sebep'],
        ...(data.audit ?? []).map((item: any) => [
          item.action,
          `${item.entityType}:${item.entityId}`,
          item.actor?.name ?? item.actor?.email,
          item.createdAt,
          item.reason,
        ]),
      ];
    }
    return [
      ['Tür', 'Kayıt', 'Durum', 'Güncelleme'],
      ...(data.clients ?? []).map((item: any) => [
        'Danışan',
        `${item.firstName} ${item.lastName}`,
        item.status,
        item.updatedAt,
      ]),
      ...(data.services ?? []).map((item: any) => [
        'Hizmet',
        item.name,
        item.status,
        item.updatedAt,
      ]),
    ];
  }

  if (activeMenuItem === 'raporlar') {
    const rows = Object.entries(data).flatMap(([group, values]) =>
      Array.isArray(values)
        ? values.map((value) => [group, JSON.stringify(value)])
        : [[group, JSON.stringify(values)]],
    );
    return [['Rapor', 'Değer'], ...rows];
  }

  return [
    ['Ayar', 'Değer'],
    ...Object.entries(data.settings ?? data).map(([key, value]) => [key, JSON.stringify(value)]),
  ];
}

export default function ModuleWorkspace({
  activeMenuItem,
  selectedItemId,
}: ModuleWorkspaceProps) {
  const effectiveSelectedId = selectedItemId || getDefaultModuleItemId(activeMenuItem);
  const config = getModuleConfig(activeMenuItem);
  const item = findModuleItem(activeMenuItem, effectiveSelectedId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState<WorkspaceToast | null>(null);

  const notify = useCallback((next: Omit<WorkspaceToast, 'id'>) => {
    setToast({ ...next, id: Date.now() });
  }, []);

  const load = useCallback(async () => {
    if (!config || activeMenuItem === 'site-icerigi' || activeMenuItem === 'kedi') return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/management-hub?module=${encodeURIComponent(activeMenuItem)}`,
        { cache: 'no-store', credentials: 'include' },
      );
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as { data: unknown };
      setData(payload.data);
    } catch (error) {
      setData(null);
      notify({
        kind: 'error',
        title: 'Yönetim verisi yüklenemedi',
        message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeMenuItem, config, notify]);

  useEffect(() => {
    setFilter('');
    setSortDirection('asc');
    void load();
  }, [load]);

  const rows = useMemo(
    () => exportRows(activeMenuItem, effectiveSelectedId, data),
    [activeMenuItem, data, effectiveSelectedId],
  );

  if (activeMenuItem === 'site-icerigi') {
    return <ContactSocialWorkspace selectedItemId={effectiveSelectedId} />;
  }

  if (activeMenuItem === 'kedi') {
    return <KediWorkspace />;
  }

  if (!config || !item) return null;

  return (
    <WorkspaceFrame
      eyebrow={config.title}
      title={item.label}
      subtitle={item.description}
      filterValue={filter}
      onFilterChange={setFilter}
      onSort={() => setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'))}
      sortDirection={sortDirection}
      exportRows={rows}
      exportName={`${activeMenuItem}-${effectiveSelectedId}`}
      secondaryAction={{ label: loading ? 'Yükleniyor...' : 'Yenile', onClick: () => void load() }}
      toast={toast}
      onDismissToast={() => setToast(null)}
    >
      <ModuleViews
        activeMenuItem={activeMenuItem}
        selectedItemId={effectiveSelectedId}
        data={data}
        loading={loading}
        filter={filter}
        sortDirection={sortDirection}
        refresh={load}
        notify={notify}
      />
    </WorkspaceFrame>
  );
}
