import { describe, expect, it } from "vitest";

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
