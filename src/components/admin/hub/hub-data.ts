import type { HubRawStatus, HubRecord, HubStage, HubStatus, HubTaskState } from "./hub-model";

/*
 * Pure mapping layer between real appointment rows and the Hub view model.
 * No Prisma import: the page queries with the exact select shape below, so
 * these functions stay unit-testable without a database.
 */

export type HubAppointmentStatus = HubRawStatus;

export type HubAppointmentRow = Readonly<{
  approvedAt: Date | null;
  client: Readonly<{
    email: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    preferredName: string | null;
    type: "ADULT" | "CHILD";
  }>;
  createdAt: Date;
  duplicateReviewStatus: "KEPT_SEPARATE" | "LINKED_EXISTING" | "NOT_REQUIRED" | "PENDING";
  guardian: Readonly<{ firstName: string; lastName: string }> | null;
  id: string;
  practitioner: Readonly<{ displayName: string }>;
  publicReference: string;
  requestNote: string | null;
  serviceNameSnapshot: string;
  source: "ADMIN" | "PHONE" | "WEB";
  startsAt: Date;
  status: HubAppointmentStatus;
  statusLogs: readonly Readonly<{ createdAt: Date; toStatus: HubAppointmentStatus }>[];
}>;

const stageByStatus: Readonly<Record<HubAppointmentStatus, HubStage>> = {
  CANCELLED_BY_CLIENT: "onay",
  CANCELLED_BY_PRACTITIONER: "onay",
  COMPLETED: "gorusme",
  CONFIRMED: "onay",
  NO_SHOW: "gorusme",
  PENDING_REVIEW: "kontrol",
  REJECTED: "kontrol",
  REQUESTED: "talep",
  RESCHEDULE_PROPOSED: "onay",
};

const hubStatusByStatus: Readonly<Record<HubAppointmentStatus, HubStatus>> = {
  CANCELLED_BY_CLIENT: "iptal",
  CANCELLED_BY_PRACTITIONER: "iptal",
  COMPLETED: "tamamlandi",
  CONFIRMED: "onaylandi",
  NO_SHOW: "gelmedi",
  PENDING_REVIEW: "bekliyor",
  REJECTED: "reddedildi",
  REQUESTED: "yeni",
  RESCHEDULE_PROPOSED: "bekliyor",
};

const statusEventLabels: Readonly<Record<HubAppointmentStatus, string>> = {
  CANCELLED_BY_CLIENT: "Danışan randevuyu iptal etti",
  CANCELLED_BY_PRACTITIONER: "Randevu uygulayıcı tarafından iptal edildi",
  COMPLETED: "Görüşme tamamlandı",
  CONFIRMED: "Randevu onaylandı",
  NO_SHOW: "Görüşmeye gelinmedi",
  PENDING_REVIEW: "Talep incelemeye alındı",
  REJECTED: "Talep reddedildi",
  REQUESTED: "Talep alındı",
  RESCHEDULE_PROPOSED: "Yeni saat önerildi",
};

const channelLabels: Readonly<Record<HubAppointmentRow["source"], string>> = {
  ADMIN: "Yönetici kaydı",
  PHONE: "Telefon",
  WEB: "Web formu",
};

function dayKey(date: Date, timeZone: string): number {
  const key = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).format(date);
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function dayDifference(from: Date, to: Date, timeZone: string): number {
  return Math.round((dayKey(to, timeZone) - dayKey(from, timeZone)) / 86_400_000);
}

function formatClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatRelativeStamp(date: Date, now: Date, timeZone: string): string {
  const diff = dayDifference(date, now, timeZone);
  const clock = formatClock(date, timeZone);
  if (diff <= 0) return `Bugün ${clock}`;
  if (diff === 1) return `Dün ${clock}`;
  if (diff < 7) {
    const weekday = new Intl.DateTimeFormat("tr-TR", { timeZone, weekday: "short" }).format(date);
    return `${weekday} ${clock}`;
  }
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
}

export function formatPlannedStamp(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone,
    weekday: "short",
  }).format(date);
}

export function resolveGroup(createdAt: Date, now: Date, timeZone: string): HubRecord["group"] {
  const diff = dayDifference(createdAt, now, timeZone);
  if (diff <= 0) return "bugun";
  if (diff < 7) return "buHafta";
  return "dahaEski";
}

/*
 * Readiness = how complete and decided a request is. Deterministic weights
 * over the row itself (sums to 100): phone 15, e-mail 15, guardian linked for
 * a child (adults auto-pass) 15, request note 10, time finalised 20,
 * duplicate review resolved 15, known source 10.
 */
