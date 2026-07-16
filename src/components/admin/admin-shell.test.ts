import { describe, expect, it } from "vitest";

import { getAdminNavItems } from "./admin-shell";

describe("getAdminNavItems", () => {
  it("returns only permitted navigation items for the current session", () => {
    const items = getAdminNavItems({
      appointmentsRead: true,
      financeRead: false,
      servicesRead: true,
      technicalHealthRead: true,
    });

    expect(items.map((item) => item.href)).toEqual([
      "/yonetim",
      "/yonetim/randevular",
      "/yonetim/musaitlik",
      "/yonetim/saglik",
    ]);
  });

  it("hides finance and health links when permissions are missing", () => {
    const items = getAdminNavItems({
      appointmentsRead: false,
      financeRead: false,
      servicesRead: false,
      technicalHealthRead: false,
    });

    expect(items).toHaveLength(0);
  });
});
