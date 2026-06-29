import { describe, expect, it } from "vitest";

import { getAllowedAdminEmails, parseServerEnvironment } from "./env";

const validEnvironment = {
  APP_URL: "http://localhost:3000",
  AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  BUSINESS_TIME_ZONE: "Europe/Istanbul",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/berfinakbas",
  NODE_ENV: "test",
};

describe("parseServerEnvironment", () => {
  it("accepts a valid server environment", () => {
    expect(parseServerEnvironment(validEnvironment)).toMatchObject(validEnvironment);
  });

  it("rejects an invalid time zone", () => {
    expect(() =>
      parseServerEnvironment({ ...validEnvironment, BUSINESS_TIME_ZONE: "Istanbul" }),
    ).toThrow();
  });

  it("rejects a non-PostgreSQL database URL", () => {
    expect(() =>
      parseServerEnvironment({ ...validEnvironment, DATABASE_URL: "file:./database.sqlite" }),
    ).toThrow();
  });

  it("requires both Google OAuth values when one is present", () => {
    expect(() =>
      parseServerEnvironment({ ...validEnvironment, AUTH_GOOGLE_ID: "client-id" }),
    ).toThrow();
  });

  it("normalizes and deduplicates allowed admin emails", () => {
    const environment = parseServerEnvironment({
      ...validEnvironment,
      AUTH_ALLOWED_EMAILS: " INFO@EXAMPLE.COM, admin@example.com, info@example.com ",
    });

    expect([...getAllowedAdminEmails(environment)]).toEqual([
      "info@example.com",
      "admin@example.com",
    ]);
  });
});
