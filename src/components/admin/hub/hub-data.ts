import type { HubRawStatus, HubRecord, HubStage, HubStatus, HubTaskState } from "./hub-model";

export type { HubFinanceSummary } from "./hub-finance";

/* Pure mapping layer between real appointment/client rows and the Hub view
   model. No Prisma import keeps these functions unit-testable. */

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
  if (diff === 0) return `Bugün ${clock}`;
  if (diff === 1) return `Dün ${clock}`;
  if (diff === -1) return `Yarın ${clock}`;
  if (Math.abs(diff) < 7) {
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

export function resolveGroup(activityAt: Date, now: Date, timeZone: string): HubRecord["group"] {
  const diff = dayDifference(activityAt, now, timeZone);
  if (diff <= 0) return "bugun";
  if (diff < 7) return "buHafta";
  return "dahaEski";
}

function orderedChecks(checks: readonly Readonly<{ label: string; ok: boolean }>[]): string[] {
  return [
    ...checks.filter((check) => !check.ok).map((check) => `${check.label} eksik`),
    ...checks.filter((check) => check.ok).map((check) => `${check.label} tamam`),
  ];
}

export function buildAppointmentRecordChecks(row: HubAppointmentRow): readonly string[] {
  const timingDecided =
    row.approvedAt !== null || row.status === "CONFIRMED" || row.status === "COMPLETED";
  return orderedChecks([
    { label: "Telefon bilgisi", ok: Boolean(row.client.phone) },
    { label: "E-posta bilgisi", ok: Boolean(row.client.email) },
    {
      label: row.client.type === "CHILD" ? "Veli kaydı" : "Yetişkin başvurusu",
      ok: row.client.type === "ADULT" || row.guardian !== null,
    },
    { label: "Talep notu", ok: Boolean(row.requestNote) },
    { label: "Saat kesinleşmesi", ok: timingDecided },
    { label: "Mükerrer kontrolü", ok: row.duplicateReviewStatus !== "PENDING" },
  ]);
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
        step(
          "Durum kararı",
          "Panelden talebi onayla, yeni saat öner veya reddet.",
          "Kontrol bitince",
          "upcoming",
        ),
      ];
    case "PENDING_REVIEW":
      return [
        step(
          "Uygunluk kontrolü",
          "Takvim ve çalışma kurallarıyla karşılaştır.",
          "Bugün içinde",
          "active",
        ),
        step(
          "Durum kararı",
          "Panelden talebi onayla, yeni saat öner veya reddet.",
          "Kontrol bitince",
          "upcoming",
        ),
      ];
    case "RESCHEDULE_PROPOSED":
      return [
        step(
          "Yanıt takibi",
          "Yanıt geldiğinde panelden randevuyu onayla veya yeni saat öner.",
          "Yanıt gelince",
          "active",
        ),
      ];
    case "CONFIRMED":
      return [
        step(
          "Görüşme durumunu takip et",
          "Görüşme sonrasında panelden tamamlandı, gelmedi veya iptal durumunu seç.",
          "Görüşme sonrasında",
          "active",
        ),
      ];
    case "COMPLETED":
      return [
        step(
          "Açık işlem yok",
          "Görüşme tamamlandı; durum ve işlem geçmişi korunuyor.",
          "Kapalı kayıt",
          "done",
        ),
      ];
    default:
      return [
        step(
          "Kayıt kapalı",
          "Durum geçmişi korunuyor; yeni bir talep oluşmadıkça işlem gerekmiyor.",
          "Kapalı kayıt",
          "done",
        ),
      ];
  }
}

export function mapAppointmentToHubRecord(
  row: HubAppointmentRow,
  now: Date,
  timeZone: string,
): HubRecord {
  const latestLog = row.statusLogs[0] ?? null;
  const activityAt = latestLog?.createdAt ?? row.createdAt;
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
    group: resolveGroup(activityAt, now, timeZone),
    id: row.id,
    kind: "randevu",
    lastAction: latestLog ? statusEventLabels[latestLog.toStatus] : "Talep alındı",
    lastActionAt: formatRelativeStamp(activityAt, now, timeZone),
    name: row.client.preferredName ?? `${row.client.firstName} ${row.client.lastName}`,
    nextSteps: buildNextSteps(row.status),
    plannedAt: formatPlannedStamp(row.startsAt, timeZone),
    profileHref: null,
    rawStatus: row.status,
    readinessNotes: buildAppointmentRecordChecks(row),
    reference: row.publicReference,
    service: row.serviceNameSnapshot,
    stage: stageByStatus[row.status],
    status: hubStatusByStatus[row.status],
    timeline,
  };
}

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

export function buildClientRecordChecks(row: HubClientRow): readonly string[] {
  return orderedChecks([
    { label: "Telefon bilgisi", ok: Boolean(row.phone) },
    { label: "E-posta bilgisi", ok: Boolean(row.email) },
    {
      label: row.type === "CHILD" ? "Veli kaydı" : "Yetişkin kaydı",
      ok: row.type === "ADULT" || row.guardians.length > 0,
    },
    { label: "Planlanan randevu", ok: row.appointments.length > 0 },
  ]);
}

function buildClientNextSteps(status: HubClientStatus): readonly NextStep[] {
  switch (status) {
    case "PROSPECTIVE":
      return [
        step(
          "İlk randevuyu oluştur",
          "Randevu oluşturma işlemini panelden başlat.",
          "En kısa sürede",
          "active",
        ),
        step(
          "Kayıt durumunu güncelle",
          "İlk temas tamamlandığında danışan durumunu panelden güncelle.",
          "İlk temastan sonra",
          "upcoming",
        ),
      ];
    case "ACTIVE":
      return [
        step(
          "Randevu planını kontrol et",
          "Yaklaşan randevu yoksa panelden yeni randevu oluştur.",
          "Plan dahilinde",
          "active",
        ),
      ];
    default:
      return [
        step(
          "Açık işlem yok",
          "Danışan kaydı pasif; yeniden etkinleştirilmedikçe işlem gerekmiyor.",
          "Kapalı kayıt",
          "done",
        ),
      ];
  }
}

export function mapClientToHubRecord(row: HubClientRow, now: Date, timeZone: string): HubRecord {
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
    profileHref: `/yonetim/danisan-profili?clientId=${encodeURIComponent(row.id)}`,
    rawStatus: null,
    readinessNotes: buildClientRecordChecks(row),
    reference: "",
    service: `${clientTypeLabels[row.type]} danışan kaydı`,
    stage: "talep",
    status: hubStatusByClientStatus[row.status],
    timeline,
  };
}

export type HubAvailabilityRuleRow = Readonly<{
  localEndTime: string;
  localStartTime: string;
  slotIncrementMinutes: number;
  status: "ACTIVE" | "INACTIVE";
  weekday: number;
}>;

export type HubAvailabilityDay = Readonly<{
  label: string;
  slots: readonly Readonly<{ active: boolean; increment: number; range: string }>[];
}>;

const weekdayLabels = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
] as const;
const weekdayOrder = [1, 2, 3, 4, 5, 6, 0] as const;

export function buildWeeklyAvailability(
  rules: readonly HubAvailabilityRuleRow[],
): readonly HubAvailabilityDay[] {
  return weekdayOrder.map((weekday) => ({
    label: weekdayLabels[weekday],
    slots: rules
      .filter((rule) => rule.weekday === weekday)
      .map((rule) => ({
        active: rule.status === "ACTIVE",
        increment: rule.slotIncrementMinutes,
        range: `${rule.localStartTime}–${rule.localEndTime}`,
      })),
  }));
}
