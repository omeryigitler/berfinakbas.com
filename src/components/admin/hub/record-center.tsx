"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { buildHubStatusUrl, getHubActions, type HubAction } from "./hub-actions";
import { HubAvatar } from "./hub-avatar";
import type { HubAvailabilityDay, HubFinanceSummary } from "./hub-data";
import hubStyles from "./hub.module.css";
import {
  getAdjacentRecordId,
  getStageIndex,
  groupRecords,
  hubGroupLabels,
  hubStages,
  hubStatusLabels,
  type HubGrade,
  type HubRecord,
} from "./hub-model";
import styles from "./record-center.module.css";

type RecordCenterSection = "danisanlar" | "musaitlik" | "odemeler" | "talepler";
type ListSection = "danisanlar" | "talepler";
type SectionOrNull = RecordCenterSection | null;

const gradeLabels: Readonly<Record<HubGrade, string>> = {
  A: "Hazır",
  B: "Eksik var",
  C: "Tamamlanmalı",
};

const listMeta: Readonly<Record<ListSection, { empty: string; title: string }>> = {
  danisanlar: {
    empty: "Henüz danışan kaydı yok.",
    title: "Danışan kayıtları",
  },
  talepler: {
    empty: "Henüz randevu talebi yok.",
    title: "Talep kuyruğu",
  },
};

function StatusChip({ status }: { status: HubRecord["status"] }) {
  return (
    <span className={hubStyles.statusChip} data-status={status}>
      {hubStatusLabels[status]}
    </span>
  );
}

