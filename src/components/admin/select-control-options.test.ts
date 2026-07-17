import { describe, expect, it } from "vitest";

import {
  filterSelectOptions,
  isSearchableSelect,
  SELECT_SEARCH_THRESHOLD,
  type SelectControlOption,
} from "./select-control-options";

function options(count: number): SelectControlOption[] {
  return Array.from({ length: count }, (_, index) => ({
    label: `Danışan ${index + 1}`,
    value: `client-${index + 1}`,
  }));
}

describe("searchable admin select helpers", () => {
  it("enables search only for long option lists", () => {
    expect(isSearchableSelect(options(SELECT_SEARCH_THRESHOLD))).toBe(false);
    expect(isSearchableSelect(options(SELECT_SEARCH_THRESHOLD + 1))).toBe(true);
  });

  it("filters labels case-insensitively with Turkish locale rules", () => {
    const values: SelectControlOption[] = [
      { label: "Işık Ailesi · 0500", value: "isik" },
      { label: "İpek Akbaş · ipek@example.com", value: "ipek" },
      { label: "Deniz Yılmaz", value: "deniz" },
    ];

    expect(filterSelectOptions(values, "ışık").map((option) => option.value)).toEqual(["isik"]);
    expect(filterSelectOptions(values, "İPEK").map((option) => option.value)).toEqual(["ipek"]);
    expect(filterSelectOptions(values, "0500").map((option) => option.value)).toEqual(["isik"]);
  });

  it("returns every option for an empty query and no entries for a missing match", () => {
    const values = options(3);
    expect(filterSelectOptions(values, "")).toEqual(values);
    expect(filterSelectOptions(values, "bulunmayan")).toEqual([]);
  });
});
