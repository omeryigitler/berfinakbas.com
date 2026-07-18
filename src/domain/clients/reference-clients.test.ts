import { describe, expect, it } from "vitest";

import { isReferenceClientId, referenceClientIds } from "./reference-clients";

describe("reference clients", () => {
  it("contains ten unique deterministic identifiers", () => {
    expect(referenceClientIds).toHaveLength(10);
    expect(new Set(referenceClientIds).size).toBe(10);
  });

  it("recognizes only seeded reference client identifiers", () => {
    expect(isReferenceClientId(referenceClientIds[0])).toBe(true);
    expect(isReferenceClientId("00000000-0000-4000-8000-000000000000")).toBe(false);
    expect(isReferenceClientId(null)).toBe(false);
  });
});
