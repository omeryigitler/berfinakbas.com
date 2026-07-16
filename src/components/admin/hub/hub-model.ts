export type HubStage = "talep" | "kontrol" | "onay" | "gorusme";

/* Raw appointment status as stored in the database — kept on the record so
   the UI can offer only transitions the domain state machine allows. */
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
  "bekliyor" | "gelmedi" | "iptal" | "onaylandi" | "reddedildi" | "tamamlandi" | "yeni";

export type HubTaskState = "done" | "active" | "upcoming";

export type HubRecord = Readonly<{
  channel: string;
  connections: readonly { name: string; relation: string }[];
  contactEmail: string;
  contactPhone: string;
  group: "bugun" | "buHafta" | "dahaEski";
  id: string;
  lastAction: string;
  lastActionAt: string;
  name: string;
  plannedAt: string;
  reference: string;
  nextSteps: readonly {
    detail: string;
    due: string;
    state: HubTaskState;
    title: string;
  }[];
  readinessGrade: string;
  readinessNotes: readonly string[];
  rawStatus: HubRawStatus;
  readinessScore: number;
  service: string;
  stage: HubStage;
  status: HubStatus;
  timeline: readonly { at: string; label: string }[];
}>;

export type HubNavChild = Readonly<{ badge?: number; id: string; label: string }>;

export type HubNavGroup = Readonly<{
  children: readonly HubNavChild[];
  icon: string;
  id: string;
  label: string;
}>;

export const hubStages: readonly { id: HubStage; label: string }[] = [
  { id: "talep", label: "Talep" },
  { id: "kontrol", label: "Kontrol" },
  { id: "onay", label: "Onay" },
  { id: "gorusme", label: "Görüşme" },
];

export const hubStatusLabels: Readonly<Record<HubStatus, string>> = {
  bekliyor: "Bekliyor",
  gelmedi: "Gelmedi",
  iptal: "İptal",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  tamamlandi: "Tamamlandı",
  yeni: "Yeni",
};

export const hubGroupLabels: Readonly<Record<HubRecord["group"], string>> = {
  buHafta: "Bu hafta",
  bugun: "Bugün",
  dahaEski: "Daha eski",
};

export const hubNavGroups: readonly HubNavGroup[] = [
  {
    children: [
      { id: "kuyruk", label: "Talep kuyruğu" },
      { id: "gunum", label: "Günüm" },
    ],
    icon: "⌂",
    id: "calisma",
    label: "Çalışma Alanım",
  },
  {
    children: [
      { id: "talepler", label: "Talepler" },
      { id: "takvim", label: "Takvim" },
      { id: "musaitlik", label: "Müsaitlik" },
    ],
    icon: "◷",
    id: "randevular",
    label: "Randevular",
  },
  {
    children: [
      { id: "danisan-listesi", label: "Danışanlar" },
      { id: "aile-iletisim", label: "Aile iletişimi" },
    ],
    icon: "◌",
    id: "danisanlar",
    label: "Danışanlar",
  },
  {
    children: [
      { id: "odemeler", label: "Ödemeler" },
      { id: "planlar", label: "Seans planları" },
    ],
    icon: "₺",
    id: "finans",
    label: "Finans",
  },
  {
    children: [
      { id: "saglik", label: "Entegrasyon sağlığı" },
      { id: "ayarlar", label: "Ayarlar" },
    ],
    icon: "◇",
    id: "sistem",
    label: "Sistem",
  },
];

/*
 * Synthetic preview data only — AGENTS.md forbids real personal data in
 * seeds/examples, so every name, phone and address here is invented.
 */
