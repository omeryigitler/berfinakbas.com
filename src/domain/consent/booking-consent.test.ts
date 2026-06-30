import { describe, expect, it } from "vitest";

import {
  assertBookingConsentGate,
  BookingConsentGateError,
  evaluateBookingConsentGate,
  type BookingConsentRecord,
} from "./booking-consent";

const clientId = "11111111-1111-4111-8111-111111111111";
const guardianId = "22222222-2222-4222-8222-222222222222";

function records(grantor: string | null): BookingConsentRecord[] {
  return [
    {
      documentType: "PRIVACY_NOTICE",
      grantedByGuardianId: grantor,
      status: "GRANTED",
      subjectClientId: clientId,
    },
    {
      documentType: "BOOKING_TERMS",
      grantedByGuardianId: grantor,
      status: "GRANTED",
      subjectClientId: clientId,
    },
  ];
}

describe("booking consent gate", () => {
  it("accepts an adult with separate required acknowledgements", () => {
    expect(
      evaluateBookingConsentGate(
        { clientId, clientType: "ADULT", consentRecords: records(null) },
        "CONFIRM",
      ),
    ).toEqual([]);
  });

  it("rejects guardian data for an adult", () => {
    expect(
      evaluateBookingConsentGate(
        { clientId, clientType: "ADULT", consentRecords: records(null), guardianId },
        "REQUEST",
      ),
    ).toContainEqual({ code: "ADULT_GUARDIAN_NOT_ALLOWED" });
  });

  it("allows a declared guardian at request but requires verification before confirmation", () => {
    const input = {
      clientId,
      clientType: "CHILD" as const,
      consentRecords: records(guardianId),
      guardianId,
    };

    expect(evaluateBookingConsentGate(input, "REQUEST")).toEqual([]);
    expect(evaluateBookingConsentGate(input, "CONFIRM")).toContainEqual({
      code: "GUARDIAN_AUTHORITY_UNVERIFIED",
    });
  });

  it("accepts a verified guardian for child confirmation", () => {
    expect(
      evaluateBookingConsentGate(
        {
          clientId,
          clientType: "CHILD",
          consentRecords: records(guardianId),
          guardianAuthorityVerifiedAt: new Date("2031-01-01T00:00:00.000Z"),
          guardianId,
        },
        "CONFIRM",
      ),
    ).toEqual([]);
  });

  it("rejects a child record captured by another guardian", () => {
    expect(
      evaluateBookingConsentGate(
        {
          clientId,
          clientType: "CHILD",
          consentRecords: records("33333333-3333-4333-8333-333333333333"),
          guardianId,
        },
        "REQUEST",
      ),
    ).toContainEqual({ code: "DOCUMENT_GRANTOR_MISMATCH", documentType: "PRIVACY_NOTICE" });
  });

  it("requires configured explicit-consent documents separately", () => {
    expect(
      evaluateBookingConsentGate(
        {
          clientId,
          clientType: "ADULT",
          consentRecords: records(null),
          requiredExplicitConsentDocumentTypes: ["HEALTH_DATA_EXPLICIT_CONSENT"],
        },
        "REQUEST",
      ),
    ).toContainEqual({
      code: "MISSING_DOCUMENT",
      documentType: "HEALTH_DATA_EXPLICIT_CONSENT",
    });
  });

  it("treats withdrawn records as missing and exposes safe structured issues", () => {
    const consentRecords = records(null).map((record) =>
      record.documentType === "PRIVACY_NOTICE"
        ? { ...record, status: "WITHDRAWN" as const }
        : record,
    );

    expect(() =>
      assertBookingConsentGate({ clientId, clientType: "ADULT", consentRecords }, "REQUEST"),
    ).toThrowError(
      expect.objectContaining<Partial<BookingConsentGateError>>({
        code: "BOOKING_CONSENT_GATE_FAILED",
        issues: [{ code: "MISSING_DOCUMENT", documentType: "PRIVACY_NOTICE" }],
      }),
    );
  });
});
