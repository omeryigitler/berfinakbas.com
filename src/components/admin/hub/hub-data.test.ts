import { describe, expect, it } from "vitest";

import * as hubDataModule from "./hub-data";
import {
  buildNextSteps,
  formatRelativeStamp,
  mapAppointmentToHubRecord,
  resolveGroup,
  scoreReadiness,
  type HubAppointmentRow,
  type HubAppointmentStatus,
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

describe("formatRelativeStamp", () => {
  it("labels same-day, yesterday, this-week and older dates", () => {
    expect(formatRelativeStamp(new Date("2026-07-06T09:24:00+03:00"), now, timeZone)).toBe(
      "Bugün 09:24",
    );
    expect(formatRelativeStamp(new Date("2026-07-05T23:30:00+03:00"), now, timeZone)).toBe(
      "Dün 23:30",
    );
    expect(formatRelativeStamp(new Date("2026-07-01T15:05:00+03:00"), now, timeZone)).toMatch(
      /^Çar 15:05$/,
    );
    expect(formatRelativeStamp(new Date("2026-06-01T10:00:00+03:00"), now, timeZone)).toBe("1 Haz");
  });

  it("respects the business time zone at day boundaries", () => {
    // 23:30 UTC on the 5th is already 02:30 on the 6th in Istanbul.
    expect(formatRelativeStamp(new Date("2026-07-05T23:30:00Z"), now, timeZone)).toBe(
      "Bugün 02:30",
    );
  });
});

describe("resolveGroup", () => {
  it("buckets by day difference in the business time zone", () => {
    expect(resolveGroup(new Date("2026-07-06T00:10:00+03:00"), now, timeZone)).toBe("bugun");
    expect(resolveGroup(new Date("2026-07-01T10:00:00+03:00"), now, timeZone)).toBe("buHafta");
    expect(resolveGroup(new Date("2026-06-29T10:00:00+03:00"), now, timeZone)).toBe("dahaEski");
  });
});

describe("scoreReadiness", () => {
  it("scores a complete confirmed child request as grade A", () => {
    const { grade, score } = scoreReadiness(
      makeRow({ approvedAt: new Date(), status: "CONFIRMED" }),
    );
    expect(score).toBe(100);
    expect(grade).toBe("A");
  });

  it("penalises missing contact, note and unresolved duplicate review", () => {
    const { grade, notes, score } = scoreReadiness(
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
        requestNote: null,
      }),
    );
    expect(score).toBe(25);
    expect(grade).toBe("C");
    expect(notes[0]).toContain("eksik");
  });

  it("auto-passes the guardian check for adults", () => {
    const { score } = scoreReadiness(
      makeRow({
        client: {
          email: "a@b.dev",
          firstName: "Cem",
          lastName: "Yalın",
          phone: "05000000003",
          preferredName: null,
          type: "ADULT",
        },
        guardian: null,
      }),
    );
    expect(score).toBe(80);
  });
});

describe("buildNextSteps", () => {
  it("starts requested records at first review with three steps", () => {
    const steps = buildNextSteps("REQUESTED");
    expect(steps).toHaveLength(3);
    expect(steps[0].state).toBe("active");
    expect(steps.slice(1).every((candidate) => candidate.state === "upcoming")).toBe(true);
  });

  it("gives terminal statuses a single closing step", () => {
    for (const status of ["REJECTED", "CANCELLED_BY_CLIENT", "NO_SHOW"] as const) {
      const steps = buildNextSteps(status);
      expect(steps).toHaveLength(1);
      expect(steps[0].state).toBe("active");
    }
  });
});

