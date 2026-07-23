import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Globe2,
  Instagram,
  Mail,
  Monitor,
  Phone,
  Save,
  Smartphone,
} from 'lucide-react';
import WorkspaceFrame, { type WorkspaceToast } from './workspaces/WorkspaceFrame';

type ChannelId = 'whatsapp' | 'instagram' | 'phone' | 'email';

interface ContactSettings {
  fabEnabled: boolean;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  whatsappUrl: string;
  instagramUrl: string;
  phone: string;
  email: string;
  labels: Record<ChannelId, string>;
  enabled: Record<ChannelId, boolean>;
  order: ChannelId[];
}

const channelMeta: Record<
  ChannelId,
  { title: string; description: string; icon: typeof Globe2; valueKey: keyof ContactSettings }
> = {
  whatsapp: {
    title: 'WhatsApp',
    description: 'FAB iletişim kanalı',
    icon: Globe2,
    valueKey: 'whatsappUrl',
  },
  instagram: {
    title: 'Instagram',
    description: 'FAB sosyal medya kanalı',
    icon: Instagram,
    valueKey: 'instagramUrl',
  },
  phone: {
    title: 'Telefon',
    description: 'Telefon arama kanalı',
    icon: Phone,
    valueKey: 'phone',
  },
  email: {
    title: 'E-posta',
    description: 'E-posta iletişim kanalı',
    icon: Mail,
    valueKey: 'email',
  },
};

const defaults: ContactSettings = {
  fabEnabled: true,
  showOnMobile: true,
  showOnDesktop: true,
  whatsappUrl: '',
  instagramUrl: '',
  phone: '',
  email: '',
  labels: {
    whatsapp: 'WhatsApp ile bize ulaşın',
    instagram: "Instagram'da bizi takip edin",
    phone: 'Telefonla bizi arayın',
    email: 'E-posta gönderin',
  },
  enabled: { whatsapp: true, instagram: true, phone: true, email: true },
  order: ['whatsapp', 'instagram', 'phone', 'email'],
};

let cachedContactSettings: ContactSettings | null = null;

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