export function scoreReadiness(row: HubAppointmentRow): {
  grade: string;
  notes: readonly string[];
  score: number;
} {
  const timingDecided =
    row.approvedAt !== null || row.status === "CONFIRMED" || row.status === "COMPLETED";
  const guardianOk = row.client.type === "ADULT" || row.guardian !== null;
  const duplicateResolved = row.duplicateReviewStatus !== "PENDING";

  const checks: readonly { note: string; ok: boolean; weight: number }[] = [
    { note: "Telefon bilgisi", ok: Boolean(row.client.phone), weight: 15 },
    { note: "E-posta bilgisi", ok: Boolean(row.client.email), weight: 15 },
    {
      note: row.client.type === "CHILD" ? "Veli kaydı" : "Yetişkin başvurusu",
      ok: guardianOk,
      weight: 15,
    },
    { note: "Talep notu", ok: Boolean(row.requestNote), weight: 10 },
    { note: "Saat kesinleşmesi", ok: timingDecided, weight: 20 },
    { note: "Mükerrer kontrolü", ok: duplicateResolved, weight: 15 },
    { note: "Başvuru kanalı", ok: true, weight: 10 },
  ];

  const score = checks.reduce((total, check) => total + (check.ok ? check.weight : 0), 0);
  const grade = score >= 85 ? "A" : score >= 65 ? "B" : "C";
  const notes = [
    ...checks.filter((check) => !check.ok).map((check) => `${check.note} eksik`),
    ...checks.filter((check) => check.ok).map((check) => `${check.note} tamam`),
  ].slice(0, 4);

  return { grade, notes, score };
}

type NextStep = HubRecord["nextSteps"][number];

function step(title: string, detail: string, due: string, state: HubTaskState): NextStep {
  return { detail, due, state, title };
}

export function buildNextSteps(status: HubAppointmentStatus): readonly NextStep[] {
  switch (status) {
    case "REQUESTED":
      return [
        step(
          "İlk inceleme",
          "Talebi ve iletişim bilgilerini gözden geçir.",
          "En kısa sürede",
          "active",
        ),
        step(
          "Uygunluk kontrolü",
          "Takvim ve çalışma kurallarıyla karşılaştır.",
          "İncelemeden sonra",
          "upcoming",
        ),
        step("Onay mesajı", "Saati onay mesajıyla kesinleştir.", "Kontrol bitince", "upcoming"),
      ];
    case "PENDING_REVIEW":
      return [
        step(
          "Uygunluk kontrolü",
          "Takvim ve çalışma kurallarıyla karşılaştır.",
          "Bugün içinde",
          "active",
        ),
        step("Onay mesajı", "Saati onay mesajıyla kesinleştir.", "Kontrol bitince", "upcoming"),
      ];
    case "RESCHEDULE_PROPOSED":
      return [
        step(
          "Yanıt takibi",
          "Önerilen yeni saat için danışan yanıtını takip et.",
          "Yanıt gelince",
          "active",
        ),
      ];
    case "CONFIRMED":
      return [
        step(
          "Hatırlatma",
          "Görüşme öncesi hatırlatmayı planla.",
          "Görüşmeden 1 gün önce",
          "active",
        ),
        step("Görüşme hazırlığı", "Görüşme notu şablonunu hazırla.", "Görüşme günü", "upcoming"),
      ];
    case "COMPLETED":
      return [
        step(
          "Kapanış ve sonraki adım",
          "Özeti paylaş, devam planını netleştir.",
          "Bu hafta içinde",
          "active",
        ),
      ];
    default:
      return [
        step(
          "Kapanış notu",
          "Kaydı kapat; gerekiyorsa yeniden planlama öner.",
          "Uygun olduğunda",
          "active",
        ),
      ];
  }
}

export function mapAppointmentToHubRecord(
  row: HubAppointmentRow,
  now: Date,
  timeZone: string,
): HubRecord {
  const readiness = scoreReadiness(row);
  const latestLog = row.statusLogs[0] ?? null;

  const timeline = [
    ...row.statusLogs.map((log) => ({
      at: formatRelativeStamp(log.createdAt, now, timeZone),
      label: statusEventLabels[log.toStatus],
    })),
    { at: formatRelativeStamp(row.createdAt, now, timeZone), label: "Talep kaydı oluşturuldu" },
  ].slice(0, 6);

  const connections: { name: string; relation: string }[] = [];
  if (row.guardian) {
    connections.push({
      name: `${row.guardian.firstName} ${row.guardian.lastName}`,
      relation: "Veli",
    });
  }
  connections.push({ name: row.practitioner.displayName, relation: "Uygulayıcı" });

  return {
    channel: channelLabels[row.source],
    connections,
    contactEmail: row.client.email ?? "—",
    contactPhone: row.client.phone ?? "—",
    group: resolveGroup(row.createdAt, now, timeZone),
    id: row.id,
    kind: "randevu",
    lastAction: latestLog ? statusEventLabels[latestLog.toStatus] : "Talep alındı",
    lastActionAt: formatRelativeStamp(latestLog?.createdAt ?? row.createdAt, now, timeZone),
    name: row.client.preferredName ?? `${row.client.firstName} ${row.client.lastName}`,
    nextSteps: buildNextSteps(row.status),
    plannedAt: formatPlannedStamp(row.startsAt, timeZone),
    profileHref: null,
    readinessGrade: readiness.grade,
    readinessNotes: readiness.notes,
    rawStatus: row.status,
    readinessScore: readiness.score,
    reference: row.publicReference,
    service: row.serviceNameSnapshot,
    stage: stageByStatus[row.status],
    status: hubStatusByStatus[row.status],
    timeline,
  };
}

