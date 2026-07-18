"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import {
  buildHubStatusUrl,
  getHubActions,
  type HubAction,
} from "./hub-actions";
import { HubAvatar } from "./hub-avatar";
import {
  groupRecords,
  hubGroupLabels,
  hubStatusLabels,
  type HubRecord,
} from "./hub-model";

type Section = "danisanlar" | "talepler";

const menu = [
  {
    group: "Çalışma Alanım",
    items: [{ href: "/yonetim/baslangic", icon: "⌂", label: "Genel bakış" }],
  },
  {
    group: "Randevular",
    items: [
      { href: "/yonetim/hub", icon: "▦", label: "Talep kuyruğu" },
      { href: "/yonetim/randevular", icon: "◷", label: "Randevu operasyonu" },
      { href: "/yonetim/musaitlik", icon: "▤", label: "Müsaitlik yönetimi" },
    ],
  },
  {
    group: "Danışanlar",
    items: [
      {
        href: "/yonetim/hub?bolum=danisanlar",
        icon: "◉",
        label: "Danışan kayıt merkezi",
      },
      { href: "/yonetim/danisanlar", icon: "○", label: "Danışan yönetimi" },
      { href: "/yonetim/danisan-olustur", icon: "+", label: "Yeni danışan" },
    ],
  },
  {
    group: "Finans",
    items: [
      { href: "/yonetim/odemeler", icon: "₺", label: "Ödeme ve planlar" },
    ],
  },
  {
    group: "Site Yönetimi",
    items: [
      {
        href: "/yonetim?alan=public-iletisim-ayarlari",
        icon: "⌁",
        label: "İletişim ayarları",
      },
      {
        href: "/yonetim?alan=hizmet-terapist-ayarlari",
        icon: "⚙",
        label: "Hizmet ve terapist",
      },
    ],
  },
] as const;

function CircleLink({
  href,
  label,
  children,
}: {
  href: Route;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      aria-label={label}
      className="grid size-10 place-items-center rounded-full border border-black/10 bg-white/25 text-lg text-slate-600 transition hover:bg-white hover:text-black"
      href={href}
      title={label}
    >
      {children}
    </Link>
  );
}

function Status({ record }: { record: HubRecord }) {
  return (
    <span className="rounded-full border border-black/5 bg-white/55 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-600">
      {hubStatusLabels[record.status]}
    </span>
  );
}

