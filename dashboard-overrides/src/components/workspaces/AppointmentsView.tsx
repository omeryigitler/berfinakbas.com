import { type FormEvent, useMemo, useState } from "react";
import { Clock3, UserRound } from "lucide-react";

import { navigateManagement } from "../../data/navigation";
import {
  AppointmentActions,
  EmptyState,
  SimpleDatePicker,
  SimpleInput,
  SimpleSelect,
  StatusPill,
  formatDate,
  normalized,
  responseError,
  type ModuleViewsProps,
} from "./shared";

function AppointmentCreateForm({ props }: { props: ModuleViewsProps }) {
  const clients = props.data?.clients ?? [];
  const services = props.data?.services ?? [];
  const practitioner = props.data?.practitioner;
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [durationMinutes, setDurationMinutes] = useState(services[0]?.defaultDurationMinutes ?? 45);
  const [locationType, setLocationType] = useState("SERVICE_DEFAULT");
  const [guardianId, setGuardianId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const selectedClient = clients.find((client: any) => client.id === clientId);
  const selectedService = services.find((service: any) => service.id === serviceId);

  function chooseClient(nextClientId: string) {
    setClientId(nextClientId);
    const nextClient = clients.find((client: any) => client.id === nextClientId);
    setGuardianId(nextClient?.guardians?.find((link: any) => link.isPrimary)?.guardianId ?? nextClient?.guardians?.[0]?.guardianId ?? "");
  }

  function chooseService(nextServiceId: string) {
    setServiceId(nextServiceId);
    const nextService = services.find((service: any) => service.id === nextServiceId);
    setDurationMinutes(nextService?.defaultDurationMinutes ?? 45);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!practitioner) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-correlation-id": crypto.randomUUID() },
        body: JSON.stringify({
          appointmentDate,
          appointmentTime: String(form.get("appointmentTime") ?? ""),
          clientId,
          durationMinutes,
          guardianId: selectedClient?.type === "CHILD" ? guardianId || null : null,
          locationType,
          practitionerId: practitioner.id,
          requestNote: String(form.get("requestNote") ?? "") || null,
          serviceId,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = await response.json();
      props.notify({ kind: "success", title: "Randevu oluşturuldu", message: payload.data.publicReference });
      await props.refresh();
      navigateManagement("randevular", "liste", payload.data.id);
    } catch (error) {
      props.notify({ kind: "error", title: "Randevu oluşturulamadı", message: error instanceof Error ? error.message : "Beklenmeyen hata." });
    } finally {
      setSaving(false);
    }
  }

  if (!practitioner || clients.length === 0 || services.length === 0) {
    return <EmptyState title="Randevu oluşturulamıyor" text="Aktif terapist, gerçek aktif hizmet ve danışan kaydı gereklidir." />;
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-black/[0.07] bg-white/92 p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-[14px] font-black">Yeni randevu</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">Gerçek danışan, aktif hizmet ve Berfin Akbaş terapist kaydı kullanılır.</p></div>
        <button type="button" onClick={() => navigateManagement("randevular", "liste")} className="rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-black">Kapat</button>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <SimpleSelect label="Danışan" value={clientId} onChange={(event) => chooseClient(event.target.value)} options={clients.map((client: any) => [client.id, `${client.firstName} ${client.lastName}${client.type === "CHILD" ? " · Çocuk" : ""}`])} />
        <SimpleSelect label="Hizmet" value={serviceId} onChange={(event) => chooseService(event.target.value)} options={services.map((service: any) => [service.id, service.name])} />
        <SimpleInput label="Süre (dk)" name="durationMinutes" type="number" min="5" max="240" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
        <SimpleDatePicker label="Tarih" name="appointmentDate" min={new Date().toISOString().slice(0, 10)} value={appointmentDate} onChange={setAppointmentDate} required />
        <SimpleInput label="Saat" name="appointmentTime" type="time" defaultValue="09:00" required />
        <SimpleSelect label="Görüşme türü" name="locationType" value={locationType} onChange={(event) => setLocationType(event.target.value)} options={[["SERVICE_DEFAULT", "Hizmet varsayılanı"], ["IN_PERSON", "Yüz yüze"], ["ONLINE", "Online"], ["HYBRID", "Hibrit"]]} />
        {selectedClient?.type === "CHILD" ? <SimpleSelect label="Veli" name="guardianId" value={guardianId} onChange={(event) => setGuardianId(event.target.value)} options={(selectedClient.guardians ?? []).map((link: any) => [link.guardianId, `${link.guardian.firstName} ${link.guardian.lastName}`])} /> : null}
        <label className="space-y-1.5 xl:col-span-3"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Not</span><textarea name="requestNote" maxLength={500} className="min-h-20 w-full rounded-xl border border-black/10 bg-white p-3 text-[10px] font-semibold" /></label>
      </div>
      <div className="mt-5 flex justify-end"><button type="submit" disabled={saving} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8] disabled:opacity-50">{saving ? "Oluşturuluyor..." : "Randevuyu oluştur"}</button></div>
    </form>
  );
}