export default function ContactSocialWorkspace(_props: { selectedItemId: string }) {
  const [settings, setSettings] = useState<ContactSettings>(
    cachedContactSettings ?? defaults,
  );
  const [loading, setLoading] = useState(cachedContactSettings === null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState<WorkspaceToast | null>(null);

  const load = useCallback(async () => {
    if (!cachedContactSettings) setLoading(true);
    try {
      const response = await fetch('/api/site-contact', { cache: 'no-store', credentials: 'include' });
      if (!response.ok) throw new Error(await readError(response));
      const next = (await response.json()) as ContactSettings;
      cachedContactSettings = next;
      setSettings(next);
    } catch (error) {
      setToast({
        id: Date.now(),
        kind: 'error',
        title: 'İletişim ayarları yüklenemedi',
        message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleChannels = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase('tr-TR');
    const rows = settings.order.filter((id) => {
      if (!query) return true;
      return `${channelMeta[id].title} ${settings.labels[id]} ${String(settings[channelMeta[id].valueKey] ?? '')}`
        .toLocaleLowerCase('tr-TR')
        .includes(query);
    });
    return rows;
  }, [filter, settings]);

  function update<K extends keyof ContactSettings>(key: K, value: ContactSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateChannel<K extends 'labels' | 'enabled'>(
    key: K,
    id: ChannelId,
    value: ContactSettings[K][ChannelId],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: { ...current[key], [id]: value },
    }));
  }

  function move(id: ChannelId, direction: -1 | 1) {
    setSettings((current) => {
      const next = [...current.order];
      const index = next.indexOf(id);
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, order: next };
    });
  }

  function sortChannels() {
    const nextDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(nextDirection);
    setSettings((current) => ({
      ...current,
      order: [...current.order].sort((left, right) =>
        channelMeta[left].title.localeCompare(channelMeta[right].title, 'tr') *
        (nextDirection === 'asc' ? 1 : -1),
      ),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch('/api/site-contact', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          reason: 'İletişim ve sosyal medya ayarları yönetim panelinden güncellendi.',
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const next = (await response.json()) as ContactSettings;
      cachedContactSettings = next;
      setSettings(next);
      setToast({
        id: Date.now(),
        kind: 'success',
        title: 'İletişim ayarları kaydedildi',
        message: 'FAB menüsü ve kanal bilgileri canlı site için güncellendi.',
      });
    } catch (error) {
      setToast({
        id: Date.now(),
        kind: 'error',
        title: 'Ayarlar kaydedilemedi',
        message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
      });
    } finally {
      setSaving(false);
    }
  }

  const exportRows = [
    ['Kanal', 'Aktif', 'Bağlantı / değer', 'Buton metni', 'Sıra'],
    ...visibleChannels.map((id, index) => [
      channelMeta[id].title,
      settings.enabled[id] ? 'Evet' : 'Hayır',
      String(settings[channelMeta[id].valueKey] ?? ''),
      settings.labels[id],
      index + 1,
    ]),
  ];

  return (
    <WorkspaceFrame
      eyebrow="Site Yönetimi"
      title="İletişim ve Sosyal Medya"
      subtitle="Sabit iletişim menüsünün bağlantılarını, metinlerini, görünürlüğünü ve sırasını yönetin."
      filterValue={filter}
      onFilterChange={setFilter}
      onSort={sortChannels}
      sortDirection={sortDirection}
      exportRows={exportRows}
      exportName="iletisim-ve-sosyal-medya"
      primaryAction={{ label: saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet', onClick: save }}
      secondaryAction={{ label: 'Siteyi aç', onClick: () => window.open('/', '_blank', 'noopener,noreferrer') }}
      toast={toast}
      onDismissToast={() => setToast(null)}
    >
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-[2rem] border border-black/[0.05] bg-white/65" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5 shadow-3xs">
            <div className="mb-4">
              <h2 className="text-[13px] font-black text-gray-950">Görünürlük</h2>
              <p className="mt-1 text-[10px] font-semibold text-gray-400">
                FAB menüsünü ve cihaz bazlı görünürlüğü açıp kapatın.
              </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              {[
                { key: 'fabEnabled' as const, title: 'FAB menüsü', text: 'Tüm sitede iletişim düğmesini göster', icon: Eye },
                { key: 'showOnMobile' as const, title: 'Mobil görünüm', text: 'Telefon ve tablet ekranlarında göster', icon: Smartphone },
                { key: 'showOnDesktop' as const, title: 'Masaüstü görünüm', text: 'Geniş ekranlarda iletişim kartı göster', icon: Monitor },
              ].map((item) => {
                const Icon = item.icon;
                const active = settings[item.key];
                return (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => update(item.key, !active)}
                    className={`rounded-[1.45rem] border p-4 text-left flex items-center gap-3 ${
                      active ? 'border-[#c9ef42] bg-[#efffb0]' : 'border-black/[0.07] bg-[#faf9f6]'
                    }`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#eafda8]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[11px] font-black text-gray-950">{item.title}</strong>
                      <span className="mt-1 block text-[9px] font-semibold text-gray-500">{item.text}</span>
                    </span>
                    <span className={`relative h-6 w-11 rounded-full ${active ? 'bg-black' : 'bg-gray-200'}`}>
                      <span className={`absolute top-1 h-4 w-4 rounded-full ${active ? 'right-1 bg-[#eafda8]' : 'left-1 bg-white'}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5 shadow-3xs">
            <div className="mb-4">
              <h2 className="text-[13px] font-black text-gray-950">İletişim kanalları</h2>
              <p className="mt-1 text-[10px] font-semibold text-gray-400">
                Her kanalın bağlantısını, metnini, durumunu ve sırasını yönetin.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {visibleChannels.map((id) => {
                const meta = channelMeta[id];
                const Icon = meta.icon;
                const value = String(settings[meta.valueKey] ?? '');
                return (
                  <article key={id} className="rounded-[1.6rem] border border-black/[0.07] bg-[#faf9f6] p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e86e4b] text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-[12px] font-black text-gray-950">{meta.title}</strong>
                        <span className="block text-[9px] font-semibold text-gray-400">{meta.description}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => updateChannel('enabled', id, !settings.enabled[id])}
                        className={`relative h-6 w-11 rounded-full ${settings.enabled[id] ? 'bg-black' : 'bg-gray-200'}`}
                        aria-label={`${meta.title} kanalını ${settings.enabled[id] ? 'kapat' : 'aç'}`}
                      >
                        <span className={`absolute top-1 h-4 w-4 rounded-full ${settings.enabled[id] ? 'right-1 bg-[#eafda8]' : 'left-1 bg-white'}`} />
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      <label className="block">
                        <span className="mb-1.5 block text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">
                          Bağlantı / değer
                        </span>
                        <input
                          value={value}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              [meta.valueKey]: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-black/[0.08] bg-white px-3.5 py-3 text-[10.5px] font-semibold text-gray-800 outline-none focus:border-black/25"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">
                          Buton metni
                        </span>
                        <input
                          value={settings.labels[id]}
                          onChange={(event) => updateChannel('labels', id, event.target.value)}
                          className="w-full rounded-2xl border border-black/[0.08] bg-white px-3.5 py-3 text-[10.5px] font-semibold text-gray-800 outline-none focus:border-black/25"
                        />
                      </label>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => move(id, -1)}
                        className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white text-gray-600 hover:text-black"
                        aria-label={`${meta.title} kanalını yukarı taşı`}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(id, 1)}
                        className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white text-gray-600 hover:text-black"
                        aria-label={`${meta.title} kanalını aşağı taşı`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-full bg-black px-5 py-3 text-[10px] font-black text-[#eafda8] disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
            </button>
          </div>
        </div>
      )}
    </WorkspaceFrame>
  );
}
