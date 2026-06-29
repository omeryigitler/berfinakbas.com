import { describe, expect, it } from "vitest";

import {
  canUseGoogleAdminSignIn,
  isAllowedBootstrapAdmin,
  normalizeEmailAddress,
} from "./admin-access";

const allowedAdminEmails = new Set(["admin@example.com", "info@example.com"]);

describe("normalizeEmailAddress", () => {
  it("normalizes whitespace and casing without Turkish locale transformations", () => {
    expect(normalizeEmailAddress("  INFO@EXAMPLE.COM ")).toBe("info@example.com");
  });

  it("rejects missing and blank values", () => {
    expect(normalizeEmailAddress(null)).toBeNull();
    expect(normalizeEmailAddress("   ")).toBeNull();
  });
});

describe("canUseGoogleAdminSignIn", () => {
  it("allows a new user only when their normalized email is allowlisted", () => {
    expect(
      canUseGoogleAdminSignIn({
        allowedAdminEmails,
        email: " ADMIN@EXAMPLE.COM ",
        existingUserStatus: null,
        googleAuthConfigured: true,
      }),
    ).toBe(true);
    expect(
      canUseGoogleAdminSignIn({
        allowedAdminEmails,
        email: "unknown@example.com",
        existingUserStatus: null,
        googleAuthConfigured: true,
      }),
    ).toBe(false);
  });

  it("allows invited and active users without requiring the bootstrap allowlist", () => {
    for (const existingUserStatus of ["INVITED", "ACTIVE"] as const) {
      expect(
        canUseGoogleAdminSignIn({
          allowedAdminEmails,
          email: "invited@example.com",
          existingUserStatus,
          googleAuthConfigured: true,
        }),
      ).toBe(true);
    }
  });

  it("always denies suspended users and incomplete Google configuration", () => {
    expect(
      canUseGoogleAdminSignIn({
        allowedAdminEmails,
        email: "admin@example.com",
        existingUserStatus: "SUSPENDED",
        googleAuthConfigured: true,
      }),
    ).toBe(false);
    expect(
      canUseGoogleAdminSignIn({
        allowedAdminEmails,
        email: "admin@example.com",
        existingUserStatus: "ACTIVE",
        googleAuthConfigured: false,
      }),
    ).toBe(false);
  });
});

describe("isAllowedBootstrapAdmin", () => {
  it("matches a new admin using normalized email semantics", () => {
    expect(isAllowedBootstrapAdmin(" INFO@EXAMPLE.COM ", allowedAdminEmails)).toBe(true);
    expect(isAllowedBootstrapAdmin("other@example.com", allowedAdminEmails)).toBe(false);
  });
});
