import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/app/yonetim/danisanlar/page.tsx"),
  "utf8",
);

describe("admin client list pagination contract", () => {
  it("uses bounded server-side pagination instead of a fixed 100-record list", () => {
    expect(source).toContain("const PAGE_SIZE = 50");
    expect(source).toContain("skip: (currentPage - 1) * PAGE_SIZE");
    expect(source).toContain("take: PAGE_SIZE");
    expect(source).not.toContain("take: 100");
  });

  it("preserves search and filters in previous/next page links", () => {
    expect(source).toContain('if (query) search.set("q", query)');
    expect(source).toContain('search.set("status", status)');
    expect(source).toContain('search.set("type", type)');
    expect(source).toContain("currentPage - 1");
    expect(source).toContain("currentPage + 1");
  });

  it("reports the visible range and total page count", () => {
    expect(source).toContain("firstVisible");
    expect(source).toContain("lastVisible");
    expect(source).toContain("Sayfa {currentPage}/");
    expect(source).toContain('aria-label="Danışan listesi sayfaları"');
  });
});
