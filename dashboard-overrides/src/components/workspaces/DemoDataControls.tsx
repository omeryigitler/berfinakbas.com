import { useState } from 'react';
import { postAction, type ModuleViewsProps } from './shared';

export default function DemoDataControls({ data, notify, refresh }: ModuleViewsProps) {
  const [busy, setBusy] = useState(false);
  const count = Number(data?.demoState?.count ?? 0);

  async function run(action: 'SEED_DEMO_DATA' | 'CLEAN_DEMO_DATA') {
    setBusy(true);
    try {
      await postAction({ action });
      notify({
        kind: 'success',
        title: action === 'SEED_DEMO_DATA' ? 'Örnek danışanlar eklendi' : 'Örnek danışanlar kaldırıldı',
        message: action === 'SEED_DEMO_DATA'
          ? 'Çocuk, yetişkin, borçlu, tamamlanmış ve farklı seans kullanımlarına sahip beş kontrollü kayıt oluşturuldu.'
          : 'Yalnızca kontrollü örnek kayıtlar ve bunlara bağlı hareketler silindi.',
      });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'Örnek veri işlemi tamamlanamadı', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
      <div>
        <h2 className="text-[12px] font-black text-gray-950">Kontrollü inceleme verisi</h2>
        <p className="mt-1 max-w-2xl text-[9px] font-semibold leading-relaxed text-gray-500">
          Gerçek hizmet ve Berfin Akbaş terapist kaydı kullanılarak beş farklı danışan senaryosu oluşturulur. Mevcut durum: {count} örnek danışan.
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run(count > 0 ? 'CLEAN_DEMO_DATA' : 'SEED_DEMO_DATA')}
        className={`rounded-full px-4 py-2.5 text-[9px] font-black disabled:opacity-50 ${count > 0 ? 'border border-red-200 bg-red-50 text-red-700' : 'bg-black text-[#eafda8]'}`}
      >
        {busy ? 'İşleniyor...' : count > 0 ? 'Örnek veriyi kaldır' : '5 örnek danışanı ekle'}
      </button>
    </section>
  );
}
