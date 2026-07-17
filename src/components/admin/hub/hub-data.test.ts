import { describe, expect, it } from "vitest";

import {
  buildAppointmentRecordChecks,
  buildClientRecordChecks,
  buildNextSteps,
  buildWeeklyAvailability,
  formatRelativeStamp,
  mapAppointmentToHubRecord,
  mapClientToHubRecord,
  resolveGroup,
  type HubAppointmentRow,
  type HubAppointmentStatus,
  type HubClientRow,
} from "./hub-data";

const timeZone = "Europe/Istanbul";
const now = new Date("2026-07-06T12:00:00+03:00");

function makeRow(overrides: Partial<HubAppointmentRow> = {}): HubAppointmentRow {
  return {
    approvedAt: null,
    client: {
      email: "ornek@eposta.dev",
      firstName: "Arya",
      lastName: "Işık",
      phone: "05000000001",
      preferredName: null,
      type: "CHILD",
    },
    createdAt: new Date("2026-07-06T09:24:00+03:00"),
    duplicateReviewStatus: "NOT_REQUIRED",
    guardian: { firstName: "Deniz", lastName: "Işık" },
    id: "apt-1",
    practitioner: { displayName: "Berfin Akbaş" },
    publicReference: "BA-2026-1001",
    requestNote: "Değerlendirme talebi",
    serviceNameSnapshot: "Çocuk dil değerlendirmesi",
    source: "WEB",
    startsAt: new Date("2026-07-08T10:00:00+03:00"),
    status: "REQUESTED",
    statusLogs: [{ createdAt: new Date("2026-07-06T09:24:00+03:00"), toStatus: "REQUESTED" }],
    ...overrides,
  };
}

function makeClientRow(overrides: Partial<HubClientRow> = {}): HubClientRow {
  return {
    appointments: [
      {
        serviceNameSnapshot: "Ses terapisi",
        startsAt: new Date("2026-07-10T10:00:00+03:00"),
        status: "CONFIRMED",
      },
    ],
    createdAt: new Date("2026-06-01T10:00:00+03:00"),
    email: "ornek@eposta.dev",
    firstName: "Duru",
    guardians: [{ guardian: { firstName: "Gökçe", lastName: "Aksu" }, relationship: "Annesi" }],
    id: "client-1",
    lastName: "Aksu",
    phone: "05000000004",
    preferredName: null,
    status: "ACTIVE",
    type: "CHILD",
    updatedAt: new Date("2026-07-06T09:00:00+03:00"),
    ...overrides,
  };
}

describe("formatRelativeStamp", () => {
  it("labels today, yesterday, tomorrow, nearby weekdays and older dates", () => {
    expect(formatRelativeStamp(new Date("2026-07-06T09:24:00+03:00"), now, timeZone)).toBe(
      "Bugün 09:24",
    );
    expect(formatRelativeStamp(new Date("2026-07-05T23:30:00+03:00"), now, timeZone)).toBe(
      "Dün 23:30",
    );
    expect(formatRelativeStamp(new Date("2026-07-07T10:00:00+03:00"), now, timeZone)).toBe(
      "Yarın 10:00",
    );
    expect(formatRelativeStamp(new Date("2026-07-01T15:05:00+03:00"), now, timeZone)).toMatch(
      /^Çar 15:05$/,
    );
    expect(formatRelativeStamp(new Date("2026-07-09T10:00:00+03:00"), now, timeZone)).toMatch(
      /^Per 10:00$/,
    );
    expect(formatRelativeStamp(new Date("2026-06-01T10:00:00+03:00"), now, timeZone)).toBe("1 Haz");
  });

  it("respects the business time zone at day boundaries", () => {
    expect(formatRelativeStamp(new Date("2026-07-05T23:30:00Z"), now, timeZone)).toBe(
      "Bugün 02:30",
    );
  });
});

describe("resolveGroup", () => {
  it("buckets by activity day difference in the business time zone", () => {
    expect(resolveGroup(new Date("2026-07-06T00:10:00+03:00"), now, timeZone)).toBe("bugun");
    expect(resolveGroup(new Date("2026-07-01T10:00:00+03:00"), now, timeZone)).toBe("buHafta");
    expect(resolveGroup(new Date("2026-06-29T10:00:00+03:00"), now, timeZone)).toBe("dahaEski");
  });
});

