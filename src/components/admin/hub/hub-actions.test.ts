import { describe, expect, it } from "vitest";

import {
  canTransitionAppointment,
  type AppointmentStatus,
} from "@/domain/booking/appointment-status";

import { buildHubStatusUrl, getHubActions } from "./hub-actions";
import type { HubAppointmentStatus } from "./hub-data";

const allStatuses: readonly HubAppointmentStatus[] = [
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

function toDomain(status: HubAppointmentStatus): AppointmentStatus {
  return status.toLowerCase() as AppointmentStatus;
}

describe("getHubActions", () => {
  it("only offers transitions the domain state machine allows", () => {
    for (const status of allStatuses) {
      for (const action of getHubActions(status, true)) {
        expect(
          canTransitionAppointment(toDomain(status), toDomain(action.toStatus)),
          `${status} -> ${action.toStatus} should be a legal transition`,
        ).toBe(true);
      }
    }
  });

  it("offers nothing for terminal statuses", () => {
    for (const status of [
      "REJECTED",
      "COMPLETED",
      "NO_SHOW",
      "CANCELLED_BY_CLIENT",
      "CANCELLED_BY_PRACTITIONER",
    ] as const) {
      expect(getHubActions(status, true)).toHaveLength(0);
    }
  });

  it("offers approve/reject on reviewable and confirmed follow-ups on confirmed", () => {
    expect(getHubActions("REQUESTED", true).map((action) => action.id)).toEqual(["review"]);
    expect(getHubActions("PENDING_REVIEW", true).map((action) => action.id)).toEqual([
      "confirm",
      "reject",
    ]);
    expect(getHubActions("CONFIRMED", true).map((action) => action.id)).toEqual([
      "complete",
      "no-show",
      "cancel",
    ]);
  });

  it("returns nothing without manage permission", () => {
    for (const status of allStatuses) {
      expect(getHubActions(status, false)).toHaveLength(0);
    }
  });
});

describe("buildHubStatusUrl", () => {
  it("targets the admin status endpoint and escapes the id", () => {
    expect(buildHubStatusUrl("abc-123")).toBe("/api/admin/appointments/abc-123/status");
    expect(buildHubStatusUrl("a/b")).toBe("/api/admin/appointments/a%2Fb/status");
  });
});