export function DashboardAdmin({
  appointments,
  canManage = false,
  canReadClients = false,
  clients = [],
  toolbar = null,
}: {
  appointments: readonly HubRecord[];
  canManage?: boolean;
  canReadClients?: boolean;
  clients?: readonly HubRecord[];
  toolbar?: ReactNode;
  availability?: unknown;
  finance?: unknown;
  preferredSection?: string;
  sampleAppointments?: readonly HubRecord[];
  sampleClients?: readonly HubRecord[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section: Section =
    searchParams.get("bolum") === "danisanlar" && canReadClients
      ? "danisanlar"
      : "talepler";
  const records = section === "danisanlar" ? clients : appointments;
  const selectedId = searchParams.get("kayit");
  const selected =
    records.find((record) => record.id === selectedId) ?? records[0] ?? null;
  const [pending, setPending] = useState<string | null>(null);
  const buckets = useMemo(() => groupRecords(records), [records]);
  const actions =
    selected?.kind === "randevu" && selected.rawStatus
      ? getHubActions(selected.rawStatus, canManage)
      : [];

  function select(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("kayit", id);
    else params.delete("kayit");
    router.replace(`${pathname}?${params.toString()}` as Route, {
      scroll: false,
    });
  }

  async function run(action: HubAction) {
    if (!selected) return;
    setPending(action.id);
    const response = await fetch(buildHubStatusUrl(selected.id), {
      body: JSON.stringify({
        reasonCode: action.reasonCode,
        toStatus: action.toStatus,
      }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    });
    setPending(null);
    if (response.ok) router.refresh();
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#eae8e1] font-sans text-[#323130]">
      <aside className="flex h-screen w-60 shrink-0 flex-col bg-[#eae8e1]">
        <div className="flex h-16 items-center gap-3 border-b border-black/5 px-4">
          <span className="grid size-7 place-items-center rounded-full border border-black/10 bg-white">
            BA
          </span>
          <strong className="text-sm">Berfin Akbaş</strong>
          <span className="h-4 w-px bg-black/10" />
          <small className="text-xs text-slate-500">Yönetim</small>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-5 flex items-center justify-between px-2">
            <h1 className="text-xl font-bold">Menü</h1>
            <span className="grid size-7 place-items-center rounded-full border border-black/10">
              ←
            </span>
          </div>
          {menu.map((group) => (
            <section className="mb-5" key={group.group}>
              <h2 className="mb-1 px-3 text-[11px] font-extrabold text-slate-800">
                {group.group}
              </h2>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    String(item.href).split("?")[0] === pathname &&
                    (!String(item.href).includes("bolum=") ||
                      section === "danisanlar");
                  return (
                    <Link
                      className={`flex min-h-10 items-center gap-3 rounded-full px-3 text-sm font-semibold transition ${active ? "bg-[#d2fc5c] text-black" : "text-slate-500 hover:bg-white/35 hover:text-black"}`}
                      href={item.href as Route}
                      key={item.href}
                    >
                      <span className="grid size-7 place-items-center rounded-full border border-black/10">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[#eae8e1]">
        <header className="flex h-16 shrink-0 items-center justify-end gap-2 px-6">
          <CircleLink href={"/yonetim/danisanlar" as Route} label="Ara">
            ⌕
          </CircleLink>
          <CircleLink href={"/yonetim/randevular" as Route} label="Randevular">
            ◷
          </CircleLink>
          <CircleLink
            href={"/yonetim/danisan-olustur" as Route}
            label="Yeni danışan"
          >
            ＋
          </CircleLink>
          <CircleLink href={"/yonetim/baslangic" as Route} label="Genel bakış">
            ♧
          </CircleLink>
          <CircleLink href={"/yonetim/hub" as Route} label="Talep kuyruğu">
            ▽
          </CircleLink>
          <CircleLink
            href={"/yonetim?alan=hizmet-terapist-ayarlari" as Route}
            label="Ayarlar"
          >
            ⚙
          </CircleLink>
          <CircleLink href={"/" as Route} label="Siteyi aç">
            ?
          </CircleLink>
          <CircleLink
            href={"/yonetim?alan=public-iletisim-ayarlari" as Route}
            label="İletişim"
          >
            ◉
          </CircleLink>
          <CircleLink href={"/yonetim/baslangic" as Route} label="Profil">
            BA
          </CircleLink>
        </header>

        <div className="flex min-h-0 flex-1 gap-2 pr-6 pb-6">
          <section className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-[2.5rem] border border-black/10 bg-[#fcfbfa] shadow-sm">
            <header className="flex items-center justify-between p-6 pb-3">
              <div>
                <h2 className="text-2xl font-bold">
                  {section === "danisanlar" ? "Danışanlar" : "Talep Kuyruğu"}
                </h2>
                <small className="text-slate-400">{records.length} kayıt</small>
              </div>
              <div className="flex gap-1.5">
                <button
                  className="grid size-8 place-items-center rounded-full border border-black/10"
                  onClick={() => router.refresh()}
                >
                  ↻
                </button>
                <CircleLink
                  href={"/yonetim/danisan-olustur" as Route}
                  label="Yeni"
                >
                  ＋
                </CircleLink>
              </div>
            </header>
            <div className="px-5 pb-3">{toolbar}</div>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
              {buckets.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">
                  Kayıt bulunmuyor.
                </p>
              ) : (
                buckets.map((bucket) => (
                  <div key={bucket.group}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-px flex-1 bg-black/5" />
                      <small className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        {hubGroupLabels[bucket.group]}
                      </small>
                      <span className="h-px flex-1 bg-black/5" />
                    </div>
                    {bucket.items.map((record) => (
                      <button
                        className={`mb-3 w-full rounded-[2rem] border p-4 text-left transition ${selected?.id === record.id ? "border-black/[.04] bg-[#eafda8]" : "border-black/10 bg-white hover:bg-slate-50"}`}
                        key={record.id}
                        onClick={() => select(record.id)}
                      >
                        <div className="flex items-center gap-3">
                          <HubAvatar name={record.name} size={40} />
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-xs">
                              {record.name}
                            </strong>
                            <small className="block truncate text-[10px] text-slate-400">
                              {record.lastAction}
                            </small>
                          </span>
                          <span className="grid size-7 place-items-center rounded-full border border-black/10 text-[10px] font-extrabold">
                            {record.score}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <Status record={record} />
                          <small className="text-[9px] text-slate-400">
                            {record.lastActionAt}
                          </small>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[2.5rem] border border-black/10 bg-gradient-to-br from-[#f1ffb1] via-[#fbfcf4] to-white shadow-sm">
            <div className="flex min-h-16 items-center gap-5 border-b border-black/5 px-6 text-xs font-semibold">
              <Link
                href={(selected?.profileHref as Route) ?? "/yonetim/danisanlar"}
              >
                Kaydet
              </Link>
              <Link href={"/yonetim/danisan-olustur" as Route}>＋ Yeni</Link>
              {actions.map((action) => (
                <button
                  disabled={pending !== null}
                  key={action.id}
                  onClick={() => void run(action)}
                >
                  {pending === action.id ? "İşleniyor…" : action.label}
                </button>
              ))}
              <button onClick={() => router.refresh()}>↻ Yenile</button>
              <button onClick={() => window.print()}>▤ PDF</button>
              <button
                onClick={() =>
                  document
                    .getElementById("quality-card")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                ♙ Kalite
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("process-card")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                ⌁ Süreç
              </button>
              <button className="ml-auto text-lg" onClick={() => select(null)}>
                •••
              </button>
            </div>
            {!selected ? (
              <div className="grid flex-1 place-items-center text-slate-400">
                Listeden bir kayıt seçin.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5">
                <header className="mb-4 flex items-center justify-between rounded-3xl border border-black/5 bg-white/70 p-5">
                  <div className="flex items-center gap-4">
                    <HubAvatar name={selected.name} size={52} />
                    <div>
                      <h2 className="text-xl font-extrabold">
                        {selected.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selected.service}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Status record={selected} />
                        <span className="rounded-full bg-black px-2 py-1 text-[9px] font-bold text-white">
                          {selected.channel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-8 text-xs">
                    <div>
                      <dt className="text-[9px] font-bold uppercase text-slate-400">
                        Yaklaşan
                      </dt>
                      <dd className="font-bold">{selected.plannedAt}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-bold uppercase text-slate-400">
                        Durum
                      </dt>
                      <dd className="font-bold">
                        {hubStatusLabels[selected.status]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-bold uppercase text-slate-400">
                        Kayıt
                      </dt>
                      <dd className="font-bold">{selected.reference || "—"}</dd>
                    </div>
                  </dl>
                </header>
                <nav className="mb-5 flex gap-8 border-b border-black/5 px-2 pb-2 text-xs font-bold">
                  <span className="rounded-full bg-black px-4 py-2 text-white">
                    Özet
                  </span>
                  <span className="py-2 text-slate-400">Randevular</span>
                  <span className="py-2 text-slate-400">Finans</span>
                  <span className="py-2 text-slate-400">İşlem geçmişi</span>
                </nav>
                <div className="grid grid-cols-3 gap-5">
                  <div className="space-y-5">
                    <article className="rounded-3xl border border-black/10 bg-white p-5">
                      <h3 className="mb-4 border-b border-black/5 pb-2 text-sm font-bold">
                        İletişim
                      </h3>
                      <dl className="space-y-3 text-xs">
                        <div className="grid grid-cols-3">
                          <dt className="text-slate-400">Telefon</dt>
                          <dd className="col-span-2 font-semibold">
                            {selected.contactPhone}
                          </dd>
                        </div>
                        <div className="grid grid-cols-3">
                          <dt className="text-slate-400">E-posta</dt>
                          <dd className="col-span-2 break-all font-semibold text-sky-600">
                            {selected.contactEmail}
                          </dd>
                        </div>
                        <div className="grid grid-cols-3">
                          <dt className="text-slate-400">Tip</dt>
                          <dd className="col-span-2 font-semibold">
                            {selected.channel}
                          </dd>
                        </div>
                      </dl>
                    </article>
                    <article className="rounded-3xl border border-black/10 bg-white p-5">
                      <h3 className="mb-3 text-sm font-bold">
                        Veli / Bağlantılar
                      </h3>
                      {selected.connections.length ? (
                        selected.connections.map((item) => (
                          <div
                            className="flex items-center gap-3 border-t border-black/5 py-3"
                            key={item.name}
                          >
                            <HubAvatar name={item.name} size={34} />
                            <div>
                              <strong className="block text-xs">
                                {item.name}
                              </strong>
                              <small className="text-slate-400">
                                {item.relation}
                              </small>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">
                          Bağlantılı kayıt yok.
                        </p>
                      )}
                    </article>
                  </div>
                  <div className="space-y-5">
                    <article
                      className="rounded-3xl border border-black/10 bg-white p-5"
                      id="process-card"
                    >
                      <h3 className="mb-3 text-sm font-bold">
                        Sıradaki adımlar
                      </h3>
                      <ol className="space-y-3">
                        {selected.nextSteps.map((step, index) => (
                          <li
                            className={
                              index === 0
                                ? "rounded-2xl bg-[#eafda8] p-3"
                                : "rounded-2xl border border-black/5 bg-slate-50 p-3"
                            }
                            key={step.title}
                          >
                            <strong className="text-xs">
                              {index + 1}. {step.title}
                            </strong>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {step.detail}
                            </p>
                            <small className="text-[9px] font-bold text-emerald-600">
                              {step.due}
                            </small>
                          </li>
                        ))}
                      </ol>
                    </article>
                    <article className="rounded-3xl border border-black/10 bg-white p-5">
                      <h3 className="mb-3 text-sm font-bold">
                        Zaman çizelgesi
                      </h3>
                      {selected.timeline.map((item) => (
                        <div
                          className="grid grid-cols-3 border-l border-emerald-200 py-2 pl-3 text-[11px]"
                          key={`${item.at}-${item.label}`}
                        >
                          <time className="font-bold text-emerald-600">
                            {item.at}
                          </time>
                          <span className="col-span-2 text-slate-500">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </article>
                  </div>
                  <div className="space-y-5">
                    <article
                      className="rounded-3xl border border-black/10 bg-white p-5"
                      id="quality-card"
                    >
                      <h3 className="mb-4 border-b border-black/5 pb-2 text-sm font-bold">
                        Kayıt kalitesi
                      </h3>
                      <div className="mb-4 flex items-center gap-5">
                        <div className="grid size-24 place-items-center rounded-full border-[7px] border-emerald-500 text-3xl font-extrabold">
                          {selected.score}
                        </div>
                        <div>
                          <strong className="text-xs">
                            {selected.grade} · Takip durumu
                          </strong>
                          <p className="mt-1 text-[10px] text-slate-400">
                            İletişim, kayıt ve operasyon verilerine göre.
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {selected.readinessNotes.map((note) => (
                          <li
                            className="rounded-xl border border-emerald-100 bg-emerald-50 p-2 text-[11px]"
                            key={note}
                          >
                            ✓ {note}
                          </li>
                        ))}
                      </ul>
                    </article>
                    <article className="rounded-3xl border border-black/10 bg-white p-5">
                      <h3 className="mb-3 text-sm font-bold">Finans ve plan</h3>
                      <p className="text-xs text-slate-500">
                        Yetkili finans özeti danışan profili üzerinden açılır.
                      </p>
                      {selected.profileHref ? (
                        <Link
                          className="mt-3 inline-flex rounded-xl bg-black px-4 py-2 text-[10px] font-bold text-white"
                          href={selected.profileHref as Route}
                        >
                          Danışan profilini aç
                        </Link>
                      ) : null}
                    </article>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