describe("record checks", () => {
  it("lists missing appointment fields before completed fields without a score", () => {
    const checks = buildAppointmentRecordChecks(
      makeRow({
        client: {
          email: null,
          firstName: "Arya",
          lastName: "Işık",
          phone: null,
          preferredName: null,
          type: "CHILD",
        },
        duplicateReviewStatus: "PENDING",
        guardian: null,
        requestNote: null,
      }),
    );

    expect(checks.slice(0, 4)).toEqual([
      "Telefon bilgisi eksik",
      "E-posta bilgisi eksik",
      "Veli kaydı eksik",
      "Talep notu eksik",
    ]);
    expect(checks).toContain("Saat kesinleşmesi eksik");
    expect(checks).toContain("Mükerrer kontrolü eksik");
    expect(checks.some((check) => /^[ABC]$/.test(check))).toBe(false);
  });

  it("marks adult guardian and client appointment checks explicitly", () => {
    const checks = buildClientRecordChecks(
      makeClientRow({ appointments: [], guardians: [], type: "ADULT" }),
    );
    expect(checks).toContain("Yetişkin kaydı tamam");
    expect(checks).toContain("Planlanan randevu eksik");
  });
});

describe("buildNextSteps", () => {
  it("starts requested records at first review with three panel-backed steps", () => {
    const steps = buildNextSteps("REQUESTED");
    expect(steps).toHaveLength(3);
    expect(steps[0].state).toBe("active");
    expect(steps.slice(1).every((candidate) => candidate.state === "upcoming")).toBe(true);
    expect(steps.at(-1)?.detail).toContain("Panelden");
  });

  it("gives confirmed appointments only a supported status-tracking step", () => {
    const steps = buildNextSteps("CONFIRMED");
    expect(steps).toEqual([
      {
        detail: "Görüşme sonrasında panelden tamamlandı, gelmedi veya iptal durumunu seç.",
        due: "Görüşme sonrasında",
        state: "active",
        title: "Görüşme durumunu takip et",
      },
    ]);
    expect(JSON.stringify(steps)).not.toContain("notu şablonu");
    expect(JSON.stringify(steps)).not.toContain("özeti paylaş");
  });

  it("marks terminal statuses as closed instead of inventing follow-up work", () => {
    for (const status of ["REJECTED", "CANCELLED_BY_CLIENT", "NO_SHOW", "COMPLETED"] as const) {
      const steps = buildNextSteps(status);
      expect(steps).toHaveLength(1);
      expect(steps[0].state).toBe("done");
      expect(steps[0].due).toBe("Kapalı kayıt");
    }
  });
});

describe("mapAppointmentToHubRecord", () => {
  it("maps a full row into the Hub view model", () => {
    const record = mapAppointmentToHubRecord(makeRow(), now, timeZone);

    expect(record.id).toBe("apt-1");
    expect(record.name).toBe("Arya Işık");
    expect(record.reference).toBe("BA-2026-1001");
    expect(record.channel).toBe("Web formu");
    expect(record.stage).toBe("talep");
    expect(record.status).toBe("yeni");
    expect(record.group).toBe("bugun");
    expect(record.lastAction).toBe("Talep alındı");
    expect(record.lastActionAt).toBe("Bugün 09:24");
    expect(record.connections).toEqual([
      { name: "Deniz Işık", relation: "Veli" },
      { name: "Berfin Akbaş", relation: "Uygulayıcı" },
    ]);
    expect(record.readinessNotes).toContain("Telefon bilgisi tamam");
    expect(record).not.toHaveProperty("readinessGrade");
    expect(record).not.toHaveProperty("readinessScore");
    // Five of six checks pass (timing undecided while REQUESTED) → 83 / grade B.
    expect(record.score).toBe(83);
    expect(record.grade).toBe("B");
  });

  it("grades readiness from the proportion of passing checks", () => {
    const complete = mapAppointmentToHubRecord(
      makeRow({ approvedAt: new Date(), status: "CONFIRMED" }),
      now,
      timeZone,
    );
    expect(complete.score).toBe(100);
    expect(complete.grade).toBe("A");

    const sparse = mapAppointmentToHubRecord(
      makeRow({
        approvedAt: null,
        client: {
          email: null,
          firstName: "Arya",
          lastName: "Işık",
          phone: null,
          preferredName: null,
          type: "CHILD",
        },
        duplicateReviewStatus: "PENDING",
        guardian: null,
        requestNote: null,
        status: "REQUESTED",
      }),
      now,
      timeZone,
    );
    expect(sparse.score).toBe(0);
    expect(sparse.grade).toBe("C");
  });

  it("groups an old request under today when its latest status action happened today", () => {
    const record = mapAppointmentToHubRecord(
      makeRow({
        createdAt: new Date("2026-06-10T09:00:00+03:00"),
        status: "PENDING_REVIEW",
        statusLogs: [
          {
            createdAt: new Date("2026-07-06T10:30:00+03:00"),
            toStatus: "PENDING_REVIEW",
          },
          {
            createdAt: new Date("2026-06-10T09:00:00+03:00"),
            toStatus: "REQUESTED",
          },
        ],
      }),
      now,
      timeZone,
    );

    expect(record.group).toBe("bugun");
    expect(record.lastAction).toBe("Talep incelemeye alındı");
    expect(record.lastActionAt).toBe("Bugün 10:30");
  });

  it("maps every appointment status to a stage, chip and next step", () => {
    const statuses: readonly HubAppointmentStatus[] = [
      "REQUESTED",
      "PENDING_REVIEW",
      "CONFIRMED",
      "REJECTED",
      "RESCHEDULE_PROPOSED",
      "CANCELLED_BY_CLIENT",
      "CANCELLED_BY_PRACTITIONER",
      "COMPLETED",
      "NO_SHOW",
    ];
    for (const status of statuses) {
      const record = mapAppointmentToHubRecord(makeRow({ status }), now, timeZone);
      expect(record.stage).toBeTruthy();
      expect(record.status).toBeTruthy();
      expect(record.nextSteps.length).toBeGreaterThan(0);
    }
  });

  it("prefers preferredName and falls back to dashes for missing contact", () => {
    const record = mapAppointmentToHubRecord(
      makeRow({
        client: {
          email: null,
          firstName: "Arya",
          lastName: "Işık",
          phone: null,
          preferredName: "Arya",
          type: "CHILD",
        },
      }),
      now,
      timeZone,
    );
    expect(record.name).toBe("Arya");
    expect(record.contactEmail).toBe("—");
    expect(record.contactPhone).toBe("—");
  });
});