/* ---------- clients ---------- */

export type HubClientStatus = "ACTIVE" | "INACTIVE" | "PROSPECTIVE";

export type HubClientRow = Readonly<{
  appointments: readonly Readonly<{
    serviceNameSnapshot: string;
    startsAt: Date;
    status: HubAppointmentStatus;
  }>[];
  createdAt: Date;
  email: string | null;
  firstName: string;
  guardians: readonly Readonly<{
    guardian: Readonly<{ firstName: string; lastName: string }>;
    relationship: string;
  }>[];
  id: string;
  lastName: string;
  phone: string | null;
  preferredName: string | null;
  status: HubClientStatus;
  type: "ADULT" | "CHILD";
  updatedAt: Date;
}>;

const hubStatusByClientStatus: Readonly<Record<HubClientStatus, HubStatus>> = {
  ACTIVE: "aktif",
  INACTIVE: "pasif",
  PROSPECTIVE: "potansiyel",
};

const clientTypeLabels: Readonly<Record<HubClientRow["type"], string>> = {
  ADULT: "Yetişkin",
  CHILD: "Çocuk",
};

/*
 * Client readiness = profile completeness: phone 25, e-mail 25, guardian for
 * a child (adults auto-pass) 25, any appointment history 25.
 */
export function scoreClientReadiness(row: HubClientRow): {
  grade: string;
  notes: readonly string[];
  score: number;
} {
  const guardianOk = row.type === "ADULT" || row.guardians.length > 0;
  const checks: readonly { note: string; ok: boolean; weight: number }[] = [
    { note: "Telefon bilgisi", ok: Boolean(row.phone), weight: 25 },
    { note: "E-posta bilgisi", ok: Boolean(row.email), weight: 25 },
    {
      note: row.type === "CHILD" ? "Veli kaydı" : "Yetişkin kaydı",
      ok: guardianOk,
      weight: 25,
    },
    { note: "Randevu geçmişi", ok: row.appointments.length > 0, weight: 25 },
  ];

  const score = checks.reduce((total, check) => total + (check.ok ? check.weight : 0), 0);
  const grade = score >= 85 ? "A" : score >= 65 ? "B" : "C";
  const notes = [
    ...checks.filter((check) => !check.ok).map((check) => `${check.note} eksik`),
    ...checks.filter((check) => check.ok).map((check) => `${check.note} tamam`),
  ].slice(0, 4);

  return { grade, notes, score };
}

function buildClientNextSteps(status: HubClientStatus): readonly NextStep[] {
  switch (status) {
    case "PROSPECTIVE":
      return [
        step("İlk temas", "Tanışma görüşmesini planla.", "En kısa sürede", "active"),
        step(
          "Değerlendirme planı",
          "İhtiyaca göre değerlendirme öner.",
          "Temastan sonra",
          "upcoming",
        ),
      ];
    case "ACTIVE":
      return [step("Takip randevusu", "Sonraki seansı takvimle.", "Plan dahilinde", "active")];
    default:
      return [step("Yeniden temas", "Uygunsa yeniden planlama öner.", "Uygun olduğunda", "active")];
  }
}

export function mapClientToHubRecord(row: HubClientRow, now: Date, timeZone: string): HubRecord {
  const readiness = scoreClientReadiness(row);
  const upcoming = row.appointments.find((appointment) => appointment.startsAt > now) ?? null;

  const timeline = [
    ...row.appointments.map((appointment) => ({
      at: formatRelativeStamp(appointment.startsAt, now, timeZone),
      label: `Randevu · ${appointment.serviceNameSnapshot}`,
    })),
    { at: formatRelativeStamp(row.createdAt, now, timeZone), label: "Danışan kaydı oluşturuldu" },
  ].slice(0, 6);

  return {
    channel: clientTypeLabels[row.type],
    connections: row.guardians.map((entry) => ({
      name: `${entry.guardian.firstName} ${entry.guardian.lastName}`,
      relation: entry.relationship,
    })),
    contactEmail: row.email ?? "—",
    contactPhone: row.phone ?? "—",
    group: resolveGroup(row.updatedAt, now, timeZone),
    id: row.id,
    kind: "danisan",
    lastAction: "Kayıt güncellendi",
    lastActionAt: formatRelativeStamp(row.updatedAt, now, timeZone),
    name: row.preferredName ?? `${row.firstName} ${row.lastName}`,
    nextSteps: buildClientNextSteps(row.status),
    plannedAt: upcoming ? formatPlannedStamp(upcoming.startsAt, timeZone) : "—",
    profileHref: `/yonetim/danisan-profili/${row.id}`,
    rawStatus: null,
    readinessGrade: readiness.grade,
    readinessNotes: readiness.notes,
    readinessScore: readiness.score,
    reference: "",
    service: `${clientTypeLabels[row.type]} danışan kaydı`,
    stage: "talep",
    status: hubStatusByClientStatus[row.status],
    timeline,
  };
}