export const hubRecords: readonly HubRecord[] = [
  {
    channel: "Web formu",
    connections: [
      { name: "Deniz Işık", relation: "Velisi" },
      { name: "Papatya Anaokulu", relation: "Yönlendiren kurum" },
    ],
    contactEmail: "ornek.veli@eposta.dev",
    contactPhone: "0500 000 00 01",
    group: "bugun",
    id: "rec-arya",
    lastAction: "İlk değerlendirme talebi",
    lastActionAt: "Bugün 09:24",
    name: "Arya Işık",
    plannedAt: "Yarın 10:00",
    reference: "BA-2026-1001",
    nextSteps: [
      {
        detail: "Veli ile kısa tanışma araması planla.",
        due: "Bugün 16:30'a kadar",
        state: "active",
        title: "Tanışma araması",
      },
      {
        detail: "Uygun saat için takvim önerisi gönder.",
        due: "Aramadan sonra",
        state: "upcoming",
        title: "Saat önerisi",
      },
      {
        detail: "Onay mesajıyla randevuyu kesinleştir.",
        due: "Saat netleşince",
        state: "upcoming",
        title: "Onay mesajı",
      },
    ],
    readinessGrade: "A",
    readinessNotes: [
      "İletişim bilgileri doğrulandı",
      "Veli onayı formda alındı",
      "Tercih edilen saat aralığı belirtildi",
      "Önceki kayıt bulunmuyor",
    ],
    readinessScore: 90,
    service: "Çocuk dil ve konuşma değerlendirmesi",
    stage: "kontrol",
    rawStatus: "REQUESTED",
    status: "yeni",
    timeline: [
      { at: "Bugün 09:24", label: "Web formundan talep alındı" },
      { at: "Bugün 09:25", label: "Otomatik bilgilendirme e-postası gönderildi" },
    ],
  },
  {
    channel: "Telefon",
    connections: [{ name: "Kardelen Koleji", relation: "Yönlendiren kurum" }],
    contactEmail: "ornek.danisan@eposta.dev",
    contactPhone: "0500 000 00 02",
    group: "bugun",
    id: "rec-baran",
    lastAction: "Saat önerisi bekleniyor",
    lastActionAt: "Bugün 08:12",
    name: "Baran Toprak",
    plannedAt: "Perşembe 14:30",
    reference: "BA-2026-1002",
    nextSteps: [
      {
        detail: "İki uygun saat seçeneği ilet.",
        due: "Bugün 12:00'a kadar",
        state: "active",
        title: "Saat önerisi",
      },
      {
        detail: "Seçilen saati onay mesajıyla kesinleştir.",
        due: "Yanıt gelince",
        state: "upcoming",
        title: "Onay mesajı",
      },
    ],
    readinessGrade: "B",
    readinessNotes: [
      "İletişim bilgileri doğrulandı",
      "Görüşme biçimi tercih edildi",
      "Saat tercihi henüz netleşmedi",
    ],
    readinessScore: 74,
    service: "Ergen akıcılık görüşmesi",
    stage: "kontrol",
    rawStatus: "PENDING_REVIEW",
    status: "bekliyor",
    timeline: [
      { at: "Bugün 08:12", label: "Telefonla ön görüşme yapıldı" },
      { at: "Dün 17:40", label: "Talep kaydı oluşturuldu" },
    ],
  },
  {
    channel: "Web formu",
    connections: [{ name: "Derya Yalın", relation: "Eşi" }],
    contactEmail: "ornek.kisi@eposta.dev",
    contactPhone: "0500 000 00 03",
    group: "buHafta",
    id: "rec-cem",
    lastAction: "Randevu onaylandı",
    lastActionAt: "Salı 15:05",
    name: "Cem Yalın",
    plannedAt: "Cuma 11:00",
    reference: "BA-2026-1003",
    nextSteps: [
      {
        detail: "Görüşme öncesi hatırlatma mesajı planla.",
        due: "Görüşmeden 1 gün önce",
        state: "active",
        title: "Hatırlatma",
      },
      {
        detail: "İlk görüşme notu için şablon hazırla.",
        due: "Görüşme günü",
        state: "upcoming",
        title: "Görüşme hazırlığı",
      },
    ],
    readinessGrade: "A",
    readinessNotes: [
      "Randevu saati kesinleşti",
      "Ön bilgilendirme tamamlandı",
      "Çevrim içi bağlantı paylaşıldı",
    ],
    readinessScore: 96,
    service: "Yetişkin ses terapisi",
    stage: "onay",
    rawStatus: "CONFIRMED",
    status: "onaylandi",
    timeline: [
      { at: "Salı 15:05", label: "Randevu onay mesajı gönderildi" },
      { at: "Salı 14:50", label: "Uygunluk kontrolü tamamlandı" },
      { at: "Pazartesi 11:20", label: "Web formundan talep alındı" },
    ],
  },
  {
    channel: "Yönlendirme",
    connections: [{ name: "Gökçe Aksu", relation: "Annesi" }],
    contactEmail: "ornek.aile@eposta.dev",
    contactPhone: "0500 000 00 04",
    group: "dahaEski",
    id: "rec-duru",
    lastAction: "İlk görüşme tamamlandı",
    lastActionAt: "Geçen hafta",
    name: "Duru Aksu",
    plannedAt: "Geçen hafta 09:30",
    reference: "BA-2026-1004",
    nextSteps: [
      {
        detail: "Aileye özet ve öneri planını ilet.",
        due: "Bu hafta içinde",
        state: "active",
        title: "Özet paylaşımı",
      },
    ],
    readinessGrade: "A",
    readinessNotes: [
      "İlk görüşme tamamlandı",
      "Devam planı taslağı hazır",
      "Aile bilgilendirme bekliyor",
    ],
    readinessScore: 88,
    service: "Çocuk artikülasyon takibi",
    stage: "gorusme",
    rawStatus: "COMPLETED",
    status: "tamamlandi",
    timeline: [
      { at: "Geçen hafta", label: "İlk görüşme yapıldı" },
      { at: "2 hafta önce", label: "Randevu onaylandı" },
    ],
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