describe("mapClientToHubRecord", () => {
  it("maps the client to the existing query-param profile route", () => {
    const record = mapClientToHubRecord(makeClientRow(), now, timeZone);

    expect(record.kind).toBe("danisan");
    expect(record.status).toBe("aktif");
    expect(record.rawStatus).toBeNull();
    expect(record.profileHref).toBe("/yonetim/danisan-profili?clientId=client-1");
    expect(record.channel).toBe("Çocuk");
    expect(record.group).toBe("bugun");
    expect(record.connections).toEqual([{ name: "Gökçe Aksu", relation: "Annesi" }]);
    expect(record.plannedAt).not.toBe("—");
    expect(record.timeline[0]?.at).toMatch(/^(Cum|10 Tem)/);
  });

  it("uses the first ascending future appointment as the planned item", () => {
    const record = mapClientToHubRecord(
      makeClientRow({
        appointments: [
          {
            serviceNameSnapshot: "Yakın randevu",
            startsAt: new Date("2026-07-07T10:00:00+03:00"),
            status: "CONFIRMED",
          },
          {
            serviceNameSnapshot: "Uzak randevu",
            startsAt: new Date("2026-08-01T10:00:00+03:00"),
            status: "CONFIRMED",
          },
        ],
      }),
      now,
      timeZone,
    );
    expect(record.plannedAt).toContain("7 Tem");
  });

  it("maps prospective adults and empty appointment lists", () => {
    const record = mapClientToHubRecord(
      makeClientRow({ appointments: [], guardians: [], status: "PROSPECTIVE", type: "ADULT" }),
      now,
      timeZone,
    );
    expect(record.status).toBe("potansiyel");
    expect(record.plannedAt).toBe("—");
    expect(record.connections).toEqual([]);
  });

  it("does not invent work for inactive clients", () => {
    const record = mapClientToHubRecord(
      makeClientRow({ appointments: [], status: "INACTIVE" }),
      now,
      timeZone,
    );
    expect(record.nextSteps).toEqual([
      {
        detail: "Danışan kaydı pasif; yeniden etkinleştirilmedikçe işlem gerekmiyor.",
        due: "Kapalı kayıt",
        state: "done",
        title: "Açık işlem yok",
      },
    ]);
  });
});

describe("buildWeeklyAvailability", () => {
  it("orders days Monday-first and maps Sunday-indexed rules", () => {
    const days = buildWeeklyAvailability([
      {
        localEndTime: "12:00",
        localStartTime: "09:00",
        slotIncrementMinutes: 30,
        status: "ACTIVE",
        weekday: 1,
      },
      {
        localEndTime: "18:00",
        localStartTime: "14:00",
        slotIncrementMinutes: 45,
        status: "INACTIVE",
        weekday: 0,
      },
    ]);
    expect(days).toHaveLength(7);
    expect(days[0].label).toBe("Pazartesi");
    expect(days[0].slots).toEqual([{ active: true, increment: 30, range: "09:00–12:00" }]);
    expect(days[6].label).toBe("Pazar");
    expect(days[6].slots[0].active).toBe(false);
    expect(days[1].slots).toHaveLength(0);
  });
});
