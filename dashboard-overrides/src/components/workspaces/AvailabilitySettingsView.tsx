import { Link2 } from 'lucide-react';
import { Field, Metric, StatusPill, type ModuleViewsProps } from './shared';

export default function AvailabilitySettingsView({ props, controller }: { props: ModuleViewsProps; controller: any }) {
  const { data, selectedItemId } = props;
  const { settingsValue, setSettingsValue, saveSetting, saving } = controller;
  if (selectedItemId === 'randevu-kurallari' || selectedItemId === 'ilk-gorusme') {
    const firstMeeting = selectedItemId === 'ilk-gorusme';
    return (
      <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-[13px] font-black text-gray-950">{firstMeeting ? 'İlk görüşme ayarları' : 'Randevu kuralları'}</h2><p className="mt-1 text-[10px] font-semibold text-gray-400">Değişiklikler veritabanında ve ayar geçmişinde saklanır.</p></div>
          <button type="button" disabled={saving} onClick={() => void saveSetting(firstMeeting ? 'FIRST_MEETING_SETTINGS' : 'BOOKING_RULES')} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8] disabled:opacity-50">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
        </div>
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-3">
          {firstMeeting ? <>
            <Field label="Aktif"><select value={settingsValue.enabled === false ? 'false' : 'true'} onChange={(event) => setSettingsValue((current: any) => ({ ...current, enabled: event.target.value === 'true' }))}><option value="true">Aktif</option><option value="false">Pasif</option></select></Field>
            <Field label="Yetişkin süresi (dk)"><input type="number" min={5} max={240} value={settingsValue.adultDurationMinutes ?? 15} onChange={(event) => setSettingsValue((current: any) => ({ ...current, adultDurationMinutes: Number(event.target.value) }))} /></Field>
            <Field label="Çocuk süresi (dk)"><input type="number" min={5} max={240} value={settingsValue.childDurationMinutes ?? 15} onChange={(event) => setSettingsValue((current: any) => ({ ...current, childDurationMinutes: Number(event.target.value) }))} /></Field>
            <Field label="Ücretli / ücretsiz"><select value={settingsValue.pricing ?? 'FREE'} onChange={(event) => setSettingsValue((current: any) => ({ ...current, pricing: event.target.value }))}><option value="FREE">Ücretsiz</option><option value="PAID">Ücretli</option></select></Field>
            <Field label="Görüşme türü"><select value={settingsValue.locationType ?? 'IN_PERSON'} onChange={(event) => setSettingsValue((current: any) => ({ ...current, locationType: event.target.value }))}><option value="IN_PERSON">Yüz yüze</option><option value="ONLINE">Online</option><option value="HYBRID">Hibrit</option></select></Field>
            <Field label="Varsayılan hizmet"><select value={settingsValue.serviceId ?? ''} onChange={(event) => setSettingsValue((current: any) => ({ ...current, serviceId: event.target.value }))}><option value="">Seçiniz</option>{(data.services ?? []).map((service: any) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></Field>
          </> : <>
            <Field label="Minimum bildirim (saat)"><input type="number" min={0} value={settingsValue.minimumNoticeHours ?? 24} onChange={(event) => setSettingsValue((current: any) => ({ ...current, minimumNoticeHours: Number(event.target.value) }))} /></Field>
            <Field label="İleri rezervasyon (gün)"><input type="number" min={1} value={settingsValue.maximumAdvanceDays ?? 60} onChange={(event) => setSettingsValue((current: any) => ({ ...current, maximumAdvanceDays: Number(event.target.value) }))} /></Field>
            <Field label="İptal penceresi (saat)"><input type="number" min={0} value={settingsValue.cancellationWindowHours ?? 24} onChange={(event) => setSettingsValue((current: any) => ({ ...current, cancellationWindowHours: Number(event.target.value) }))} /></Field>
            <Field label="Değişiklik penceresi (saat)"><input type="number" min={0} value={settingsValue.rescheduleWindowHours ?? 24} onChange={(event) => setSettingsValue((current: any) => ({ ...current, rescheduleWindowHours: Number(event.target.value) }))} /></Field>
            <Field label="Ön tampon (dk)"><input type="number" min={0} value={settingsValue.bufferBeforeMinutes ?? 0} onChange={(event) => setSettingsValue((current: any) => ({ ...current, bufferBeforeMinutes: Number(event.target.value) }))} /></Field>
            <Field label="Son tampon (dk)"><input type="number" min={0} value={settingsValue.bufferAfterMinutes ?? 0} onChange={(event) => setSettingsValue((current: any) => ({ ...current, bufferAfterMinutes: Number(event.target.value) }))} /></Field>
          </>}
        </div>
      </section>
    );
  }

  if (selectedItemId === 'entegrasyonlar') {
    const integrations = [
      { name: 'Google Giriş', detail: 'Yönetici kimlik doğrulaması', active: data.integrations?.googleAuth },
      { name: 'Google Takvim', detail: 'Çift yönlü senkronizasyon', active: data.integrations?.googleCalendar },
      { name: 'E-posta Servisi', detail: 'Resend üzerinden gönderim', active: data.integrations?.email },
      { name: 'Dosya Depolama', detail: 'Supabase Storage', active: data.integrations?.storage },
    ];
    return <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-4">{integrations.map((item) => <article key={item.name} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><div className="flex items-start justify-between gap-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-black text-[#eafda8]"><Link2 className="h-4 w-4" /></span><StatusPill value={item.active ? 'ACTIVE' : 'NOT_CONFIGURED'} /></div><h2 className="mt-5 text-[12px] font-black text-gray-950">{item.name}</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">{item.detail}</p>{!item.active && <p className="mt-4 text-[9px] font-bold text-amber-700">Henüz yapılandırılmamış. Çalışıyormuş gibi işlem sunulmaz.</p>}</article>)}</div>;
  }

  const activeRules = (data.rules ?? []).filter((item: any) => item.status === 'ACTIVE').length;
  const activeExceptions = (data.exceptions ?? []).filter((item: any) => item.status === 'ACTIVE').length;
  return <div className="grid grid-cols-1 xl:grid-cols-3 gap-4"><Metric title="Aktif çalışma kuralı" value={activeRules} text="Haftalık çalışma aralığı" /><Metric title="Aktif istisna" value={activeExceptions} text="Özel veya kapalı zaman" /><Metric title="Saat dilimi" value={data.practitioner.timeZone} text={data.practitioner.displayName} /></div>;
}
