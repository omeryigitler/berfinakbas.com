import { useEffect, useMemo, useState } from "react";
import { ArchiveRestore, Link2, ShieldCheck, UserRound } from "lucide-react";

import { CustomSelect } from "./CustomControls";
import {
  EmptyState,
  Field,
  Metric,
  StatusPill,
  formatDate,
  normalized,
  postAction,
  text,
  type ModuleViewsProps,
} from "./shared";

export function ReportsView({ data, selectedItemId }: ModuleViewsProps) {
  const map: Record<string, any[]> = {
    finans: data?.finance ?? [],
    randevular: data?.appointments ?? [],
    danisanlar: data?.clients ?? [],
    planlar: data?.plans ?? [],
    talepler: (data?.appointments ?? []).filter((row: any) => ["REQUESTED", "PENDING_REVIEW"].includes(row.status)),
  };
  const rows = map[selectedItemId] ?? [];
  if (rows.length === 0) return <EmptyState title="Rapor verisi yok" text="Bu raporu görüntülemek için gerekli yetki veya kayıt bulunmuyor." />;
  return <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">{rows.map((row: any, index: number) => <Metric key={`${selectedItemId}-${index}`} title={row.status ?? row.type ?? row.currency ?? "Kayıt"} value={row._count?._all ?? row._sum?.amountMinor ?? 0} text={row.currency ? `${row.currency} · ${row.type}` : "Canlı veritabanı sonucu"} />)}</div>;
}