function FocusedAppointment({ appointment, props }: { appointment: any; props: ModuleViewsProps }) {
  const timeZone = props.data?.timeZone ?? "Europe/Istanbul";
  return (
    <section className="rounded-[2rem] border border-black/[0.08] bg-white/92 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><span className="text-[8px] font-black uppercase tracking-[0.14em] text-gray-400">Seçili randevu</span><h2 className="mt-2 text-lg font-black text-gray-950">{appointment.client.firstName} {appointment.client.lastName}</h2><p className="mt-1 text-[9px] font-semibold text-gray-500">{appointment.serviceNameSnapshot} · {appointment.publicReference}</p></div>
        <StatusPill value={appointment.status} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 xl:grid-cols-4">
        <div className="rounded-xl border border-black/[0.05] bg-[#faf9f6] p-3"><span className="block text-[7.5px] font-black uppercase tracking-wider text-gray-400">Zaman</span><strong className="mt-1.5 block text-[9px] font-black">{formatDate(appointment.startsAt, true, timeZone)}</strong></div>
        <div className="rounded-xl border border-black/[0.05] bg-[#faf9f6] p-3"><span className="block text-[7.5px] font-black uppercase tracking-wider text-gray-400">Süre</span><strong className="mt-1.5 block text-[9px] font-black">{appointment.durationMinutesSnapshot} dakika</strong></div>
        <div className="rounded-xl border border-black/[0.05] bg-[#faf9f6] p-3"><span className="block text-[7.5px] font-black uppercase tracking-wider text-gray-400">Görüşme</span><strong className="mt-1.5 block text-[9px] font-black">{appointment.locationTypeSnapshot}</strong></div>
        <div className="rounded-xl border border-black/[0.05] bg-[#faf9f6] p-3"><span className="block text-[7.5px] font-black uppercase tracking-wider text-gray-400">Uzman</span><strong className="mt-1.5 block text-[9px] font-black">{appointment.practitioner.displayName}</strong></div>
      </div>
      {appointment.requestNote ? <p className="mt-4 rounded-[1.2rem] border border-black/[0.05] bg-[#faf9f6] p-3 text-[9px] font-semibold text-gray-600">{appointment.requestNote}</p> : null}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-black/[0.05] pt-3">
        <button type="button" onClick={() => navigateManagement("danisanlar", "liste", appointment.client.id)} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-2 text-[8px] font-black"><UserRound className="h-3.5 w-3.5" />Danışanı aç</button>
        <AppointmentActions appointment={appointment} refresh={props.refresh} notify={props.notify} />
      </div>
    </section>
  );
}

