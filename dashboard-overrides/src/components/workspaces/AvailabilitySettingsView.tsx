import { Link2 } from "lucide-react";

import { CustomSelect } from "./CustomControls";
import { Field, Metric, StatusPill, type ModuleViewsProps } from "./shared";

const booleanOptions = [
  { label: "Aktif", value: "true" },
  { label: "Pasif", value: "false" },
];

export default function AvailabilitySettingsView({
  props,
  controller,
}: {
  props: ModuleViewsProps;
  controller: any;
}) {
  const { data, selectedItemId } = props;
  const { settingsValue, setSettingsValue, saveSetting, saving } = controller;

  if (selectedItemId === "randevu-kurallari" || selectedItemId === "ilk-gorusme") {
    const firstMeeting = selectedItemId === "ilk-gorusme";
    return (
      <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-[13px] font-black text-gray-950">{firstMeeting ? "İlk görüşme ayarları" : "Randevu kuralları"}</h2><p className="mt-1 text-[10px] font-semibold text-gray-400">Değişiklikler veritabanında ve ayar geçmişinde saklanır.</p></div>
          <button type="button" disabled={saving} onClick={() => void saveSetting(firstMeeting ? "FIRST_MEETING_SETTINGS" : "BOOKING_RULES")} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8] disabled:opacity-50">{saving ? "Kaydediliyor..." : "Kaydet"}</button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {firstMeeting ? (
            <>
              <Field label="Aktif"><CustomSelect value={settingsValue.enabled === false ? "false" : "true"} options={booleanOptions} onChange={(value) => setSettingsValue((current: any) => ({ ...current, enabled: value === "true" }))} /></Field>
              <Field label="Yetişkin süresi (dk)"><input type="number" min={5} max={240} value={settingsValue.adultDurationMinutes ?? 15} onChange={(event) => setSettingsValue((current: any) => ({ ...current, adultDurationMinutes: Number(event.target.value) }))} /></Field>
              <Field label="Çocuk süresi (dk)"><input type="number" min={5} max={240} value={settingsValue.childDurationMinutes ?? 15} onChange={(event) => setSettingsValue((current: any) => ({ ...current, childDurationMinutes: Number(event.target.value) }))} /></Field>
              <Field label="Ücretli / ücretsiz"><CustomSelect value={settingsValue.pricing ?? "FREE"} options={[{ label: "Ücretsiz", value: "FREE" }, { label: "Ücretli", value: "PAID" }]} onChange={(value) => setSettingsValue((current: any) => ({ ...current, pricing: value }))} /></Field>
              <Field label="Görüşme türü"><CustomSelect value={settingsValue.locationType ?? "IN_PERSON"} options={[{ label: "Yüz yüze", value: "IN_PERSON" }, { label: "Online", value: "ONLINE" }, { label: "Hibrit", value: "HYBRID" }]} onChange={(value) => setSettingsValue((current: any) => ({ ...current, locationType: value }))} /></Field>
              <Field label="Varsayılan hizmet"><CustomSelect value={settingsValue.serviceId ?? ""} placeholder="Seçiniz" options={[{ label: "Seçiniz", value: "" }, ...(data.services ?? []).map((service: any) => ({ label: service.name, value: service.id }))]} onChange={(value) => setSettingsValue((current: any) => ({ ...current, serviceId: value }))} /></Field>
            </>
          ) : (
            <>
              <Field label="Minimum bildirim (saat)"><input type="number" min={0} value={settingsValue.minimumNoticeHours ?? 24} onChange={(event) => setSettingsValue((current: any) => ({ ...current, minimumNoticeHours: Number(event.target.value) }))} /></Field>
              <Field label="İleri rezervasyon (gün)"><input type="number" min={1} value={settingsValue.maximumAdvanceDays ?? 60} onChange={(event) => setSettingsValue((current: any) => ({ ...current, maximumAdvanceDays: Number(event.target.value) }))} /></Field>
              <Field label="İptal penceresi (saat)"><input type="number" min={0} value={settingsValue.cancellationWindowHours ?? 24} onChange={(event) => setSettingsValue((current: any) => ({ ...current, cancellationWindowHours: Number(event.target.value) }))} /></Field>
              <Field label="Değişiklik penceresi (saat)"><input type="number" min={0} value={settingsValue.rescheduleWindowHours ?? 24} onChange={(event) => setSettingsValue((current: any) => ({ ...current, rescheduleWindowHours: Number(event.target.value) }))} /></Field>
              <Field label="Ön tampon (dk)"><input type="number" min={0} value={settingsValue.bufferBeforeMinutes ?? 0} onChange={(event) => setSettingsValue((current: any) => ({ ...current, bufferBeforeMinutes: Number(event.target.value) }))} /></Field>
              <Field label="Son tampon (dk)"><input type="number" min={0} value={settingsValue.bufferAfterMinutes ?? 0} onChange={(event) => setSettingsValue((current: any) => ({ ...current, bufferAfterMinutes: Number(event.target.value) }))} /></Field>
            </>
          )}
        </div>
      </section>
    );
  }

  if (selectedItemId === "entegrasyonlar") {
    const integrations = [
      { active: data.integrations?.googleAuth, detail: "Yönetici kimlik doğrulaması", name: "Google Giriş" },
      { active: data.integrations?.googleCalendar, detail: "Çift yönlü senkronizasyon", name: "Google Takvim" },
      { active: data.integrations?.email, detail: "Resend üzerinden gönderim", name: "E-posta Servisi" },
      { active: data.integrations?.storage, detail: "Supabase Storage", name: "Dosya Depolama" },
    ];
    return <div className="grid grid-cols-1 gap-4 pb-4 xl:grid-cols-2">{integrations.map((item) => <article key={item.name} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-black text-[#eafda8]"><Link2 className="h-4 w-4" /></span><StatusPill value={item.active ? "ACTIVE" : "NOT_CONFIGURED"} /></div><h2 className="mt-5 text-[12px] font-black">{item.name}</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">{item.detail}</p>{!item.active ? <p className="mt-4 text-[9px] font-bold text-amber-700">Henüz yapılandırılmamış. Çalışıyormuş gibi işlem sunulmaz.</p> : null}</article>)}</div>;
  }

  const activeRules = (data.rules ?? []).filter((item: any) => item.status === "ACTIVE").length;
  const activeExceptions = (data.exceptions ?? []).filter((item: any) => item.status === "ACTIVE").length;
  return <div className="grid grid-cols-1 gap-4 xl:grid-cols-3"><Metric title="Aktif çalışma kuralı" value={activeRules} text="Haftalık çalışma aralığı" /><Metric title="Aktif istisna" value={activeExceptions} text="Özel veya kapalı zaman" /><Metric title="Saat dilimi" value={data.practitioner?.timeZone ?? "—"} text={data.practitioner?.displayName ?? "Terapist bulunamadı"} /></div>;
}
