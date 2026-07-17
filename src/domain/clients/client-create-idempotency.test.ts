import { describe, expect, it } from "vitest";

import {
  matchesClientCreateReplay,
  type StoredClientCreateReplay,
} from "./client-create-idempotency";
import { createClientPayloadSchema, type CreateClientPayload } from "./client-management";

const requestId = "b561341f-4392-4d3d-9f79-778d9bd84dd6";
const guardianId = "773877c1-45a4-4402-a4cc-5840f7c959bf";

function adultPayload(overrides: Partial<CreateClientPayload> = {}): CreateClientPayload {
  return {
    birthYear: 1988,
    email: "omer@example.com",
    firstName: "Ömer",
    guardianEmail: null,
    guardianFirstName: null,
    guardianId: null,
    guardianLastName: null,
    guardianMode: null,
    guardianPhone: null,
    lastName: "Yiğitler",
    phone: "+35699999999",
    preferredName: null,
    relationship: null,
    requestId,
    status: "ACTIVE",
    type: "ADULT",
    ...overrides,
  };
}

function storedAdult(overrides: Partial<StoredClientCreateReplay> = {}): StoredClientCreateReplay {
  return {
    birthYear: 1988,
    email: "omer@example.com",
    firstName: "Ömer",
    guardians: [],
    lastName: "Yiğitler",
    phone: "+35699999999",
    preferredName: null,
    status: "ACTIVE",
    type: "ADULT",
    ...overrides,
  };
}

function childPayload(overrides: Partial<CreateClientPayload> = {}): CreateClientPayload {
  return {
    ...adultPayload(),
    birthYear: 2018,
    email: null,
    firstName: "Duru",
    guardianEmail: "veli@example.com",
    guardianFirstName: "Deniz",
    guardianId,
    guardianLastName: "Aksu",
    guardianMode: "EXISTING",
    guardianPhone: "+905000000000",
    lastName: "Aksu",
    phone: null,
    relationship: "Annesi",
    type: "CHILD",
    ...overrides,
  };
}

function storedChild(overrides: Partial<StoredClientCreateReplay> = {}): StoredClientCreateReplay {
  return {
    birthYear: 2018,
    email: null,
    firstName: "Duru",
    guardians: [
      {
        guardian: {
          email: "veli@example.com",
          firstName: "Deniz",
          lastName: "Aksu",
          phone: "+905000000000",
        },
        guardianId,
        relationship: "Annesi",
      },
    ],
    lastName: "Aksu",
    phone: null,
    preferredName: null,
    status: "ACTIVE",
    type: "CHILD",
    ...overrides,
  };
}

describe("client creation idempotency", () => {
  it("requires a request identity in the create schema", () => {
    const { requestId: _requestId, ...withoutRequestId } = adultPayload();
    const result = createClientPayloadSchema.safeParse(withoutRequestId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "requestId")).toBe(true);
    }
  });

  it("accepts a valid request identity", () => {
    const result = createClientPayloadSchema.safeParse(adultPayload());
    expect(result.success).toBe(true);
  });

  it("replays an identical adult request", () => {
    expect(matchesClientCreateReplay(storedAdult(), adultPayload())).toBe(true);
  });

  it("rejects a reused request identity when client data changed", () => {
    expect(matchesClientCreateReplay(storedAdult(), adultPayload({ lastName: "Değişti" }))).toBe(
      false,
    );
  });

  it("matches an existing guardian by id and relationship even with multiple relations", () => {
    const stored = storedChild({
      guardians: [
        {
          guardian: {
            email: null,
            firstName: "Başka",
            lastName: "Veli",
            phone: "+905111111111",
          },
          guardianId: "f7a94278-522c-4424-8680-38c271f7547e",
          relationship: "Babası",
        },
        ...storedChild().guardians,
      ],
    });

    expect(matchesClientCreateReplay(stored, childPayload())).toBe(true);
    expect(matchesClientCreateReplay(stored, childPayload({ relationship: "Bakım veren" }))).toBe(
      false,
    );
  });

  it("matches a newly created guardian by persisted fields", () => {
    expect(
      matchesClientCreateReplay(
        storedChild(),
        childPayload({ guardianId: null, guardianMode: "NEW" }),
      ),
    ).toBe(true);
    expect(
      matchesClientCreateReplay(
        storedChild(),
        childPayload({
          guardianFirstName: "Farklı",
          guardianId: null,
          guardianMode: "NEW",
        }),
      ),
    ).toBe(false);
  });
});
