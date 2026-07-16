"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { HubAvatar } from "./hub-avatar";
import styles from "./hub.module.css";
import {
  getStageIndex,
  groupRecords,
  hubGroupLabels,
  hubNavGroups,
  hubStages,
  hubStatusLabels,
  type HubRecord,
} from "./hub-model";

const ribbonActions = ["Kaydet", "+ Yeni", "Yenile", "PDF", "Süreç"] as const;

function StatusChip({ status }: { status: HubRecord["status"] }) {
  return (
    <span className={styles.statusChip} data-status={status}>
      {hubStatusLabels[status]}
    </span>
  );
}

function ScoreRing({ grade, score }: { grade: string; score: number }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={styles.scoreRing}>
      <svg viewBox="0 0 140 140" role="img" aria-label={`Hazırlık skoru ${score}`}>
        <circle className={styles.scoreTrack} cx="70" cy="70" r={radius} />
        <circle
          className={styles.scoreValueArc}
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
        />
      </svg>
      <div className={styles.scoreCenter}>
        <strong>{score}</strong>
        <small>{grade} · Hazırlık</small>
      </div>
    </div>
  );
}

export function DashboardHub({
  listCaption,
  records,
}: {
  listCaption: string;
  records: readonly HubRecord[];
}) {
  const [openGroup, setOpenGroup] = useState<string>("randevular");
  const [activeChild, setActiveChild] = useState<string | null>("talepler");
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const record = useMemo(
    () => records.find((candidate) => candidate.id === activeRecordId) ?? null,
    [activeRecordId, records],
  );
  const buckets = useMemo(() => groupRecords(records), [records]);
  const openCount = useMemo(
    () =>
      records.filter((candidate) => candidate.status === "yeni" || candidate.status === "bekliyor")
        .length,
    [records],
  );
  const navGroups = useMemo(
    () =>
      hubNavGroups.map((group) => ({
        ...group,
        children: group.children.map((child) =>
          child.id === "talepler" || child.id === "kuyruk"
            ? { ...child, badge: openCount || undefined }
            : child,
        ),
      })),
    [openCount],
  );
  const listOpen = activeChild !== null;
  const stageIndex = record ? getStageIndex(record.stage) : -1;

  return (
    <div className={styles.hub} data-focus={focusMode ? "true" : undefined}>
      <aside
        className={styles.rail}
        data-collapsed={focusMode ? "true" : undefined}
        aria-label="Yönetim menüsü"
      >
        <Link className={styles.railBrand} href="/yonetim">
          <Image src="/logo-mark.png" alt="" width={38} height={38} />
          <span>
            <strong>Berfin Akbaş</strong>
            <small>Yönetim Hub</small>
          </span>
        </Link>

        <nav className={styles.railNav}>
          {navGroups.map((group) => {
            const isOpen = openGroup === group.id;
            return (
              <div
                className={styles.railGroup}
                data-open={isOpen ? "true" : undefined}
                key={group.id}
              >
                <button
                  aria-expanded={isOpen}
                  className={styles.railGroupHead}
                  onClick={() => setOpenGroup(isOpen ? "" : group.id)}
                  type="button"
                >
                  <span aria-hidden="true" className={styles.railIcon}>
                    {group.icon}
                  </span>
                  <span className={styles.railLabel}>{group.label}</span>
                  <span aria-hidden="true" className={styles.railChevron}>
                    ›
                  </span>
                </button>
                {isOpen ? (
                  <div className={styles.railChildren}>
                    {group.children.map((child) => (
                      <button
                        className={styles.railChild}
                        data-active={activeChild === child.id ? "true" : undefined}
                        key={child.id}
                        onClick={() => {
                          setActiveChild(child.id);
                          setActiveRecordId(null);
                          setFocusMode(false);
                        }}
                        type="button"
                      >
                        <span>{child.label}</span>
                        {child.badge ? <em>{child.badge}</em> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <Link className={styles.railFoot} href="/yonetim">
          ‹ Klasik panele dön
        </Link>
      </aside>

      {listOpen ? (
        <section
          className={styles.listPanel}
          data-collapsed={focusMode ? "true" : undefined}
          aria-label="Kayıt listesi"
        >
          <header className={styles.listHead}>
            <button
              aria-label="Listeyi kapat"
              className={styles.backButton}
              onClick={() => {
                setActiveChild(null);
                setActiveRecordId(null);
              }}
              type="button"
            >
              ‹
            </button>
            <div>
              <strong>Talep kuyruğu</strong>
              <small>
                {records.length} kayıt · {listCaption}
              </small>
            </div>
          </header>

          <div className={styles.listScroll}>
            {buckets.length === 0 ? (
              <p className={styles.listEmpty}>Henüz kayıt yok. Yeni talepler burada listelenir.</p>
            ) : null}
            {buckets.map((bucket) => (
              <div key={bucket.group}>
                <p className={styles.listGroupLabel}>{hubGroupLabels[bucket.group]}</p>
                {bucket.items.map((item) => (
                  <button
                    className={styles.listItem}
                    data-active={activeRecordId === item.id ? "true" : undefined}
                    key={item.id}
                    onClick={() => setActiveRecordId(item.id)}
                    type="button"
                  >
                    <HubAvatar name={item.name} />
                    <span className={styles.listItemBody}>
                      <strong>{item.name}</strong>
                      <small>{item.lastAction}</small>
                      <span className={styles.listItemMeta}>
                        <StatusChip status={item.status} />
                        <time>{item.lastActionAt}</time>
                      </span>
                    </span>
                    <em className={styles.listScore}>{item.readinessScore}</em>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.workArea} aria-label="Çalışma alanı">
        {record ? (
          <>
            <div className={styles.ribbon}>
              <div className={styles.ribbonActions}>
                {ribbonActions.map((action) => (
                  <button className={styles.pill} key={action} type="button">
                    {action}
                  </button>
                ))}
              </div>
              <button
                className={styles.pill}
                data-active={focusMode ? "true" : undefined}
                onClick={() => setFocusMode((value) => !value)}
                type="button"
              >
                {focusMode ? "Panelleri geri aç" : "Genişlet ⤢"}
              </button>
            </div>

            <header className={styles.recordHead}>
              <div className={styles.recordIdentity}>
                <HubAvatar name={record.name} size={56} />
                <div>
                  <h2>{record.name}</h2>
                  <p>{record.service}</p>
                  <div className={styles.recordChips}>
                    <StatusChip status={record.status} />
                    <span className={styles.softChip}>{record.channel}</span>
                    <span className={styles.softChip}>{record.reference}</span>
                  </div>
                </div>
              </div>

              <ol className={styles.stageStrip} aria-label="Randevu aşaması">
                {hubStages.map((stage, index) => (
                  <li
                    data-state={
                      index < stageIndex ? "done" : index === stageIndex ? "active" : "upcoming"
                    }
                    key={stage.id}
                  >
                    {stage.label}
                  </li>
                ))}
              </ol>
            </header>

            <div className={styles.workGrid}>
              <section className={styles.workColumn}>
                <article className={styles.card}>
                  <h3>İletişim</h3>
                  <dl className={styles.contactList}>
                    <div>
                      <dt>Telefon</dt>
                      <dd>{record.contactPhone}</dd>
                    </div>
                    <div>
                      <dt>E-posta</dt>
                      <dd>{record.contactEmail}</dd>
                    </div>
                    <div>
                      <dt>Kanal</dt>
                      <dd>{record.channel}</dd>
                    </div>
                    <div>
                      <dt>Planlanan saat</dt>
                      <dd>{record.plannedAt}</dd>
                    </div>
                  </dl>
                </article>

                <article className={styles.card}>
                  <h3>Zaman çizelgesi</h3>
                  <ol className={styles.timeline}>
                    {record.timeline.map((entry) => (
                      <li key={`${entry.at}-${entry.label}`}>
                        <time>{entry.at}</time>
                        <span>{entry.label}</span>
                      </li>
                    ))}
                  </ol>
                </article>
              </section>

              <section className={styles.workColumn}>
                <article className={`${styles.card} ${styles.nextStepsCard}`}>
                  <h3>Sıradaki adımlar</h3>
                  <ol className={styles.nextSteps}>
                    {record.nextSteps.map((step, index) => (
                      <li data-state={step.state} key={step.title}>
                        <span className={styles.stepIndex}>{index + 1}</span>
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

              <section className={styles.workColumn}>
                <article className={styles.card}>
                  <h3>Hazırlık skoru</h3>
                  <ScoreRing grade={record.readinessGrade} score={record.readinessScore} />
                  <ul className={styles.readinessNotes}>
                    {record.readinessNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </article>

                <article className={styles.card}>
                  <h3>Bağlantılı kayıtlar</h3>
                  <ul className={styles.connections}>
                    {record.connections.map((connection) => (
                      <li key={connection.name}>
                        <HubAvatar name={connection.name} size={34} />
                        <div>
                          <strong>{connection.name}</strong>
                          <small>{connection.relation}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              </section>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyBadge} aria-hidden="true">
              ⌘
            </div>
            <h2>Çalışma alanı hazır</h2>
            <p>
              {listOpen
                ? "Soldaki listeden bir kayıt seçin; kayıt özeti ve sıradaki adımlar burada açılır."
                : "Menüden bir bölüm seçin; kayıtlar kademeli olarak sağa doğru açılır."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