describe("mapAppointmentToHubRecord", () => {
  it("maps a full row into the hub view model", () => {
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
    expect(record.timeline.at(-1)).toEqual({
      at: "Bugün 09:24",
      label: "Talep kaydı oluşturuldu",
    });
  });

  it("maps every appointment status to a stage and chip", () => {
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
  const { mapClientToHubRecord, scoreClientReadiness } = hubDataModule;

  function makeClientRow(overrides = {}) {
    return {
      appointments: [
        {
          serviceNameSnapshot: "Ses terapisi",
          startsAt: new Date("2026-07-10T10:00:00+03:00"),
          status: "CONFIRMED" as const,
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
      status: "ACTIVE" as const,
      type: "CHILD" as const,
      updatedAt: new Date("2026-07-06T09:00:00+03:00"),
      ...overrides,
    };
  }

  it("maps a client row into a danisan hub record", () => {
    const record = mapClientToHubRecord(makeClientRow(), now, timeZone);

    expect(record.kind).toBe("danisan");
    expect(record.status).toBe("aktif");
    expect(record.rawStatus).toBeNull();
    expect(record.profileHref).toBe("/yonetim/danisan-profili/client-1");
    expect(record.channel).toBe("Çocuk");
    expect(record.group).toBe("bugun");
    expect(record.connections).toEqual([{ name: "Gökçe Aksu", relation: "Annesi" }]);
    expect(record.plannedAt).not.toBe("—");
    expect(record.timeline.at(-1)?.label).toBe("Danışan kaydı oluşturuldu");
  });

  it("maps prospective/inactive statuses and empty history", () => {
    const record = mapClientToHubRecord(
      makeClientRow({ appointments: [], guardians: [], status: "PROSPECTIVE", type: "ADULT" }),
      now,
      timeZone,
    );
    expect(record.status).toBe("potansiyel");
    expect(record.plannedAt).toBe("—");
    expect(record.connections).toEqual([]);
  });

  it("scores completeness with 25-point weights", () => {
    expect(scoreClientReadiness(makeClientRow()).score).toBe(100);
    expect(
      scoreClientReadiness(makeClientRow({ appointments: [], email: null, phone: null })).score,
    ).toBe(25);
    expect(scoreClientReadiness(makeClientRow({ guardians: [], type: "ADULT" })).score).toBe(100);
  });
});

describe("buildWeeklyAvailability", () => {
  const { buildWeeklyAvailability } = hubDataModule;

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

describe("buildFinanceSummary", () => {
  const { buildFinanceSummary } = hubDataModule;

  it("sums current-month payments/accruals and renders display strings", () => {
    const summary = buildFinanceSummary(
      [
        {
          amountMinor: 150000n,
          client: { firstName: "Cem", lastName: "Yalın", preferredName: null },
          currency: "TRY",
          id: "fin-1",
          occurredAt: new Date("2026-07-03T10:00:00+03:00"),
          type: "PAYMENT",
        },
        {
          amountMinor: 200000n,
          client: { firstName: "Duru", lastName: "Aksu", preferredName: null },
          currency: "TRY",
          id: "fin-2",
          occurredAt: new Date("2026-07-01T10:00:00+03:00"),
          type: "ACCRUAL",
        },
        {
          amountMinor: 99900n,
          client: { firstName: "Eski", lastName: "Kayıt", preferredName: null },
          currency: "TRY",
          id: "fin-3",
          occurredAt: new Date("2026-06-01T10:00:00+03:00"),
          type: "PAYMENT",
        },
      ],
      now,
      timeZone,
    );
    expect(summary.monthPaymentLabel).toContain("1 kayıt");
    expect(summary.monthPaymentLabel).toContain("1.500,00");
    expect(summary.monthAccrualLabel).toContain("2.000,00");
    expect(summary.entries[0]).toMatchObject({ clientName: "Cem Yalın", typeLabel: "Ödeme" });
    expect(summary.entries[0].amountLabel).toContain("1.500,00");
  });

  it("handles an empty ledger", () => {
    const summary = buildFinanceSummary([], now, timeZone);
    expect(summary.entries).toHaveLength(0);
    expect(summary.monthPaymentLabel).toContain("0 kayıt");
  });
});
