import { describe, expect, it } from "vitest";

import {
  getMonogram,
  getMonogramColors,
  getStageIndex,
  groupRecords,
  hubRecords,
  hubStages,
} from "./hub-model";

describe("getMonogram", () => {
  it("returns first and last initials upper-cased with Turkish rules", () => {
    expect(getMonogram("arya ışık")).toBe("AI");
    expect(getMonogram("irem içli")).toBe("İİ");
    expect(getMonogram("Cem Yalın")).toBe("CY");
  });

  it("handles single names and empty input", () => {
    expect(getMonogram("Duru")).toBe("D");
    expect(getMonogram("   ")).toBe("•");
  });
});

describe("getMonogramColors", () => {
  it("is deterministic for the same name", () => {
    expect(getMonogramColors("Arya Işık")).toEqual(getMonogramColors("Arya Işık"));
  });

  it("returns a two-stop gradient pair", () => {
    const [from, to] = getMonogramColors("Baran Toprak");
    expect(from).toMatch(/^#/);
    expect(to).toMatch(/^#/);
  });
});

describe("groupRecords", () => {
  it("orders buckets bugun, buHafta, dahaEski and drops empty ones", () => {
    const buckets = groupRecords(hubRecords);
    expect(buckets.map((bucket) => bucket.group)).toEqual(["bugun", "buHafta", "dahaEski"]);
    for (const bucket of buckets) {
      expect(bucket.items.length).toBeGreaterThan(0);
      for (const item of bucket.items) {
        expect(item.group).toBe(bucket.group);
      }
    }
  });
});

describe("getStageIndex", () => {
  it("maps every stage to its pipeline position", () => {
    hubStages.forEach((stage, index) => {
      expect(getStageIndex(stage.id)).toBe(index);
    });
  });
});