export function RecordCenter({
  appointments,
  availability = null,
  canManage = false,
  canReadClients = false,
  clients = [],
  finance = null,
  toolbar = null,
}: {
  appointments: readonly HubRecord[];
  availability?: readonly HubAvailabilityDay[] | null;
  canManage?: boolean;
  canReadClients?: boolean;
  clients?: readonly HubRecord[];
  finance?: HubFinanceSummary | null;
  toolbar?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const [armedActionId, setArmedActionId] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  /* The talep queue is the default surface so the Hub never opens empty; other
     sections load from the URL (?bolum=…) and survive refresh / back-forward. */
  const sectionParam = searchParams.get("bolum");
  let section: RecordCenterSection = "talepler";
  if (sectionParam === "danisanlar" && canReadClients) section = "danisanlar";
  else if (sectionParam === "musaitlik" && availability) section = "musaitlik";
  else if (sectionParam === "odemeler" && finance) section = "odemeler";

  const isListSection = section === "talepler" || section === "danisanlar";
  const activeRecordId = searchParams.get("kayit");
  const records = useMemo(
    () => (section === "danisanlar" ? clients : section === "talepler" ? appointments : []),
    [appointments, clients, section],
  );
  const record = useMemo(
    () => records.find((candidate) => candidate.id === activeRecordId) ?? null,
    [activeRecordId, records],
  );
  const buckets = useMemo(() => groupRecords(records), [records]);
  const stageIndex = record ? getStageIndex(record.stage) : -1;
  const actions = useMemo(
    () =>
      record && record.kind === "randevu" && record.rawStatus
        ? getHubActions(record.rawStatus, canManage)
        : [],
    [canManage, record],
  );
  const openAppointmentCount = useMemo(
    () =>
      appointments.filter(
        (candidate) => candidate.status === "yeni" || candidate.status === "bekliyor",
      ).length,
    [appointments],
  );

  const sectionOptions = useMemo(
    () => [
      { count: openAppointmentCount, id: "talepler" as const, label: "Talepler" },
      ...(canReadClients
        ? [{ count: clients.length, id: "danisanlar" as const, label: "Danışanlar" }]
        : []),
      ...(availability ? [{ count: null, id: "musaitlik" as const, label: "Müsaitlik" }] : []),
      ...(finance ? [{ count: null, id: "odemeler" as const, label: "Ödemeler" }] : []),
    ],
    [availability, canReadClients, clients.length, finance, openAppointmentCount],
  );

  const navigate = useCallback(
    (nextSection: SectionOrNull, recordId: string | null) => {
      const params = new URLSearchParams(searchKey);
      if (nextSection) {
        if (nextSection === "talepler") params.delete("bolum");
        else params.set("bolum", nextSection);
      } else {
        params.delete("bolum");
      }
      if (recordId) params.set("kayit", recordId);
      else params.delete("kayit");
      const query = params.toString();
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    },
    [pathname, router, searchKey],
  );

  const [lastRecordId, setLastRecordId] = useState(activeRecordId);
  if (lastRecordId !== activeRecordId) {
    setLastRecordId(activeRecordId);
    setArmedActionId(null);
    setActionError(null);
    setActionNotice(null);
  }

  /* Open the first record on first mount so a list section never shows an empty
     work area — mirrors the reference's always-selected layout. Runs once, so
     Esc can still clear the selection afterwards. */
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (autoSelectedRef.current) return;
    autoSelectedRef.current = true;
    if (isListSection && !activeRecordId) {
      const first = getAdjacentRecordId(records, null, 1);
      if (first) navigate(section, first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = useCallback(
    async (action: HubAction) => {
      if (!record) return;
      setPendingActionId(action.id);
      setActionError(null);
      setActionNotice(null);
      try {
        const response = await fetch(buildHubStatusUrl(record.id), {
          body: JSON.stringify({ reasonCode: action.reasonCode, toStatus: action.toStatus }),
          headers: { accept: "application/json", "content-type": "application/json" },
          method: "PATCH",
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Randevu durumu güncellenemedi.");
        setActionNotice(`${action.label} işlemi kaydedildi.`);
        setArmedActionId(null);
        router.refresh();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Randevu durumu güncellenemedi.");
      } finally {
        setPendingActionId(null);
      }
    },
    [record, router],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "ArrowDown" || event.key === "j") {
        const next = getAdjacentRecordId(records, activeRecordId, 1);
        if (next) {
          event.preventDefault();
          navigate(section, next);
        }
      } else if (event.key === "ArrowUp" || event.key === "k") {
        const previous = getAdjacentRecordId(records, activeRecordId, -1);
        if (previous) {
          event.preventDefault();
          navigate(section, previous);
        }
      } else if (event.key === "Escape") {
        if (armedActionId) setArmedActionId(null);
        else if (activeRecordId) navigate(section, null);
      } else if (event.key === "1") navigate("talepler", null);
      else if (event.key === "2" && canReadClients) navigate("danisanlar", null);
      else if (event.key === "3" && availability) navigate("musaitlik", null);
      else if (event.key === "4" && finance) navigate("odemeler", null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeRecordId,
    armedActionId,
    availability,
    canReadClients,
    finance,
    navigate,
    records,
    section,
  ]);

  const meta = isListSection ? listMeta[section as ListSection] : null;

  return (
    <div className={styles.center}>
      <div className={styles.tabRow}>
        <nav className={styles.sectionTabs} aria-label="Kayıt merkezi bölümleri">
          {sectionOptions.map((option) => (
            <button
              className={styles.sectionTab}
              data-active={section === option.id ? "true" : undefined}
              key={option.id}
              onClick={() => navigate(option.id, null)}
              type="button"
            >
              <span>{option.label}</span>
              {option.count !== null ? <em>{option.count}</em> : null}
            </button>
          ))}
        </nav>
        {toolbar && isListSection ? <div className={styles.toolbar}>{toolbar}</div> : null}
      </div>

      <div className={styles.body} data-list={isListSection ? "true" : "false"}>
        {isListSection && meta ? (
          <section className={`${hubStyles.listPanel} ${styles.list}`} aria-label="Kayıt listesi">
            <header className={hubStyles.listHead}>
              <div>
                <strong>{meta.title}</strong>
                <small>{records.length} kayıt · son 30 kayıt</small>
              </div>
            </header>
            <div className={hubStyles.listScroll}>
              {buckets.length === 0 ? <p className={hubStyles.listEmpty}>{meta.empty}</p> : null}
              {buckets.map((bucket) => (
                <div key={bucket.group}>
                  <p className={hubStyles.listGroupLabel}>{hubGroupLabels[bucket.group]}</p>
                  {bucket.items.map((item) => (
                    <button
                      className={hubStyles.listItem}
                      data-active={activeRecordId === item.id ? "true" : undefined}
                      key={item.id}
                      onClick={() => navigate(section, item.id)}
                      type="button"
                    >
                      <HubAvatar name={item.name} />
                      <span className={hubStyles.listItemBody}>
                        <strong>{item.name}</strong>
                        <small>{item.lastAction}</small>
                        <span className={hubStyles.listItemMeta}>
                          <StatusChip status={item.status} />
                          <time>{item.lastActionAt}</time>
                        </span>
                      </span>
                      <span
                        className={hubStyles.scoreDot}
                        data-grade={item.grade}
                        title={`Hazırlık ${item.score}/100 · ${item.grade}`}
                      >
                        {item.score}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {isListSection ||
        (section === "musaitlik" && availability) ||
        (section === "odemeler" && finance) ? (
          <section className={`${hubStyles.workArea} ${styles.work}`} aria-label="Çalışma alanı">
            {section === "musaitlik" && availability ? (
              <>
                <div className={hubStyles.ribbon}>
                  <div className={hubStyles.ribbonActions}>
                    <Link
                      className={hubStyles.pill}
                      data-tone="primary"
                      href={"/yonetim/musaitlik" as Route}
                    >
                      Müsaitliği düzenle
                    </Link>
                    <button
                      className={hubStyles.pill}
                      onClick={() => router.refresh()}
                      type="button"
                    >
                      Yenile
                    </button>
                  </div>
                </div>
                <div className={hubStyles.panelBody}>
                  <h2 className={hubStyles.panelTitle}>Haftalık müsaitlik</h2>
                  <p className={hubStyles.panelNote}>
                    Haftalık kuralların salt okunur özeti. Düzenleme aynı Hub kabuğundaki müsaitlik
                    bölümünde yapılır.
                  </p>
                  <ul className={hubStyles.availList}>
                    {availability.map((day) => (
                      <li key={day.label}>
                        <strong>{day.label}</strong>
                        <span className={hubStyles.availSlots}>
                          {day.slots.length === 0 ? (
                            <em className={hubStyles.availClosed}>Kapalı</em>
                          ) : (
                            day.slots.map((slot) => (
                              <em
                                className={hubStyles.availSlot}
                                data-inactive={slot.active ? undefined : "true"}
                                key={`${day.label}-${slot.range}`}
                              >
                                {slot.range} · {slot.increment} dk
                              </em>
                            ))
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : section === "odemeler" && finance ? (
              <>
                <div className={hubStyles.ribbon}>
                  <div className={hubStyles.ribbonActions}>
                    <Link
                      className={hubStyles.pill}
                      data-tone="primary"
                      href={"/yonetim/odemeler" as Route}
                    >
                      Ödeme yönetimi
                    </Link>
                    <button
                      className={hubStyles.pill}
                      onClick={() => router.refresh()}
                      type="button"
                    >
                      Yenile
                    </button>
                  </div>
                </div>
                <div className={hubStyles.panelBody}>
                  <h2 className={hubStyles.panelTitle}>Ödeme özeti</h2>
                  <p className={hubStyles.panelNote}>
                    Gerçek hareketlerin salt okunur özeti. Kayıt işlemleri aynı Hub kabuğundaki
                    ödeme yönetiminde yapılır.
                  </p>
                  <div className={hubStyles.statRow}>
                    <article className={hubStyles.card}>
                      <h3>Bu ay ödeme</h3>
                      <strong className={hubStyles.statValue}>{finance.monthPaymentLabel}</strong>
                    </article>
                    <article className={hubStyles.card}>
                      <h3>Bu ay plan borcu</h3>
                      <strong className={hubStyles.statValue}>{finance.monthAccrualLabel}</strong>
                    </article>
                  </div>
                  <article className={hubStyles.card}>
                    <h3>Son kayıtlar</h3>
                    {finance.entries.length === 0 ? (
                      <p className={hubStyles.panelNote}>Bu ay finans kaydı bulunmuyor.</p>
                    ) : (
                      <ul className={hubStyles.financeList}>
                        {finance.entries.map((entry) => (
                          <li key={entry.id}>
                            <HubAvatar name={entry.clientName} size={32} />
                            <span className={hubStyles.financeBody}>
                              <strong>{entry.clientName}</strong>
                              <small>
                                {entry.typeLabel} · {entry.at}
                              </small>
                            </span>
                            <em>{entry.amountLabel}</em>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </div>
              </>
            ) : record ? (
              <>
                <div className={hubStyles.ribbon}>
                  <div className={hubStyles.ribbonActions}>
                    {actions.map((action) =>
                      armedActionId === action.id ? (
                        <span className={hubStyles.confirmGroup} key={action.id}>
                          <button
                            className={hubStyles.pill}
                            data-tone={action.tone}
                            disabled={pendingActionId !== null}
                            onClick={() => void runAction(action)}
                            type="button"
                          >
                            {pendingActionId === action.id
                              ? "İşleniyor…"
                              : `Eminim: ${action.label}`}
                          </button>
                          <button
                            className={hubStyles.pill}
                            disabled={pendingActionId !== null}
                            onClick={() => setArmedActionId(null)}
                            type="button"
                          >
                            Vazgeç
                          </button>
                        </span>
                      ) : (
                        <button
                          className={hubStyles.pill}
                          data-tone={action.tone}
                          disabled={pendingActionId !== null}
                          key={action.id}
                          onClick={() => {
                            setArmedActionId(action.id);
                            setActionError(null);
                            setActionNotice(null);
                          }}
                          type="button"
                        >
                          {action.label}
                        </button>
                      ),
                    )}
                    {record.profileHref ? (
                      <Link
                        className={hubStyles.pill}
                        data-tone="primary"
                        href={record.profileHref as Route}
                      >
                        Profili aç
                      </Link>
                    ) : null}
                    <button
                      className={hubStyles.pill}
                      disabled={pendingActionId !== null}
                      onClick={() => router.refresh()}
                      type="button"
                    >
                      Yenile
                    </button>
                  </div>
                </div>

                {actionError ? (
                  <p className={hubStyles.ribbonNote} data-kind="error" role="alert">
                    {actionError}
                  </p>
                ) : null}
                {actionNotice ? (
                  <p className={hubStyles.ribbonNote} data-kind="notice" role="status">
                    {actionNotice}
                  </p>
                ) : null}

                <div className={hubStyles.recordView} key={record.id}>
                  <header className={hubStyles.recordHead}>
                    <div className={hubStyles.recordIdentity}>
                      <HubAvatar name={record.name} size={56} />
                      <div>
                        <h2>{record.name}</h2>
                        <p>{record.service}</p>
                        <div className={hubStyles.recordChips}>
                          <StatusChip status={record.status} />
                          <span className={hubStyles.softChip}>{record.channel}</span>
                          {record.reference ? (
                            <span className={hubStyles.softChip}>{record.reference}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {record.kind === "randevu" ? (
                      <ol className={hubStyles.stageStrip} aria-label="Randevu aşaması">
                        {hubStages.map((stage, index) => (
                          <li
                            data-state={
                              index < stageIndex
                                ? "done"
                                : index === stageIndex
                                  ? "active"
                                  : "upcoming"
                            }
                            key={stage.id}
                          >
                            {stage.label}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </header>

                  <div className={hubStyles.workGrid}>
                    <section className={hubStyles.workColumn}>
                      <article className={hubStyles.card}>
                        <h3>İletişim</h3>
                        <dl className={hubStyles.contactList}>
                          <div>
                            <dt>Telefon</dt>
                            <dd>{record.contactPhone}</dd>
                          </div>
                          <div>
                            <dt>E-posta</dt>
                            <dd>{record.contactEmail}</dd>
                          </div>
                          <div>
                            <dt>{record.kind === "randevu" ? "Kanal" : "Danışan tipi"}</dt>
                            <dd>{record.channel}</dd>
                          </div>
                          <div>
                            <dt>Planlanan saat</dt>
                            <dd>{record.plannedAt}</dd>
                          </div>
                        </dl>
                      </article>
                      <article className={hubStyles.card}>
                        <h3>Zaman çizelgesi</h3>
                        <ol className={hubStyles.timeline}>
                          {record.timeline.map((entry) => (
                            <li key={`${entry.at}-${entry.label}`}>
                              <time>{entry.at}</time>
                              <span>{entry.label}</span>
                            </li>
                          ))}
                        </ol>
                      </article>
                    </section>

                    <section className={hubStyles.workColumn}>
                      <article className={`${hubStyles.card} ${hubStyles.nextStepsCard}`}>
                        <h3>Sıradaki adımlar</h3>
                        <ol className={hubStyles.nextSteps}>
                          {record.nextSteps.map((step, index) => (
                            <li data-state={step.state} key={step.title}>
                              <span className={hubStyles.stepIndex}>{index + 1}</span>
                              <div>
                                <strong>{step.title}</strong>
                                <p>{step.detail}</p>
                                <small>{step.due}</small>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </article>
                    </section>

                    <section className={hubStyles.workColumn}>
                      <article className={hubStyles.card}>
                        <div className={hubStyles.scoreHead}>
                          <div
                            className={hubStyles.scoreDial}
                            data-grade={record.grade}
                            style={{ "--score": record.score } as CSSProperties}
                          >
                            <span>{record.score}</span>
                          </div>
                          <div>
                            <h3>Hazırlık skoru</h3>
                            <p className={hubStyles.scoreGrade} data-grade={record.grade}>
                              {record.grade} · {gradeLabels[record.grade]}
                            </p>
                          </div>
                        </div>
                        <ul className={styles.checkList}>
                          {record.readinessNotes.map((note) => (
                            <li key={note} data-ok={note.endsWith("eksik") ? undefined : "true"}>
                              {note}
                            </li>
                          ))}
                        </ul>
                      </article>
                      {record.connections.length > 0 ? (
                        <article className={hubStyles.card}>
                          <h3>Bağlantılı kayıtlar</h3>
                          <ul className={hubStyles.connections}>
                            {record.connections.map((connection) => (
                              <li key={`${connection.name}-${connection.relation}`}>
                                <HubAvatar name={connection.name} size={34} />
                                <div>
                                  <strong>{connection.name}</strong>
                                  <small>{connection.relation}</small>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </article>
                      ) : null}
                    </section>
                  </div>
                </div>
              </>
            ) : (
              <div className={hubStyles.emptyState}>
                <div className={hubStyles.emptyBadge} aria-hidden="true">
                  ⌘
                </div>
                <h2>Çalışma alanı hazır</h2>
                <p>Listeden bir kayıt seçin; özet, işlemler ve sıradaki adımlar burada açılır.</p>
                <p className={hubStyles.kbdHint}>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> gezin · <kbd>Esc</kbd> kapat
                </p>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
