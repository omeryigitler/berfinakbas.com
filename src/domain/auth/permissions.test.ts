import { describe, expect, it } from "vitest";

import { hasPermission } from "./permissions";

describe("hasPermission", () => {
  it("grants every permission to a super admin", () => {
    expect(hasPermission(["SUPER_ADMIN"], "users:manage")).toBe(true);
    expect(hasPermission(["SUPER_ADMIN"], "finance:manage")).toBe(true);
  });

  it("keeps financial management away from assistants", () => {
    expect(hasPermission(["ASSISTANT"], "finance:manage")).toBe(false);
  });

  it("limits availability management to therapists and super admins", () => {
    expect(hasPermission(["THERAPIST"], "availability:manage")).toBe(true);
    expect(hasPermission(["SUPER_ADMIN"], "availability:manage")).toBe(true);
    expect(hasPermission(["ASSISTANT"], "availability:manage")).toBe(false);
    expect(hasPermission(["DEVELOPER"], "availability:read")).toBe(false);
  });

  it("combines permissions when a user has multiple roles", () => {
    expect(hasPermission(["THERAPIST", "FINANCE"], "finance:manage")).toBe(true);
  });

  it("denies users without a role", () => {
    expect(hasPermission([], "appointments:read")).toBe(false);
  });
});
