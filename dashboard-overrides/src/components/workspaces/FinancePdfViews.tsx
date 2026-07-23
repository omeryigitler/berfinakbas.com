import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  EmptyState,
  Field,
  Metric,
  Mini,
  SimpleInput,
  SimpleSelect,
  StatusPill,
  formatDate,
  money,
  normalized,
  postAction,
  type ModuleViewsProps,
} from './shared';

export function FinanceView({ data, selectedItemId, filter, sortDirection }: ModuleViewsProps) {
  const plans = useMemo(() => {
    const query = normalized(filter);
    return [...(data?.plans ?? [])]
      .filter((plan) => normalized(`${plan.name} ${plan.client?.firstName} ${plan.client?.lastName} ${plan.status}`).includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr') * (sortDirection === 'asc' ? 1 : -1));
  }, [data, filter, sortDirection]);
  const entries = plans.flatMap((plan) => plan.ledgerEntries.map((entry: any) => ({ ...entry, plan })));
  const total = plans.reduce((sum, plan) => sum + Number(plan.totalAmountMinor), 0);
  const paid = entries.filter((entry) => entry.type === 'PAYMENT').reduce((sum, entry) => sum + Number(entry.amountMinor), 0);
  const currency = plans[0]?.currency ?? 'TRY';

  if (selectedItemId === 'finans-ozeti') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Metric title="Toplam plan" value={money(total, currency)} text={`${plans.length} plan`} />
          <Metric title="Kaydedilen ödeme" value={money(paid, currency)} text={`${entries.filter((entry) => entry.type === 'PAYMENT').length} hareket`} />
          <Metric title="Açık fark" value={money(total - paid, currency)} text="Plan toplamı eksi ödemeler" />
        </div>
        <div className="flex justify-end"><button type="button" onClick={() => window.location.assign('/yonetim/odemeler')} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Finans işlemlerini aç</button></div>
      </div>
    );
  }

  if (selectedItemId === 'odemeler') {
    return entries.length === 0 ? <EmptyState title="Ödeme hareketi yok" text="Ödemeler kaydedildiğinde burada görünür." /> : (
      <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
        {entries.map((entry, index) => <article key={entry.id} className={`grid grid-cols-[1fr_180px_160px] gap-4 px-5 py-4 ${index > 0 ? 'border-t border-black/[0.05]' : ''}`}><div><strong className="block text-[11px] font-black">{entry.plan.client.firstName} {entry.plan.client.lastName}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{entry.plan.name}</span></div><span className="text-[10px] font-bold">{formatDate(entry.occurredAt, true)}</span><strong className="text-[11px] font-black">{money(entry.amountMinor, entry.plan.currency)}</strong></article>)}
      </section>
    );
  }

  return plans.length === 0 ? <EmptyState title="Plan bulunamadı" text="Yeni plan oluşturarak finans takibini başlatın." /> : (
    <div className="space-y-3">
      <div className="flex justify-end"><button type="button" onClick={() => window.location.assign('/yonetim/odemeler')} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">+ Plan veya ödeme işlemi</button></div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {plans.map((plan) => <article key={plan.id} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><div className="flex justify-between gap-4"><div><h2 className="text-[12px] font-black">{plan.name}</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">{plan.client.firstName} {plan.client.lastName}</p></div><StatusPill value={plan.status} /></div><div className="mt-4 grid grid-cols-3 gap-2"><Mini label="Tutar" value={money(plan.totalAmountMinor, plan.currency)} /><Mini label="Seans" value={String(plan.sessionCount)} /><Mini label="Süre" value={`${plan.sessionDurationMinutes} dk`} /></div></article>)}
      </div>
    </div>
  );
}