export default function AppointmentsView(props: ModuleViewsProps) {
  const { data, selectedItemId, selectedRecordId, filter, sortDirection, refresh, notify } = props;
  const timeZone = data?.timeZone ?? "Europe/Istanbul";
  const appointments = useMemo(() => {
    const rows = [...(data?.appointments ?? [])];
    const query = normalized(filter);
    const filtered = rows.filter((item) => normalized(`${item.client?.firstName} ${item.client?.lastName} ${item.serviceNameSnapshot} ${item.publicReference} ${item.status}`).includes(query));
    filtered.sort((left, right) => (new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()) * (sortDirection === "asc" ? 1 : -1));
    return filtered;
  }, [data, filter, sortDirection]);
  const focused = selectedRecordId ? appointments.find((item) => item.id === selectedRecordId) : null;

  if (selectedRecordId === "create") return <AppointmentCreateForm props={props} />;
  if (appointments.length === 0) {
    return <div className="space-y-4"><div className="flex justify-end"><button type="button" onClick={() => navigateManagement("randevular", "liste", "create")} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">+ Yeni randevu</button></div><EmptyState title="Randevu bulunamadı" text="Seçilen görünüm ve filtre için kayıt yok." /></div>;
  }

  if (selectedItemId === "takvim") {
    const grouped = appointments.reduce<Record<string, any[]>>((accumulator, appointment) => {
      const day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(appointment.startsAt));
      (accumulator[day] ??= []).push(appointment);
      return accumulator;
    }, {});
    return (
      <div className="space-y-4 pb-4">
        {focused ? <FocusedAppointment appointment={focused} props={props} /> : null}
        <div className="flex justify-end"><button type="button" onClick={() => navigateManagement("randevular", "liste", "create")} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">+ Yeni randevu</button></div>
        {Object.entries(grouped).map(([day, items]) => (
          <section key={day} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
            <h2 className="text-[13px] font-black text-gray-950">{formatDate(day, false, timeZone)}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
              {items.map((appointment) => (
                <article key={appointment.id} className={`rounded-[1.4rem] border p-4 ${appointment.id === selectedRecordId ? "border-black bg-[#efffb0]" : "border-black/[0.06] bg-[#faf9f6]"}`}>
                  <button type="button" onClick={() => navigateManagement("randevular", "takvim", appointment.id)} className="w-full text-left"><div className="flex items-start justify-between gap-3"><div><strong className="block text-[11px] font-black text-gray-950">{appointment.client.firstName} {appointment.client.lastName}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-500">{appointment.serviceNameSnapshot} · {appointment.practitioner.displayName}</span></div><StatusPill value={appointment.status} /></div><div className="mt-3 flex items-center gap-2 text-[9px] font-bold text-gray-500"><Clock3 className="h-3.5 w-3.5" />{formatDate(appointment.startsAt, true, timeZone)}</div></button>
                  <AppointmentActions appointment={appointment} refresh={refresh} notify={notify} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {focused ? <FocusedAppointment appointment={focused} props={props} /> : null}
      <div className="flex justify-end"><button type="button" onClick={() => navigateManagement("randevular", "liste", "create")} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">+ Yeni randevu</button></div>
      <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
        {appointments.map((appointment, index) => (
          <article key={appointment.id} className={`grid grid-cols-[minmax(0,1.4fr)_minmax(180px,.8fr)_auto] items-center gap-4 px-5 py-4 ${index ? "border-t border-black/[0.05]" : ""} ${appointment.id === selectedRecordId ? "bg-[#efffb0]/65" : ""}`}>
            <button type="button" onClick={() => navigateManagement("randevular", "liste", appointment.id)} className="min-w-0 text-left"><strong className="block truncate text-[11px] font-black text-gray-950">{appointment.client.firstName} {appointment.client.lastName}</strong><span className="mt-1 block truncate text-[9px] font-semibold text-gray-500">{appointment.serviceNameSnapshot} · {appointment.publicReference}</span></button>
            <div><strong className="block text-[10px] font-black text-gray-800">{formatDate(appointment.startsAt, true, timeZone)}</strong><span className="mt-1 block text-[8.5px] font-semibold text-gray-400">{appointment.durationMinutesSnapshot} dakika · {appointment.locationTypeSnapshot}</span></div>
            <div className="min-w-[160px] text-right"><StatusPill value={appointment.status} /><AppointmentActions appointment={appointment} refresh={refresh} notify={notify} /></div>
          </article>
        ))}
      </section>
    </div>
  );
}
