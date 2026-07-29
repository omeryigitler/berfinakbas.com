import { describe, expect, it } from "vitest";

import { canAccessAppointmentCompletionPlans } from "./appointment-completion-policy";

describe("canAccessAppointmentCompletionPlans", () => {
  it("does not expose plan data to assistants", () => {
    expect(canAccessAppointmentCompletionPlans(["ASSISTANT"])).toBe(false);
  });

  it("allows roles with finance read permission", () => {
    expect(canAccessAppointmentCompletionPlans(["THERAPIST"])).toBe(true);
    expect(canAccessAppointmentCompletionPlans(["FINANCE"])).toBe(true);
    expect(canAccessAppointmentCompletionPlans(["SUPER_ADMIN"])).toBe(true);
  });
});