export function PdfView({ data, selectedItemId, filter, sortDirection, refresh, notify }: ModuleViewsProps) {
  const initial = data?.settings?.PDF_RESOURCE_LIBRARY?.value;
  const [resources, setResources] = useState<any[]>(Array.isArray(initial) ? initial : []);
  const [open, setOpen] = useState(false);
  const [delivery, setDelivery] = useState<Record<string, any>>(data?.settings?.PDF_DELIVERY_SETTINGS?.value ?? {});

  useEffect(() => {
    const next = data?.settings?.PDF_RESOURCE_LIBRARY?.value;
    setResources(Array.isArray(next) ? next : []);
    setDelivery(data?.settings?.PDF_DELIVERY_SETTINGS?.value ?? {});
  }, [data]);

  async function saveResources(next = resources) {
    try {
      await postAction({ action: 'SAVE_PDF_RESOURCES', resources: next });
      notify({ kind: 'success', title: 'PDF kaynakları kaydedildi', message: 'Kaynak metadata kayıtları veritabanına yazıldı.' });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'PDF kaynakları kaydedilemedi', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = [
      ...resources,
      {
        id: crypto.randomUUID(),
        title: String(form.get('title') ?? ''),
        language: String(form.get('language') ?? 'Türkçe'),
        status: String(form.get('status') ?? 'DRAFT'),
        url: String(form.get('url') ?? ''),
        description: String(form.get('description') ?? ''),
      },
    ];
    setResources(next);
    setOpen(false);
    await saveResources(next);
  }

  async function saveDelivery() {
    try {
      await postAction({ action: 'SAVE_SETTING', key: 'PDF_DELIVERY_SETTINGS', value: delivery, reason: 'PDF gönderim ayarları güncellendi.' });
      notify({ kind: 'success', title: 'Gönderim ayarları kaydedildi', message: 'E-posta gönderim tercihleri veritabanına yazıldı.' });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'Gönderim ayarları kaydedilemedi', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    }
  }

  if (selectedItemId === 'gonderim-ayarlari') {
    return (
      <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
        <div className="flex justify-between gap-4"><div><h2 className="text-[13px] font-black">PDF gönderim ayarları</h2><p className="mt-1 text-[10px] font-semibold text-gray-400">Talep sonrası e-posta metni ve gönderen bilgisi.</p></div><button type="button" onClick={() => void saveDelivery()} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Kaydet</button></div>
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-3">
          <Field label="Gönderen adı"><input value={delivery.senderName ?? 'Berfin Akbaş'} onChange={(event) => setDelivery((current) => ({ ...current, senderName: event.target.value }))} /></Field>
          <Field label="Yanıt adresi"><input type="email" value={delivery.replyTo ?? ''} onChange={(event) => setDelivery((current) => ({ ...current, replyTo: event.target.value }))} /></Field>
          <label className="xl:col-span-2 rounded-[1.25rem] border border-black/[0.05] bg-[#faf9f6] p-3.5"><span className="mb-2 block text-[8px] font-black uppercase tracking-wider text-gray-400">E-posta metni</span><textarea value={delivery.message ?? ''} onChange={(event) => setDelivery((current) => ({ ...current, message: event.target.value }))} className="min-h-28 w-full rounded-xl border border-black/10 bg-white p-3 text-[10px] font-semibold" /></label>
        </div>
      </section>
    );
  }

  if (selectedItemId === 'talep-kayitlari') {
    const rows = data?.outbox ?? [];
    return rows.length === 0 ? <EmptyState title="PDF gönderim kaydı yok" text="PDF teslim outbox kayıtları oluştuğunda burada görünür." /> : (
      <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">{rows.map((row: any, index: number) => <article key={row.id} className={`grid grid-cols-[1fr_180px_auto] gap-4 px-5 py-4 ${index > 0 ? 'border-t border-black/[0.05]' : ''}`}><div><strong className="block text-[11px] font-black">{row.eventType}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{row.aggregateType} · {row.aggregateId}</span></div><span className="text-[10px] font-bold">{formatDate(row.createdAt, true)}</span><StatusPill value={row.status} /></article>)}</section>
    );
  }

  const query = normalized(filter);
  const visible = [...resources].filter((item) => normalized(`${item.title} ${item.language} ${item.status} ${item.description}`).includes(query)).sort((a, b) => a.title.localeCompare(b.title, 'tr') * (sortDirection === 'asc' ? 1 : -1));
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">+ Yeni kaynak</button></div>
      {open && <form onSubmit={add} className="rounded-[2rem] border border-black/[0.07] bg-white/92 p-5"><div className="grid grid-cols-1 xl:grid-cols-2 gap-3"><SimpleInput name="title" label="Başlık" required /><SimpleInput name="language" label="Dil" defaultValue="Türkçe" required /><SimpleSelect name="status" label="Durum" options={[["DRAFT","Taslak"],["PUBLISHED","Yayında"],["ARCHIVED","Arşivde"]]} /><SimpleInput name="url" label="Dosya URL" type="url" /><label className="xl:col-span-2 space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Açıklama</span><textarea name="description" className="min-h-20 w-full rounded-xl border border-black/10 bg-white p-3 text-[10px] font-semibold" /></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-[10px] font-bold">Vazgeç</button><button type="submit" className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Kaydet</button></div></form>}
      {visible.length === 0 ? <EmptyState title="PDF kaynağı bulunamadı" text="Dosya depolama bağlandığında kaynak URL veya yükleme bilgisiyle kayıt ekleyin." /> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{visible.map((item) => <article key={item.id} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><div className="flex justify-between gap-4"><div><h2 className="text-[12px] font-black">{item.title}</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">{item.language}</p></div><StatusPill value={item.status} /></div><p className="mt-4 text-[10px] font-semibold text-gray-500">{item.description || 'Açıklama yok.'}</p><div className="mt-4 flex gap-2">{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-black">Dosyayı aç</a>}<button type="button" onClick={() => { const next=resources.filter((row)=>row.id!==item.id); setResources(next); void saveResources(next); }} className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[9px] font-black text-red-700">Arşivden kaldır</button></div></article>)}</div>}
    </div>
  );
}
