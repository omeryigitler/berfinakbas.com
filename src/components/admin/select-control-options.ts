import type { SelectControlOption } from "./select-control";

export const SELECT_SEARCH_THRESHOLD = 12;

function normalizedSearch(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function isSearchableSelect(options: readonly SelectControlOption[]): boolean {
  return options.length > SELECT_SEARCH_THRESHOLD;
}

export function filterSelectOptions(
  options: readonly SelectControlOption[],
  query: string,
): SelectControlOption[] {
  const normalizedQuery = normalizedSearch(query);
  if (!normalizedQuery) return [...options];
  return options.filter((option) => normalizedSearch(option.label).includes(normalizedQuery));
}
