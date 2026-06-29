import { describe, expect, it } from "vitest";

import { assertAppointmentTransition, canTransitionAppointment } from "./appointment-status";

describe("appointment status transitions", () => {
  it("allows the controlled request approval flow", () => {
    expect(canTransitionAppointment("requested", "pending_review")).toBe(true);
    expect(canTransitionAppointment("pending_review", "confirmed")).toBe(true);
    expect(canTransitionAppointment("confirmed", "completed")).toBe(true);
  });

  it("rejects a direct request-to-confirmed transition", () => {
    expect(canTransitionAppointment("requested", "confirmed")).toBe(false);
    expect(() => assertAppointmentTransition("requested", "confirmed")).toThrow(
      "Geçersiz randevu durum geçişi",
    );
  });

  it("keeps terminal states terminal", () => {
    expect(canTransitionAppointment("completed", "confirmed")).toBe(false);
    expect(canTransitionAppointment("rejected", "pending_review")).toBe(false);
  });
});
