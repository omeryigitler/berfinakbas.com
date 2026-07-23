import { useEffect, useMemo, useState } from "react";

import { navigateManagement } from "../../data/navigation";
import {
  AppointmentActions,
  EmptyState,
  StatusPill,
  formatDate,
  normalized,
  postAction,
  type ModuleViewsProps,
} from "./shared";

export default function RequestsView(props: ModuleViewsProps) {
  const { data, selectedItemId, filter, sortDirection, refresh, notify } = props;
  const appointments = useMemo(() => {
    const query = normalized(filter);
    return [...(data?.appointments ?? [])]
      .filter((item) => normalized(`${item.client?.firstName} ${item.client?.lastName} ${item.status} ${item.serviceNameSnapshot}`).includes(query))
      .sort((left, right) => (new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()) * (sortDirection === "asc" ? 1 : -1));
  }, [data, filter, sortDirection]);
  const [value, setValue] = useState<Record<string, any>>({});

  useEffect(() => {
    const key = selectedItemId === "mesaj-sablonlari" ? "MESSAGE_TEMPLATES" : "COMMUNICATION_CONSENTS";
    setValue(data?.settings?.[key]?.value ?? {});
  }, [data, selectedItemId]);

  async function save(key: "MESSAGE_TEMPLATES" | "COMMUNICATION_CONSENTS") {
    try {
      await postAction({ action: "SAVE_SETTING", key, value, reason: `${key} yönetim panelinden güncellendi.` });
      notify({ kind: "success", title: "Ayarlar kaydedildi", message: "Değişiklikler veritabanına yazıldı." });
      await refresh();
    } catch (error) {
      notify({ kind: "error", title: "Ayarlar kaydedilemedi", message: error instanceof Error ? error.message : "Beklenmeyen hata." });
    }
  }

  if (selectedItemId === "mesaj-sablonlari") {
    return <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><div className="flex justify-between gap-4"><div><h2 className="text-[13px] font-black">Mesaj şablonları</h2><p className="mt-1 text-[10px] font-semibold text-gray-400">Randevu ve talep yanıt metinleri.</p></div><button type="button" onClick={() => void save("MESSAGE_TEMPLATES")} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Kaydet</button></div><div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">{[["requestReceived", "Talep alındı"], ["appointmentConfirmed", "Randevu onaylandı"], ["appointmentRescheduled", "Randevu değişikliği"], ["paymentReminder", "Ödeme hatırlatma"]].map(([key, label]) => <label key={key} className="rounded-[1.25rem] border border-black/[0.05] bg-[#faf9f6] p-3.5"><span className="mb-2 block text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</span><textarea value={value[key] ?? ""} onChange={(event) => setValue((current) => ({ ...current, [key]: event.target.value }))} className="min-h-24 w-full rounded-xl border border-black/10 bg-white p-3 text-[10px] font-semibold" /></label>)}</div></section>;
  }

  if (selectedItemId === "iletisim-izinleri") {
    return <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><div className="flex justify-between gap-4"><div><h2 className="text-[13px] font-black">İletişim izinleri</h2><p className="mt-1 text-[10px] font-semibold text-gray-400">Talep sonrası iletişim ve bilgilendirme tercihleri.</p></div><button type="button" onClick={() => void save("COMMUNICATION_CONSENTS")} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Kaydet</button></div><div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">{[["appointmentUpdates", "Randevu bildirimleri"], ["serviceInformation", "Hizmet bilgilendirmesi"], ["marketingMessages", "Pazarlama mesajları"], ["pdfDelivery", "PDF gönderimi"]].map(([key, label]) => { const active = value[key] !== false; return <button key={key} type="button" onClick={() => setValue((current) => ({ ...current, [key]: !active }))} className={`rounded-[1.25rem] border p-4 text-left ${active ? "border-[#c9ef42] bg-[#efffb0]" : "border-black/[0.06] bg-[#faf9f6]"}`}><strong className="text-[11px] font-black">{label}</strong><span className="mt-2 block text-[9px] font-bold text-gray-500">{active ? "Aktif" : "Pasif"}</span></button>; })}</div></section>;
  }

  if (selectedItemId === "gonderim-gecmisi") {
    return appointments.length === 0 ? <EmptyState title="Gönderim geçmişi bulunamadı" text="Outbox veya mesaj gönderim kayıtları oluştuğunda burada gösterilecek." /> : <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">{appointments.map((item, index) => <article key={item.id} className={`grid grid-cols-[1fr_220px_auto] gap-4 px-5 py-4 ${index ? "border-t border-black/[0.05]" : ""}`}><div><strong className="block text-[11px] font-black">{item.client.firstName} {item.client.lastName}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{item.serviceNameSnapshot}</span></div><span className="text-[10px] font-bold text-gray-600">{formatDate(item.startsAt, true, data?.timeZone)}</span><StatusPill value={item.status} /></article>)}</section>;
  }

  return <div className="space-y-3 pb-4"><div className="flex justify-end"><button type="button" onClick={() => navigateManagement("randevular", "liste")} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Randevularda yönet</button></div>{appointments.length === 0 ? <EmptyState title="Bekleyen talep yok" text="Yeni başvurular ve inceleme bekleyen randevular burada görünür." /> : <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">{appointments.map((item, index) => <article key={item.id} className={`grid grid-cols-[1fr_220px_auto] gap-4 px-5 py-4 ${index ? "border-t border-black/[0.05]" : ""}`}><button type="button" onClick={() => navigateManagement("randevular", "liste", item.id)} className="text-left"><strong className="block text-[11px] font-black">{item.client.firstName} {item.client.lastName}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{item.serviceNameSnapshot} · {item.source}</span></button><span className="text-[10px] font-bold text-gray-600">{formatDate(item.startsAt, true, data?.timeZone)}</span><div className="min-w-[160px] text-right"><StatusPill value={item.status} /><AppointmentActions appointment={item} refresh={refresh} notify={notify} /></div></article>)}</section>}</div>;
}
