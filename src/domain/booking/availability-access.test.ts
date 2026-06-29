import { describe, expect, it } from "vitest";

import { canAccessPractitionerAvailability } from "./availability-access";

describe("canAccessPractitionerAvailability", () => {
  it("allows a therapist to manage only their own practitioner calendar", () => {
    expect(
      canAccessPractitionerAvailability({
        mode: "manage",
        practitionerUserId: "user-1",
        roles: ["THERAPIST"],
        userId: "user-1",
      }),
    ).toBe(true);
    expect(
      canAccessPractitionerAvailability({
        mode: "manage",
        practitionerUserId: "user-2",
        roles: ["THERAPIST"],
        userId: "user-1",
      }),
    ).toBe(false);
  });

  it("allows a super admin to access another practitioner's calendar", () => {
    expect(
      canAccessPractitionerAvailability({
        mode: "read",
        practitionerUserId: "user-2",
        roles: ["SUPER_ADMIN"],
        userId: "admin-1",
      }),
    ).toBe(true);
  });

  it("denies assistants and developers even if identifiers happen to match", () => {
    for (const role of ["ASSISTANT", "DEVELOPER"] as const) {
      expect(
        canAccessPractitionerAvailability({
          mode: "read",
          practitionerUserId: "user-1",
          roles: [role],
          userId: "user-1",
        }),
      ).toBe(false);
    }
  });
});
