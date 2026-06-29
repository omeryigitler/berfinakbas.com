import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AppointmentQueue,
  buildAppointmentListUrl,
  formatAppointmentDate,
} from "./appointment-queue";

describe("appointment queue presentation", () => {
  it("builds a bounded pending-review request URL", () => {
    expect(buildAppointmentListUrl(null)).toBe(
      "/api/admin/appointments?status=PENDING_REVIEW&take=25",
    );
    expect(buildAppointmentListUrl("11111111-1111-4111-8111-111111111111")).toContain(
      "cursor=11111111-1111-4111-8111-111111111111",
    );
  });

  it("formats UTC appointment time in the configured business time zone", () => {
    expect(formatAppointmentDate("2031-07-01T09:00:00.000Z", "Europe/Istanbul")).toContain("12:00");
  });

  it("renders an accessible loading state before requesting personal data", () => {
    const markup = renderToStaticMarkup(
      createElement(AppointmentQueue, { businessTimeZone: "Europe/Istanbul" }),
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain("Bekleyen talepler yükleniyor");
  });
});
