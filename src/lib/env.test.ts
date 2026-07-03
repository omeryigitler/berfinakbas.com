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
    expect(parseServerEnvironment(validEnvironment)).toMatchObject({
      ...validEnvironment,
      BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: [],
      PUBLIC_APPOINTMENT_HOLDS_ENABLED: false,
      PUBLIC_APPOINTMENT_REQUESTS_ENABLED: false,
      PUBLIC_APPOINTMENT_SLOTS_ENABLED: false,
      PUBLIC_BOOKING_FLOW_ENABLED: false,
    });
  });

  it("keeps public appointment requests disabled by default", () => {
    expect(parseServerEnvironment(validEnvironment).PUBLIC_APPOINTMENT_HOLDS_ENABLED).toBe(false);
    expect(parseServerEnvironment(validEnvironment).PUBLIC_APPOINTMENT_REQUESTS_ENABLED).toBe(
      false,
    );
    expect(parseServerEnvironment(validEnvironment).PUBLIC_APPOINTMENT_SLOTS_ENABLED).toBe(false);
    expect(parseServerEnvironment(validEnvironment).PUBLIC_BOOKING_FLOW_ENABLED).toBe(false);
  });

  it("keeps hold duration unset until an explicit server value is approved", () => {
    expect(parseServerEnvironment(validEnvironment).BOOKING_HOLD_DURATION_MINUTES).toBeUndefined();
    expect(
      parseServerEnvironment({
        ...validEnvironment,
        BOOKING_HOLD_DURATION_MINUTES: "8",
      }).BOOKING_HOLD_DURATION_MINUTES,
    ).toBe(8);
    expect(
      parseServerEnvironment({
        ...validEnvironment,
        BOOKING_PUBLIC_PRACTITIONER_ID: "11111111-1111-4111-8111-111111111111",
      }).BOOKING_PUBLIC_PRACTITIONER_ID,
    ).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("rejects invalid hold duration settings", () => {
    for (const value of ["0", "1.5", "1441", "not-a-number"]) {
      expect(() =>
        parseServerEnvironment({
          ...validEnvironment,
          BOOKING_HOLD_DURATION_MINUTES: value,
        }),
      ).toThrow();
    }
  });

  it("parses the public request switch and configured explicit consent types", () => {
    const environment = parseServerEnvironment({
      ...validEnvironment,
      BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES:
        "EXPLICIT_CONSENT_RESEARCH, EXPLICIT_CONSENT_RECORDING",
      PUBLIC_APPOINTMENT_HOLDS_ENABLED: "true",
      PUBLIC_APPOINTMENT_REQUESTS_ENABLED: "true",
      PUBLIC_APPOINTMENT_SLOTS_ENABLED: "true",
      PUBLIC_BOOKING_FLOW_ENABLED: "true",
    });

    expect(environment.PUBLIC_APPOINTMENT_HOLDS_ENABLED).toBe(true);
    expect(environment.PUBLIC_APPOINTMENT_REQUESTS_ENABLED).toBe(true);
    expect(environment.PUBLIC_APPOINTMENT_SLOTS_ENABLED).toBe(true);
    expect(environment.PUBLIC_BOOKING_FLOW_ENABLED).toBe(true);
    expect(environment.BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES).toEqual([
      "EXPLICIT_CONSENT_RESEARCH",
      "EXPLICIT_CONSENT_RECORDING",
    ]);
  });

  it("rejects duplicate or malformed explicit consent document types", () => {
    expect(() =>
      parseServerEnvironment({
        ...validEnvironment,
        BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: "EXPLICIT_CONSENT,EXPLICIT_CONSENT",
      }),
    ).toThrow();
    expect(() =>
      parseServerEnvironment({
        ...validEnvironment,
        BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: "not-valid",
      }),
    ).toThrow();
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
