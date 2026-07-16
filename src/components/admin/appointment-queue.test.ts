import { describe, expect, it } from "vitest";

import {
  buildAppointmentDecisionBody,
  buildAppointmentListUrl,
  buildAppointmentStatusUrl,
  buildDuplicateReviewUrl,
} from "./appointment-queue";

describe("appointment queue request builders", () => {
  it("loads requested and pending-review items through one bounded queue", () => {
    expect(buildAppointmentListUrl(null)).toBe(
      "/api/admin/appointments?status=REQUESTED%2CPENDING_REVIEW&take=25",
    );
    expect(buildAppointmentListUrl("11111111-1111-4111-8111-111111111111")).toContain(
      "cursor=11111111-1111-4111-8111-111111111111",
    );
  });

  it("builds encoded mutation URLs and explicit review transitions", () => {
    expect(buildAppointmentStatusUrl("id/with/slash")).toBe(
      "/api/admin/appointments/id%2Fwith%2Fslash/status",
    );
    expect(buildDuplicateReviewUrl("id/with/slash")).toBe(
      "/api/admin/appointments/id%2Fwith%2Fslash/duplicate-review",
    );
    expect(buildAppointmentDecisionBody("review")).toEqual({
      reasonCode: "ADMIN_REVIEW_STARTED",
      toStatus: "PENDING_REVIEW",
    });
  });
});
