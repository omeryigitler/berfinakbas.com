import { describe, expect, it } from "vitest";

import {
  canAccessAppointmentCompletionPlans,
  getVisibleConsumedPlanId,
} from "./appointment-completion-policy";

describe("appointment completion finance policy", () => {
  it("does not expose plan data to assistants", () => {
    expect(canAccessAppointmentCompletionPlans(["ASSISTANT"])).toBe(false);
  });

  it("allows roles with finance read permission", () => {
    expect(canAccessAppointmentCompletionPlans(["THERAPIST"])).toBe(true);
    expect(canAccessAppointmentCompletionPlans(["FINANCE"])).toBe(true);
    expect(canAccessAppointmentCompletionPlans(["SUPER_ADMIN"])).toBe(true);
  });

  it("masks consumed plan ids from assistants, including replay responses", () => {
    expect(
      getVisibleConsumedPlanId(["ASSISTANT"], "11111111-1111-4111-8111-111111111111"),
    ).toBeNull();
  });

  it("keeps consumed plan ids visible for finance-authorized roles", () => {
    const planId = "11111111-1111-4111-8111-111111111111";
    expect(getVisibleConsumedPlanId(["THERAPIST"], planId)).toBe(planId);
    expect(getVisibleConsumedPlanId(["FINANCE"], planId)).toBe(planId);
    expect(getVisibleConsumedPlanId(["SUPER_ADMIN"], planId)).toBe(planId);
  });
});