export function UsersView({ data, selectedItemId, filter, sortDirection, refresh, notify }: ModuleViewsProps) {
  const users = useMemo(() => {
    const query = normalized(filter);
    return [...(data?.users ?? [])]
      .filter((user) => normalized(`${user.name} ${user.email} ${user.status} ${user.roles?.map((role: any) => role.role.name).join(" ")}`).includes(query))
      .sort((left, right) => text(left.name || left.email).localeCompare(text(right.name || right.email), "tr") * (sortDirection === "asc" ? 1 : -1));
  }, [data, filter, sortDirection]);

  async function toggle(user: any) {
    try {
      await postAction({ action: "UPDATE_USER_STATUS", userId: user.id, status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
      notify({ kind: "success", title: "Kullanıcı durumu güncellendi", message: `${user.name || user.email} hesabı güncellendi.` });
      await refresh();
    } catch (error) {
      notify({ kind: "error", title: "Kullanıcı güncellenemedi", message: error instanceof Error ? error.message : "Beklenmeyen hata." });
    }
  }

  if (selectedItemId === "roller") {
    return <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">{["SUPER_ADMIN", "THERAPIST", "ASSISTANT", "FINANCE", "DEVELOPER"].map((role) => <article key={role} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><ShieldCheck className="h-5 w-5" /><h2 className="mt-4 text-[12px] font-black">{role}</h2><p className="mt-2 text-[9px] font-semibold text-gray-400">Rol atamaları kullanıcı kayıtları üzerinden okunur. Yetkiler kod seviyesindeki izin matrisiyle korunur.</p></article>)}</div>;
  }
  if (selectedItemId === "giris-gecmisi") {
    return <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">{users.map((user, index) => <article key={user.id} className={`grid grid-cols-[1fr_220px_auto] gap-4 px-5 py-4 ${index ? "border-t border-black/[0.05]" : ""}`}><div><strong className="block text-[11px] font-black">{user.name || "İsimsiz kullanıcı"}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{user.email}</span></div><span className="text-[10px] font-bold">{formatDate(user.lastLoginAt, true)}</span><StatusPill value={user.status} /></article>)}</section>;
  }
  return <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">{users.map((user, index) => <article key={user.id} className={`grid grid-cols-[1fr_240px_auto] items-center gap-4 px-5 py-4 ${index ? "border-t border-black/[0.05]" : ""}`}><div><strong className="block text-[11px] font-black">{user.name || "İsimsiz kullanıcı"}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{user.email}</span></div><span className="text-[9px] font-bold text-gray-500">{user.roles?.map((role: any) => role.role.name).join(", ") || "Rol yok"}</span><button type="button" disabled={user.id === data.currentUserId} onClick={() => void toggle(user)} className={`rounded-full px-3 py-2 text-[8px] font-black disabled:opacity-40 ${user.status === "ACTIVE" ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{user.status === "ACTIVE" ? "Askıya al" : "Aktifleştir"}</button></article>)}</section>;
}

export function SettingsView({ data, selectedItemId, refresh, notify }: ModuleViewsProps) {
  const keyMap: Record<string, string> = {
    isletme: "BUSINESS_PROFILE",
    randevu: "BOOKING_RULES",
    bildirimler: "NOTIFICATION_SETTINGS",
    kvkk: "PRIVACY_SETTINGS",
    gorunum: "APPEARANCE_SETTINGS",
  };
  const settingKey = keyMap[selectedItemId];
  const [value, setValue] = useState<Record<string, any>>({});
  useEffect(() => { if (settingKey) setValue(data?.settings?.[settingKey]?.value ?? {}); }, [data, settingKey]);

  async function save() {
    try {
      await postAction({ action: "SAVE_SETTING", key: settingKey, value, reason: `${selectedItemId} ayarları yönetim panelinden güncellendi.` });
      notify({ kind: "success", title: "Ayarlar kaydedildi", message: "Değişiklikler ayar geçmişiyle birlikte saklandı." });
      await refresh();
    } catch (error) {
      notify({ kind: "error", title: "Ayarlar kaydedilemedi", message: error instanceof Error ? error.message : "Beklenmeyen hata." });
    }
  }

  if (selectedItemId === "entegrasyonlar") {
    return <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{Object.entries(data?.integrations ?? {}).map(([name, active]) => <article key={name} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><div className="flex justify-between"><Link2 className="h-5 w-5" /><StatusPill value={active ? "ACTIVE" : "NOT_CONFIGURED"} /></div><h2 className="mt-5 text-[12px] font-black">{name}</h2><p className="mt-2 text-[9px] font-semibold text-gray-400">{active ? "Bağlantı sunucu yapılandırmasında mevcut." : "Henüz yapılandırılmamış; sahte işlem düğmesi gösterilmez."}</p></article>)}</div>;
  }
  if (!settingKey) return <EmptyState title="Ayar görünümü hazır değil" text="Bu ayar için henüz kalıcı veri anahtarı tanımlanmadı." />;

  const fields: Record<string, Array<[string, string, string]>> = {
    isletme: [["displayName", "Görünen ad", "Berfin Akbaş"], ["title", "Unvan", "Dil ve Konuşma Terapisti"], ["timeZone", "Saat dilimi", "Europe/Malta"], ["currency", "Para birimi", "TRY"]],
    randevu: [["minimumNoticeHours", "Minimum bildirim saati", "24"], ["maximumAdvanceDays", "İleri rezervasyon günü", "60"], ["bufferBeforeMinutes", "Ön tampon dakika", "0"], ["bufferAfterMinutes", "Son tampon dakika", "0"]],
    bildirimler: [["appointmentEmail", "Randevu e-postası", "true"], ["paymentEmail", "Ödeme e-postası", "true"], ["requestEmail", "Talep e-postası", "true"], ["dailySummary", "Günlük özet", "false"]],
    kvkk: [["retentionMonths", "Saklama süresi (ay)", "60"], ["marketingDefault", "Pazarlama varsayılanı", "false"], ["auditEnabled", "Audit kaydı", "true"], ["exportEnabled", "Veri dışa aktarımı", "true"]],
    gorunum: [["compactMode", "Kompakt görünüm", "false"], ["reducedMotion", "Azaltılmış hareket", "false"], ["showCat", "Kedi varsayılanı", "true"], ["language", "Panel dili", "tr"]],
  };
  const title = selectedItemId === "isletme" ? "İşletme ayarları" : selectedItemId === "randevu" ? "Randevu ayarları" : selectedItemId === "bildirimler" ? "Bildirim ayarları" : selectedItemId === "kvkk" ? "KVKK ve veri ayarları" : "Görünüm ayarları";

  return (
    <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
      <div className="flex justify-between gap-4"><div><h2 className="text-[13px] font-black">{title}</h2><p className="mt-1 text-[10px] font-semibold text-gray-400">Değişiklikler kalıcı olarak saklanır.</p></div><button type="button" onClick={() => void save()} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Kaydet</button></div>
      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {fields[selectedItemId]?.map(([key, label, defaultValue]) => {
          const boolean = ["true", "false"].includes(defaultValue);
          return <Field key={key} label={label}>{boolean ? <CustomSelect value={String(value[key] ?? defaultValue)} options={[{ label: "Aktif", value: "true" }, { label: "Pasif", value: "false" }]} onChange={(next) => setValue((current) => ({ ...current, [key]: next === "true" }))} /> : <input value={value[key] ?? defaultValue} onChange={(event) => setValue((current) => ({ ...current, [key]: /^\d+$/.test(defaultValue) ? Number(event.target.value) : event.target.value }))} />}</Field>;
        })}
      </div>
    </section>
  );
}

export function ArchiveView({ data, selectedItemId, filter, sortDirection, refresh, notify }: ModuleViewsProps) {
  async function restore(type: "client" | "service", id: string) {
    try {
      await postAction(type === "client" ? { action: "RESTORE_CLIENT", clientId: id } : { action: "RESTORE_SERVICE", serviceId: id });
      notify({ kind: "success", title: "Kayıt geri yüklendi", message: "Kayıt aktif duruma alındı." });
      await refresh();
    } catch (error) {
      notify({ kind: "error", title: "Kayıt geri yüklenemedi", message: error instanceof Error ? error.message : "Beklenmeyen hata." });
    }
  }

  if (selectedItemId === "islem-gecmisi") {
    const audit = [...(data?.audit ?? [])]
      .filter((row) => normalized(`${row.action} ${row.entityType} ${row.reason} ${row.actor?.name} ${row.actor?.email}`).includes(normalized(filter)))
      .sort((left, right) => (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * (sortDirection === "asc" ? 1 : -1));
    if (audit.length === 0) return <EmptyState title="İşlem geçmişi yok" text="Yetkili yönetim işlemleri audit kaydı oluşturduğunda burada görünür." />;
    return <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">{audit.map((row, index) => <article key={row.id} className={`grid grid-cols-[1fr_220px_180px] gap-4 px-5 py-4 ${index ? "border-t border-black/[0.05]" : ""}`}><div><strong className="block text-[11px] font-black">{row.action}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{row.entityType} · {row.entityId}</span></div><span className="text-[10px] font-bold">{row.actor?.name || row.actor?.email || "Sistem"}</span><span className="text-[9px] font-semibold text-gray-500">{formatDate(row.createdAt, true)}</span></article>)}</section>;
  }

  const clients = data?.clients ?? [];
  const services = data?.services ?? [];
  if (clients.length + services.length === 0) return <EmptyState title="Arşivlenmiş kayıt yok" text="Pasif danışan veya hizmet bulunmuyor." />;
  return <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><h2 className="text-[13px] font-black">Danışanlar</h2><div className="mt-4 space-y-2">{clients.map((client: any) => <div key={client.id} className="flex items-center gap-3 rounded-[1.2rem] border border-black/[0.05] bg-[#faf9f6] p-3"><UserRound className="h-4 w-4" /><div className="min-w-0 flex-1"><strong className="block truncate text-[10px] font-black">{client.firstName} {client.lastName}</strong><span className="text-[8.5px] font-semibold text-gray-400">{client.type}</span></div><button type="button" onClick={() => void restore("client", client.id)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[8px] font-black text-emerald-700">Geri yükle</button></div>)}</div></section><section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><h2 className="text-[13px] font-black">Hizmetler</h2><div className="mt-4 space-y-2">{services.map((service: any) => <div key={service.id} className="flex items-center gap-3 rounded-[1.2rem] border border-black/[0.05] bg-[#faf9f6] p-3"><ArchiveRestore className="h-4 w-4" /><strong className="min-w-0 flex-1 truncate text-[10px] font-black">{service.name}</strong><button type="button" onClick={() => void restore("service", service.id)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[8px] font-black text-emerald-700">Geri yükle</button></div>)}</div></section></div>;
}
