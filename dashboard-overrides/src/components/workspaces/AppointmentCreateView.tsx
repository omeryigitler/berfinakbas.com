import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarPlus } from 'lucide-react';
import { CustomDatePicker } from '../CustomDatePicker';
import { CustomSelect } from '../CustomSelect';
import { CustomTimePicker } from '../CustomTimePicker';
import { EmptyState, responseError, type ModuleViewsProps } from './shared';

const todayInput = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

export default function AppointmentCreateView({ refresh, notify, onOpenWorkspace }: ModuleViewsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ clients: any[]; practitioners: any[]; services: any[] }>({
    clients: [], practitioners: [], services: [],
  });
  const [form, setForm] = useState({
    clientId: '',
    serviceId: '',
    practitionerId: '',
    date: todayInput(),
    time: '09:00',
    durationMinutes: 45,
    locationType: 'IN_PERSON',
    note: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/admin/appointment-prerequisites', {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(await responseError(response));
        const payload = await response.json();
        if (cancelled) return;
        const next = payload?.data ?? {};
        setData({
          clients: next.clients ?? [],
          practitioners: next.practitioners ?? [],
          services: next.services ?? [],
        });
        setForm((current) => ({
          ...current,
          practitionerId: next.practitioners?.[0]?.id ?? '',
        }));
      } catch (error) {
        if (!cancelled) {
          notify({
            kind: 'error',
            title: 'Randevu bilgileri yüklenemedi',
            message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [notify]);

  const selectedClient = useMemo(
    () => data.clients.find((client) => client.id === form.clientId) ?? null,
    [data.clients, form.clientId],
  );

  const clientOptions = data.clients.map((client) => ({
    value: client.id,
    label: `${client.firstName} ${client.lastName}`.trim(),
  }));
  const serviceOptions = data.services.map((service) => ({ value: service.id, label: service.name }));
  const practitionerOptions = data.practitioners.map((practitioner) => ({
    value: practitioner.id,
    label: practitioner.displayName,
  }));

  function selectService(serviceId: string) {
    const service = data.services.find((item) => item.id === serviceId);
    setForm((current) => ({
      ...current,
      serviceId,
      durationMinutes: Number(service?.defaultDurationMinutes ?? current.durationMinutes),
      locationType: service?.locationType === 'ONLINE' ? 'ONLINE' : 'IN_PERSON',
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.clientId || !form.serviceId || !form.practitionerId) {
      notify({ kind: 'error', title: 'Eksik bilgi', message: 'Danışan, hizmet ve terapist seçilmelidir.' });
      return;
    }
    const guardianId = selectedClient?.type === 'CHILD' ? selectedClient.guardians?.[0]?.guardianId ?? null : null;
    if (selectedClient?.type === 'CHILD' && !guardianId) {
      notify({ kind: 'error', title: 'Veli gerekli', message: 'Çocuk danışana bağlı bir veli bulunamadı.' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-correlation-id': crypto.randomUUID() },
        body: JSON.stringify({
          appointmentDate: form.date,
          appointmentTime: form.time,
          clientId: form.clientId,
          durationMinutes: Number(form.durationMinutes),
          guardianId,
          locationType: form.locationType,
          practitionerId: form.practitionerId,
          requestNote: form.note.trim() || null,
          serviceId: form.serviceId,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      notify({ kind: 'success', title: 'Randevu oluşturuldu', message: 'Randevu takvime kaydedildi.' });
      await refresh();
      onOpenWorkspace?.('randevular', 'liste');
    } catch (error) {
      notify({
        kind: 'error',
        title: 'Randevu oluşturulamadı',
        message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <EmptyState title="Yükleniyor" text="Randevu seçenekleri hazırlanıyor." />;
  if (data.clients.length === 0 || data.services.length === 0 || data.practitioners.length === 0) {
    return <EmptyState title="Randevu oluşturulamıyor" text="Aktif danışan, hizmet ve terapist kaydı gereklidir." />;
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-black/[0.07] bg-white/90 p-5">
      <div className="flex items-start gap-3 border-b border-black/[0.05] pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-[#eafda8]"><CalendarPlus className="h-4 w-4" /></span>
        <div><h2 className="text-[13px] font-black text-gray-950">Yeni randevu</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">Danışan, hizmet, tarih ve saati seçerek randevuyu oluşturun.</p></div>
      </div>
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-3">
        <CustomSelect label="Danışan" options={clientOptions} value={form.clientId} onChange={(value) => setForm((current) => ({ ...current, clientId: value }))} />
        <CustomSelect label="Hizmet" options={serviceOptions} value={form.serviceId} onChange={selectService} />
        <CustomSelect label="Terapist" options={practitionerOptions} value={form.practitionerId} onChange={(value) => setForm((current) => ({ ...current, practitionerId: value }))} />
        <CustomSelect label="Görüşme türü" options={[{ value: 'IN_PERSON', label: 'Yüz yüze' }, { value: 'ONLINE', label: 'Online' }]} value={form.locationType} onChange={(value) => setForm((current) => ({ ...current, locationType: value }))} />
        <div><span className="mb-1.5 block text-[8px] font-black uppercase tracking-wider text-gray-400">Tarih</span><CustomDatePicker required value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} /></div>
        <div><span className="mb-1.5 block text-[8px] font-black uppercase tracking-wider text-gray-400">Saat</span><CustomTimePicker value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} /></div>
        <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Süre (dk)</span><input type="number" min={5} max={240} required value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold" /></label>
        <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Not</span><input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold" /></label>
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.05] pt-4">
        <button type="button" onClick={() => onOpenWorkspace?.('randevular', 'liste')} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-[10px] font-bold">Vazgeç</button>
        <button type="submit" disabled={saving} className="rounded-full bg-black px-5 py-2.5 text-[10px] font-black text-[#eafda8] disabled:opacity-50">{saving ? 'Kaydediliyor...' : 'Randevuyu oluştur'}</button>
      </div>
    </form>
  );
}
