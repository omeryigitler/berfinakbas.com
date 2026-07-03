import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock } = vi.hoisted(() => ({ getDatabaseMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import { BookingRequestConflictError } from "@/lib/booking/appointment-request-service";
import {
  publicBookingSubmissionPayloadSchema,
  resolveRequiredPublicConsentDocuments,
  submitPublicBookingRequest,
} from "@/lib/booking/public-booking-service";

const now = new Date("2031-07-01T08:00:00.000Z");
const basePayload = {
  acknowledgedDocumentIds: [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ],
  holdId: "33333333-3333-4333-8333-333333333333",
  holderToken: "synthetic-holder-token-that-is-long-enough",
};

beforeEach(() => {
  vi.clearAllMocks();
});

function document(
  overrides: Partial<{
    effectiveFrom: Date;
    id: string;
    publicContent: string | null;
    publicTitle: string | null;
    retiredAt: Date | null;
    type: string;
  }> = {},
) {
  return {
    contentHash: "synthetic-hash",
    effectiveFrom: new Date("2031-01-01T00:00:00.000Z"),
    id: "11111111-1111-4111-8111-111111111111",
    publicContent: "Synthetic approved presentation content.",
    publicTitle: "Synthetic document",
    retiredAt: null,
    type: "PRIVACY_NOTICE",
    version: "test-v1",
    ...overrides,
  };
}

describe("publicBookingSubmissionPayloadSchema", () => {
  it("accepts minimum adult contact data and normalizes an empty optional email", () => {
    const result = publicBookingSubmissionPayloadSchema.parse({
      ...basePayload,
      subject: {
        email: "",
        firstName: " Test ",
        lastName: " Adult ",
        phone: "+90 555 000 00 00",
        type: "ADULT",
      },
    });

    expect(result.subject).toEqual({
      email: undefined,
      firstName: "Test",
      lastName: "Adult",
      phone: "+90 555 000 00 00",
      type: "ADULT",
    });
  });

  it("requires declared guardian contact for a child", () => {
    const result = publicBookingSubmissionPayloadSchema.safeParse({
      ...basePayload,
      subject: { firstName: "Test", lastName: "Child", type: "CHILD" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown clinical, identity-document, and request-note fields", () => {
    for (const extra of [
      { clinicalHistory: "not accepted" },
      { identityNumber: "not accepted" },
      { requestNote: "not accepted" },
    ]) {
      expect(
        publicBookingSubmissionPayloadSchema.safeParse({
          ...basePayload,
          ...extra,
          subject: {
            firstName: "Test",
            lastName: "Adult",
            phone: "+90 555 000 00 00",
            type: "ADULT",
          },
        }).success,
      ).toBe(false);
    }
  });
});

describe("resolveRequiredPublicConsentDocuments", () => {
  it("returns exactly one current document per required type in policy order", () => {
    const terms = document({
      id: "22222222-2222-4222-8222-222222222222",
      publicTitle: "Synthetic booking terms",
      type: "BOOKING_TERMS",
    });

    const result = resolveRequiredPublicConsentDocuments(
      [terms, document()],
      ["PRIVACY_NOTICE", "BOOKING_TERMS"],
      now,
    );

    expect(result.map((item) => item.type)).toEqual(["PRIVACY_NOTICE", "BOOKING_TERMS"]);
  });

  it("fails closed for missing, overlapping, retired, or unpublished document content", () => {
    const cases = [
      [],
      [document(), document({ id: "99999999-9999-4999-8999-999999999999" })],
      [document({ retiredAt: now })],
      [document({ publicContent: null, publicTitle: null })],
    ];

    for (const documents of cases) {
      expect(() =>
        resolveRequiredPublicConsentDocuments(documents, ["PRIVACY_NOTICE"], now),
      ).toThrow(BookingResourceUnavailableError);
    }
  });
});

describe("submitPublicBookingRequest", () => {
  it("maps an exhausted Prisma transaction conflict to a safe booking conflict", async () => {
    const transactionConflict = Object.assign(
      new Error("Transaction failed due to a write conflict or a deadlock"),
      { code: "P2034" },
    );
    const transaction = vi.fn().mockRejectedValue(transactionConflict);
    getDatabaseMock.mockReturnValue({ $transaction: transaction });

    await expect(
      submitPublicBookingRequest(
        {
          ...basePayload,
          correlationId: "public-booking-retry-test",
          subject: {
            firstName: "Test",
            lastName: "Adult",
            phone: "+90 555 000 00 00",
            type: "ADULT",
          },
        },
        { publicPractitionerId: "44444444-4444-4444-8444-444444444444" },
      ),
    ).rejects.toBeInstanceOf(BookingRequestConflictError);
    expect(transaction).toHaveBeenCalledTimes(3);
  });
});
