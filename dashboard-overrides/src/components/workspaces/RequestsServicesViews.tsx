import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AppointmentActions,
  EmptyState,
  Field,
  Mini,
  SimpleInput,
  SimpleSelect,
  StatusPill,
  formatDate,
  normalized,
  postAction,
  responseError,
  type ModuleViewsProps,
} from './shared';

export function RequestsView({
  data,
  selectedItemId,
  filter,
  sortDirection,
  refresh,
  notify,
}: ModuleViewsProps) {
  const appointments = useMemo(() => {
    const query = normalized(filter);
    return [...(data?.appointments ?? [])]
      .filter((item) =>
        normalized(`${item.client?.firstName} ${item.client?.lastName} ${item.status} ${item.serviceNameSnapshot}`).includes(query),
      )
      .sort(
        (left, right) =>
          (new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()) *
          (sortDirection === 'asc' ? 1 : -1),
      );
  }, [data, filter, sortDirection]);
  const [value, setValue] = useState<Record<string, any>>({});

  useEffect(() => {
    const key = selectedItemId === 'mesaj-sablonlari' ? 'MESSAGE_TEMPLATES' : 'COMMUNICATION_CONSENTS';
    setValue(data?.settings?.[key]?.value ?? {});
  }, [data, selectedItemId]);

  async function save(key: 'MESSAGE_TEMPLATES' | 'COMMUNICATION_CONSENTS') {
    try {
      await postAction({
        action: 'SAVE_SETTING',
        key,
        value,
        reason: `${key} yönetim panelinden güncellendi.`,
      });
      notify({ kind: 'success', title: 'Ayarlar kaydedildi', message: 'Değişiklikler veritabanına yazıldı.' });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'Ayarlar kaydedilemedi', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    }
  }

  if (selectedItemId === 'mesaj-sablonlari') {
    return (
      <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
        <div className="flex justify-between gap-4">
          <div><h2 className="text-[13px] font-black">Mesaj şablonları</h2><p className="mt-1 text-[10px] font-semibold text-gray-400">Randevu ve talep yanıt metinleri.</p></div>
          <button type="button" onClick={() => void save('MESSAGE_TEMPLATES')} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Kaydet</button>
        </div>
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-3">
          {[
            ['requestReceived', 'Talep alındı'],
            ['appointmentConfirmed', 'Randevu onaylandı'],
            ['appointmentRescheduled', 'Randevu değişikliği'],
            ['paymentReminder', 'Ödeme hatırlatma'],
          ].map(([key, label]) => (
            <label key={key} className="rounded-[1.25rem] border border-black/[0.05] bg-[#faf9f6] p-3.5">
              <span className="mb-2 block text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</span>
              <textarea value={value[key] ?? ''} onChange={(event) => setValue((current) => ({ ...current, [key]: event.target.value }))} className="min-h-24 w-full rounded-xl border border-black/10 bg-white p-3 text-[10px] font-semibold" />
            </label>
          ))}
        </div>
      </section>
    );
  }

  if (selectedItemId === 'iletisim-izinleri') {
    return (
      <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
        <div className="flex justify-between gap-4">
          <div><h2 className="text-[13px] font-black">İletişim izinleri</h2><p className="mt-1 text-[10px] font-semibold text-gray-400">Talep sonrası iletişim ve bilgilendirme tercihleri.</p></div>
          <button type="button" onClick={() => void save('COMMUNICATION_CONSENTS')} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Kaydet</button>
        </div>
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-3">
          {[
            ['appointmentUpdates', 'Randevu bildirimleri'],
            ['serviceInformation', 'Hizmet bilgilendirmesi'],
            ['marketingMessages', 'Pazarlama mesajları'],
            ['pdfDelivery', 'PDF gönderimi'],
          ].map(([key, label]) => {
            const active = value[key] !== false;
            return (
              <button key={key} type="button" onClick={() => setValue((current) => ({ ...current, [key]: !active }))} className={`rounded-[1.25rem] border p-4 text-left ${active ? 'border-[#c9ef42] bg-[#efffb0]' : 'border-black/[0.06] bg-[#faf9f6]'}`}>
                <strong className="text-[11px] font-black text-gray-950">{label}</strong>
                <span className="mt-2 block text-[9px] font-bold text-gray-500">{active ? 'Aktif' : 'Pasif'}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (selectedItemId === 'gonderim-gecmisi') {
    return appointments.length === 0 ? (
      <EmptyState title="Gönderim geçmişi bulunamadı" text="Outbox veya mesaj gönderim kayıtları oluştuğunda burada gösterilecek." />
    ) : (
      <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
        {appointments.map((item, index) => (
          <article key={item.id} className={`grid grid-cols-[1fr_220px_auto] gap-4 px-5 py-4 ${index > 0 ? 'border-t border-black/[0.05]' : ''}`}>
            <div><strong className="block text-[11px] font-black">{item.client.firstName} {item.client.lastName}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{item.serviceNameSnapshot}</span></div>
            <span className="text-[10px] font-bold text-gray-600">{formatDate(item.startsAt, true)}</span>
            <StatusPill value={item.status} />
          </article>
        ))}
      </section>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => window.location.assign('/yonetim/randevular')} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Randevularda yönet</button>
      </div>
      {appointments.length === 0 ? (
        <EmptyState title="Bekleyen talep yok" text="Yeni başvurular ve inceleme bekleyen randevular burada görünür." />
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
          {appointments.map((item, index) => (
            <article key={item.id} className={`grid grid-cols-[1fr_220px_auto] gap-4 px-5 py-4 ${index > 0 ? 'border-t border-black/[0.05]' : ''}`}>
              <div><strong className="block text-[11px] font-black">{item.client.firstName} {item.client.lastName}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{item.serviceNameSnapshot} · {item.source}</span></div>
              <span className="text-[10px] font-bold text-gray-600">{formatDate(item.startsAt, true)}</span>
              <div className="min-w-[160px] text-right">
                <StatusPill value={item.status} />
                <AppointmentActions appointment={item} refresh={refresh} notify={notify} />
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export function ServicesView({ data, filter, sortDirection, refresh, notify }: ModuleViewsProps) {
  const [open, setOpen] = useState(false);
  const services = useMemo(() => {
    const query = normalized(filter);
    return [...(data?.services ?? [])]
      .filter((item) => normalized(`${item.name} ${item.slug} ${item.status} ${item.locationType}`).includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr') * (sortDirection === 'asc' ? 1 : -1));
  }, [data, filter, sortDirection]);

  async function toggleStatus(service: any) {
    const status = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await postAction({ action: 'UPDATE_SERVICE_STATUS', serviceId: service.id, status });
      notify({
        kind: 'success',
        title: 'Hizmet durumu güncellendi',
        message: `${service.name} ${status === 'ACTIVE' ? 'aktif' : 'pasif'} duruma alındı.`,
      });
      await refresh();
    } catch (error) {
      notify({
        kind: 'error',
        title: 'Hizmet güncellenemedi',
        message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
      });
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get('name') ?? ''),
      slug: String(form.get('slug') ?? ''),
      publicDescription: String(form.get('publicDescription') ?? '') || null,
      status: String(form.get('status') ?? 'DRAFT'),
      publicVisible: form.get('publicVisible') === 'on',
      approvalMode: String(form.get('approvalMode') ?? 'MANUAL'),
      durationMinutes: Number(form.get('durationMinutes') ?? 45),
      bufferBeforeMinutes: Number(form.get('bufferBeforeMinutes') ?? 0),
      bufferAfterMinutes: Number(form.get('bufferAfterMinutes') ?? 0),
      locationType: String(form.get('locationType') ?? 'IN_PERSON'),
      sortOrder: Number(form.get('sortOrder') ?? 0),
      reason: 'Hizmet yönetim panelinden oluşturuldu.',
      policy: {
        bookingMinNoticeMinutes: Number(form.get('bookingMinNoticeMinutes') ?? 1440),
        bookingMaxAdvanceDays: Number(form.get('bookingMaxAdvanceDays') ?? 60),
        cancellationWindowMinutes: Number(form.get('cancellationWindowMinutes') ?? 1440),
        rescheduleWindowMinutes: Number(form.get('rescheduleWindowMinutes') ?? 1440),
        maxDailyAppointments: null,
      },
    };
    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-correlation-id': crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setOpen(false);
      notify({ kind: 'success', title: 'Hizmet oluşturuldu', message: 'Hizmet ve rezervasyon politikası kaydedildi.' });
      await refresh();
    } catch (error) {
      notify({ kind: 'error', title: 'Hizmet oluşturulamadı', message: error instanceof Error ? error.message : 'Beklenmeyen hata.' });
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">+ Yeni hizmet</button>
      </div>
      {open && (
        <form onSubmit={create} className="rounded-[2rem] border border-black/[0.07] bg-white/92 p-5">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <SimpleInput name="name" label="Hizmet adı" required />
            <SimpleInput name="slug" label="Slug" required />
            <SimpleInput name="durationMinutes" label="Süre (dk)" type="number" defaultValue="45" required />
            <SimpleInput name="bufferBeforeMinutes" label="Ön tampon (dk)" type="number" defaultValue="0" />
            <SimpleInput name="bufferAfterMinutes" label="Son tampon (dk)" type="number" defaultValue="0" />
            <SimpleInput name="sortOrder" label="Sıra" type="number" defaultValue="0" />
            <SimpleSelect name="status" label="Durum" options={[["DRAFT","Taslak"],["ACTIVE","Aktif"],["INACTIVE","Pasif"]]} />
            <SimpleSelect name="approvalMode" label="Onay" options={[["MANUAL","Manuel"],["AUTOMATIC","Otomatik"]]} />
            <SimpleSelect name="locationType" label="Konum" options={[["IN_PERSON","Yüz yüze"],["ONLINE","Online"],["HYBRID","Hibrit"]]} />
            <SimpleInput name="bookingMinNoticeMinutes" label="Minimum bildirim (dk)" type="number" defaultValue="1440" />
            <SimpleInput name="bookingMaxAdvanceDays" label="İleri rezervasyon (gün)" type="number" defaultValue="60" />
            <SimpleInput name="cancellationWindowMinutes" label="İptal penceresi (dk)" type="number" defaultValue="1440" />
            <SimpleInput name="rescheduleWindowMinutes" label="Değişiklik penceresi (dk)" type="number" defaultValue="1440" />
            <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold"><input name="publicVisible" type="checkbox" /> Sitede görünür</label>
            <label className="xl:col-span-3 space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Açıklama</span><textarea name="publicDescription" className="min-h-20 w-full rounded-xl border border-black/10 bg-white p-3 text-[10px] font-semibold" /></label>
          </div>
          <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-[10px] font-bold">Vazgeç</button><button type="submit" className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Hizmeti oluştur</button></div>
        </form>
      )}
      {services.length === 0 ? (
        <EmptyState title="Hizmet bulunamadı" text="Yeni hizmet oluşturarak rezervasyon akışını yapılandırın." />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {services.map((service) => (
            <article key={service.id} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-[12px] font-black text-gray-950">{service.name}</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">/{service.slug}</p></div><StatusPill value={service.status} /></div>
              <p className="mt-4 text-[10px] font-semibold leading-relaxed text-gray-500">{service.publicDescription || 'Açıklama girilmedi.'}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Süre" value={`${service.defaultDurationMinutes} dk`} />
                <Mini label="Konum" value={service.locationType} />
                <Mini label="Onay" value={service.approvalMode} />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void toggleStatus(service)}
                  className={`rounded-full border px-3 py-2 text-[8px] font-black ${
                    service.status === 'ACTIVE'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {service.status === 'ACTIVE' ? 'Pasife al' : 'Aktifleştir'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
