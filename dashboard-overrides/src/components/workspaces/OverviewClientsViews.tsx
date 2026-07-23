import { type FormEvent, useMemo, useState } from "react";
import { UserRound } from "lucide-react";

import { navigateManagement } from "../../data/navigation";
import {
  EmptyState,
  Metric,
  SimpleInput,
  SimpleSelect,
  StatusPill,
  formatDate,
  money,
  normalized,
  responseError,
  type ModuleViewsProps,
} from "./shared";

export function OverviewView({ data, selectedItemId }: ModuleViewsProps) {
  const summary = data?.summary ?? {};
  const appointments = data?.appointments ?? [];
  const plans = data?.plans ?? [];
  const finance = data?.finance ?? [];
  const timeZone = data?.timeZone ?? "Europe/Istanbul";

  if (selectedItemId === "bugunun-ozeti") {
    if (appointments.length === 0) {
      return <EmptyState title="Bugün randevu yok" text="Bugün için kayıtlı randevu bulunmuyor." />;
    }
    return (
      <div className="space-y-3 pb-4">
        {appointments.map((appointment: any) => (
          <article className="rounded-[1.6rem] border border-black/[0.07] bg-white/90 p-4" key={appointment.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="text-[12px] font-black">{appointment.client.firstName} {appointment.client.lastName}</strong>
                <span className="mt-1 block text-[9px] font-semibold text-gray-500">{appointment.serviceNameSnapshot} · {formatDate(appointment.startsAt, true, timeZone)}</span>
              </div>
              <StatusPill value={appointment.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => navigateManagement("randevular", "liste", appointment.id)} className="rounded-full bg-black px-3 py-2.5 text-[9px] font-black text-[#eafda8]">Randevuyu aç</button>
              <button type="button" onClick={() => navigateManagement("danisanlar", "liste", appointment.client.id)} className="rounded-full border border-black/10 bg-white px-3 py-2.5 text-[9px] font-black">Danışanı aç</button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (selectedItemId === "bekleyen-islemler") {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Metric title="Bekleyen talep" value={summary.pendingAppointments ?? 0} text="İnceleme veya yeni saat bekleyen" />
        <Metric title="Potansiyel danışan" value={summary.prospectiveClients ?? 0} text="Henüz aktifleşmemiş kayıt" />
        <Metric title="Bugünkü randevu" value={summary.todayAppointments ?? 0} text="Bugünkü gerçek randevu sayısı" />
      </div>
    );
  }

  if (selectedItemId === "finans-ozeti") {
    return (
      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Metric title="Aktif plan" value={summary.activePlans ?? 0} text="Devam eden danışan planı" />
          {finance.map((row: any) => <Metric key={row.currency} title={`${row.currency} açık bakiye`} value={money(row.amountMinor, row.currency)} text="Finans hareketlerinin net toplamı" />)}
        </div>
        {plans.length > 0 ? (
          <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
            {plans.slice(0, 8).map((plan: any, index: number) => (
              <article key={plan.id} className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 ${index ? "border-t border-black/[0.05]" : ""}`}>
                <div><strong className="block text-[11px] font-black">{plan.client.firstName} {plan.client.lastName}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{plan.name}</span></div>
                <span className="text-[9px] font-black">{plan.remainingSessions} seans</span>
                <span className="text-[9px] font-black">{money(plan.balanceMinor, plan.currency)}</span>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Metric title="Aktif danışan" value={summary.activeClients ?? 0} text="Veritabanındaki aktif danışan" />
      <Metric title="Potansiyel" value={summary.prospectiveClients ?? 0} text="Takip bekleyen danışan" />
      <Metric title="Bugünkü randevu" value={summary.todayAppointments ?? 0} text="Bugün planlanan görüşme" />
      <Metric title="Bekleyen talep" value={summary.pendingAppointments ?? 0} text="Aksiyon bekleyen randevu" />
      <Metric title="Aktif plan" value={summary.activePlans ?? 0} text="Devam eden plan" />
    </div>
  );
}

function ClientCreateForm({ props }: { props: ModuleViewsProps }) {
  const [type, setType] = useState("ADULT");
  const [status, setStatus] = useState("PROSPECTIVE");
  const [relationship, setRelationship] = useState("Anne / baba");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json", "x-correlation-id": crypto.randomUUID() },
        body: JSON.stringify({
          birthYear: String(form.get("birthYear") ?? "") || null,
          email: String(form.get("email") ?? "") || null,
          firstName: String(form.get("firstName") ?? ""),
          guardianEmail: type === "CHILD" ? String(form.get("guardianEmail") ?? "") || null : null,
          guardianFirstName: type === "CHILD" ? String(form.get("guardianFirstName") ?? "") : null,
          guardianId: null,
          guardianLastName: type === "CHILD" ? String(form.get("guardianLastName") ?? "") : null,
          guardianMode: type === "CHILD" ? "NEW" : null,
          guardianPhone: type === "CHILD" ? String(form.get("guardianPhone") ?? "") : null,
          lastName: String(form.get("lastName") ?? ""),
          phone: String(form.get("phone") ?? "") || null,
          preferredName: String(form.get("preferredName") ?? "") || null,
          relationship: type === "CHILD" ? relationship : null,
          requestId: crypto.randomUUID(),
          status,
          type,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = await response.json();
      props.notify({ kind: "success", title: "Danışan oluşturuldu", message: "Kayıt gerçek danışan veritabanına eklendi." });
      await props.refresh();
      navigateManagement("danisanlar", "liste", payload.data.id);
    } catch (error) {
      props.notify({ kind: "error", title: "Danışan oluşturulamadı", message: error instanceof Error ? error.message : "Beklenmeyen hata." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-black/[0.07] bg-white/92 p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-[14px] font-black">Yeni danışan</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">Yetişkin veya veli bağlantılı çocuk kaydı oluşturun.</p></div>
        <button type="button" onClick={() => navigateManagement("danisanlar", "liste")} className="rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-black">Kapat</button>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <SimpleSelect label="Danışan türü" value={type} onChange={(event) => setType(event.target.value)} options={[["ADULT", "Yetişkin"], ["CHILD", "Çocuk"]]} />
        <SimpleSelect label="Durum" value={status} onChange={(event) => setStatus(event.target.value)} options={[["PROSPECTIVE", "Potansiyel"], ["ACTIVE", "Aktif"], ["INACTIVE", "Pasif"]]} />
        <SimpleInput label="Doğum yılı" name="birthYear" type="number" min="1900" max={new Date().getFullYear()} />
        <SimpleInput label="Ad" name="firstName" required maxLength={120} />
        <SimpleInput label="Soyad" name="lastName" required maxLength={120} />
        <SimpleInput label="Tercih edilen ad" name="preferredName" maxLength={120} />
        <SimpleInput label="Telefon" name="phone" maxLength={40} />
        <SimpleInput label="E-posta" name="email" type="email" maxLength={320} />
        {type === "CHILD" ? (
          <>
            <SimpleInput label="Veli adı" name="guardianFirstName" required maxLength={120} />
            <SimpleInput label="Veli soyadı" name="guardianLastName" required maxLength={120} />
            <SimpleInput label="Veli telefonu" name="guardianPhone" required maxLength={40} />
            <SimpleInput label="Veli e-postası" name="guardianEmail" type="email" maxLength={320} />
            <SimpleSelect label="Yakınlık" value={relationship} onChange={(event) => setRelationship(event.target.value)} options={[["Anne / baba", "Anne / baba"], ["Yasal temsilci", "Yasal temsilci"], ["Diğer", "Diğer"]]} />
          </>
        ) : null}
      </div>
      <div className="mt-5 flex justify-end"><button type="submit" disabled={saving} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8] disabled:opacity-50">{saving ? "Oluşturuluyor..." : "Danışanı oluştur"}</button></div>
    </form>
  );
}

export function ClientsView(props: ModuleViewsProps) {
  const { data, selectedItemId, selectedRecordId, filter, sortDirection } = props;
  if (selectedRecordId === "create") return <ClientCreateForm props={props} />;

  const query = normalized(filter);
  let clients = [...(data?.clients ?? [])].filter((client: any) => normalized(`${client.firstName} ${client.lastName} ${client.email} ${client.phone} ${client.status} ${client.type}`).includes(query));
  if (selectedItemId === "aktif") clients = clients.filter((client: any) => client.status === "ACTIVE");
  if (selectedItemId === "potansiyel") clients = clients.filter((client: any) => client.status === "PROSPECTIVE");
  if (selectedItemId === "cocuklar") clients = clients.filter((client: any) => client.type === "CHILD");
  if (selectedItemId === "borclular") clients = clients.filter((client: any) => client.balanceByCurrency?.some((row: any) => BigInt(row.amountMinor) > 0n));
  clients.sort((left: any, right: any) => `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`, "tr") * (sortDirection === "asc" ? 1 : -1));
  const focused = selectedRecordId ? clients.find((client: any) => client.id === selectedRecordId) : null;

  if (clients.length === 0) return <EmptyState title="Danışan bulunamadı" text="Bu görünüm ve filtre için gerçek danışan kaydı yok." />;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-end"><button type="button" onClick={() => navigateManagement("danisanlar", "liste", "create")} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">+ Yeni danışan</button></div>
      {focused ? (
        <section className="rounded-[2rem] border border-black/[0.08] bg-white/92 p-5">
          <div className="flex items-start justify-between gap-4"><div><span className="text-[8px] font-black uppercase text-gray-400">Danışan profili</span><h2 className="mt-2 text-lg font-black">{focused.firstName} {focused.lastName}</h2><p className="mt-1 text-[9px] font-semibold text-gray-500">{focused.type === "CHILD" ? "Çocuk danışan" : "Yetişkin danışan"} · {focused.email || focused.phone || "İletişim bilgisi yok"}</p></div><StatusPill value={focused.status} /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4"><Metric title="Aktif plan" value={focused.activePlan?.name ?? "Yok"} text="Güncel plan" /><Metric title="Kalan seans" value={focused.remainingSessions ?? 0} text="Seans hareketlerinden hesaplanır" /><Metric title="Randevu" value={focused.appointments?.length ?? 0} text="Son randevu kayıtları" /><Metric title="Veli" value={focused.guardians?.[0] ? `${focused.guardians[0].guardian.firstName} ${focused.guardians[0].guardian.lastName}` : "Yok"} text="Birincil veli bağlantısı" /></div>
          {focused.appointments?.length ? <div className="mt-4 space-y-2">{focused.appointments.map((appointment: any) => <button type="button" key={appointment.id} onClick={() => navigateManagement("randevular", "liste", appointment.id)} className="flex w-full items-center justify-between rounded-xl border border-black/[0.05] bg-[#faf9f6] px-3 py-2.5 text-left"><span className="text-[9px] font-black">{appointment.serviceNameSnapshot}</span><span className="text-[8px] font-semibold text-gray-500">{formatDate(appointment.startsAt, true, data?.timeZone)}</span></button>)}</div> : null}
        </section>
      ) : null}
      <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
        {clients.map((client: any, index: number) => (
          <button key={client.id} type="button" onClick={() => navigateManagement("danisanlar", selectedItemId, client.id)} className={`grid w-full grid-cols-[1fr_150px_150px_auto] items-center gap-4 px-5 py-4 text-left ${index ? "border-t border-black/[0.05]" : ""} ${client.id === selectedRecordId ? "bg-[#efffb0]/65" : ""}`}>
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-[#eafda8]"><UserRound className="h-4 w-4" /></span><div className="min-w-0"><strong className="block truncate text-[11px] font-black">{client.firstName} {client.lastName}</strong><span className="mt-1 block truncate text-[8.5px] font-semibold text-gray-400">{client.email || client.phone || "İletişim bilgisi yok"}</span></div></div>
            <span className="text-[9px] font-black">{client.activePlan?.name ?? "Plan yok"}</span>
            <span className="text-[9px] font-black">{client.remainingSessions ?? 0} seans</span>
            <StatusPill value={client.status} />
          </button>
        ))}
      </section>
    </div>
  );
}
