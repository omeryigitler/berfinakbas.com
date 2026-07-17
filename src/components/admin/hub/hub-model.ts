export type HubStage = "talep" | "kontrol" | "onay" | "gorusme";

export type HubRawStatus =
  | "CANCELLED_BY_CLIENT"
  | "CANCELLED_BY_PRACTITIONER"
  | "COMPLETED"
  | "CONFIRMED"
  | "NO_SHOW"
  | "PENDING_REVIEW"
  | "REJECTED"
  | "REQUESTED"
  | "RESCHEDULE_PROPOSED";

export type HubStatus =
  | "aktif"
  | "bekliyor"
  | "gelmedi"
  | "iptal"
  | "onaylandi"
  | "pasif"
  | "potansiyel"
  | "reddedildi"
  | "tamamlandi"
  | "yeni";

export type HubTaskState = "done" | "active" | "upcoming";
export type HubRecordKind = "danisan" | "randevu";

export type HubRecord = Readonly<{
  channel: string;
  connections: readonly { name: string; relation: string }[];
  contactEmail: string;
  contactPhone: string;
  group: "bugun" | "buHafta" | "dahaEski";
  id: string;
  kind: HubRecordKind;
  lastAction: string;
  lastActionAt: string;
  name: string;
  plannedAt: string;
  profileHref: string | null;
  readinessNotes: readonly string[];
  reference: string;
  nextSteps: readonly {
    detail: string;
    due: string;
    state: HubTaskState;
    title: string;
  }[];
  rawStatus: HubRawStatus | null;
  service: string;
  stage: HubStage;
  status: HubStatus;
  timeline: readonly { at: string; label: string }[];
}>;

export const hubStages: readonly { id: HubStage; label: string }[] = [
  { id: "talep", label: "Talep" },
  { id: "kontrol", label: "Kontrol" },
  { id: "onay", label: "Onay" },
  { id: "gorusme", label: "Görüşme" },
];

export const hubStatusLabels: Readonly<Record<HubStatus, string>> = {
  aktif: "Aktif",
  bekliyor: "Bekliyor",
  gelmedi: "Gelmedi",
  iptal: "İptal",
  onaylandi: "Onaylandı",
  pasif: "Pasif",
  potansiyel: "Ön görüşme",
  reddedildi: "Reddedildi",
  tamamlandi: "Tamamlandı",
  yeni: "Yeni",
};

export const hubGroupLabels: Readonly<Record<HubRecord["group"], string>> = {
  buHafta: "Bu hafta",
  bugun: "Bugün",
  dahaEski: "Daha eski",
};

/* Minimal synthetic records are retained only for pure helper tests. They are
   never rendered by the production record center and contain no real data. */
const syntheticBase: HubRecord = {
  channel: "Test",
  connections: [],
  contactEmail: "ornek@eposta.dev",
  contactPhone: "0500 000 00 00",
  group: "bugun",
  id: "test-bugun",
  kind: "randevu",
  lastAction: "Test kaydı",
  lastActionAt: "Bugün",
  name: "Örnek Kayıt",
  nextSteps: [],
  plannedAt: "—",
  profileHref: null,
  rawStatus: "REQUESTED",
  readinessNotes: [],
  reference: "TEST-1",
  service: "Test hizmeti",
  stage: "talep",
  status: "yeni",
  timeline: [],
};

export const hubRecords: readonly HubRecord[] = [
  syntheticBase,
  {
    ...syntheticBase,
    group: "buHafta",
    id: "test-hafta",
    name: "Haftalık Örnek",
    reference: "TEST-2",
  },
  {
    ...syntheticBase,
    group: "dahaEski",
    id: "test-eski",
    name: "Eski Örnek",
    reference: "TEST-3",
  },
];

const monogramPalette: readonly [string, string][] = [
  ["#f6d0c0", "#eba98e"],
  ["#dcead1", "#b5cf9e"],
  ["#f7e3b6", "#e5c47e"],
  ["#dde4f2", "#aebde0"],
  ["#f2d9e4", "#dcaec4"],
  ["#d7ece8", "#a4d0c8"],
];

export function getMonogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return `${first}${last}`.toLocaleUpperCase("tr-TR");
}

export function getMonogramColors(name: string): readonly [string, string] {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.codePointAt(0)!) % 997;
  }
  return monogramPalette[hash % monogramPalette.length];
}

export function groupRecords(
  records: readonly HubRecord[],
): readonly { group: HubRecord["group"]; items: readonly HubRecord[] }[] {
  const order: readonly HubRecord["group"][] = ["bugun", "buHafta", "dahaEski"];
  return order
    .map((group) => ({ group, items: records.filter((record) => record.group === group) }))
    .filter((bucket) => bucket.items.length > 0);
}

export function getStageIndex(stage: HubStage): number {
  return hubStages.findIndex((candidate) => candidate.id === stage);
}

export function getAdjacentRecordId(
  records: readonly HubRecord[],
  currentId: string | null,
  direction: 1 | -1,
): string | null {
  const ordered = groupRecords(records).flatMap((bucket) => bucket.items);
  if (ordered.length === 0) return null;
  const index = ordered.findIndex((record) => record.id === currentId);
  if (index === -1) {
    return direction === 1 ? ordered[0].id : ordered[ordered.length - 1].id;
  }
  const next = index + direction;
  if (next < 0 || next >= ordered.length) return ordered[index].id;
  return ordered[next].id;
}
