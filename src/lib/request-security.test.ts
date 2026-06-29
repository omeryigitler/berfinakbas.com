import { describe, expect, it } from "vitest";

import { getSafeCorrelationId, hasTrustedOrigin } from "./request-security";

describe("hasTrustedOrigin", () => {
  it("accepts the configured application origin", () => {
    expect(hasTrustedOrigin("https://berfinakbas.com", "https://berfinakbas.com/path")).toBe(true);
  });

  it("rejects missing and foreign origins", () => {
    expect(hasTrustedOrigin(null, "https://berfinakbas.com")).toBe(false);
    expect(hasTrustedOrigin("https://example.com", "https://berfinakbas.com")).toBe(false);
  });
});

describe("getSafeCorrelationId", () => {
  it("keeps a bounded safe identifier and replaces untrusted values", () => {
    expect(getSafeCorrelationId("request-123:retry.1")).toBe("request-123:retry.1");
    expect(getSafeCorrelationId("contains spaces and\nnewlines")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f-]{27}$/,
    );
    expect(getSafeCorrelationId("x".repeat(81))).not.toBe("x".repeat(81));
  });
});
