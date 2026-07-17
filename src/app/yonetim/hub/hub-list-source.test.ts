import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "src/app/yonetim/hub/page.tsx"), "utf8");

describe("Record Center server list contract", () => {
  it("uses bounded server-side search and pagination", () => {
    expect(source).toContain("const PAGE_SIZE = 30");
    expect(source).toContain("skip,");
    expect(source).toContain("take: PAGE_SIZE");
    expect(source).toContain('singleParam(params, "q")');
    expect(source).toContain('singleParam(params, "sayfa")');
  });

  it("searches administrative appointment and client fields", () => {
    expect(source).toContain("publicReference");
    expect(source).toContain("serviceNameSnapshot");
    expect(source).toContain("preferredName");
    expect(source).toContain("phone");
    expect(source).toContain("email");
  });

  it("keeps open-request filtering and nearest client appointment selection", () => {
    expect(source).toContain("openRequestStatuses");
    expect(source).toContain("status: { in: [...openRequestStatuses] }");
    expect(source).toContain("take: 1");
    expect(source).toContain("startsAt: { gt: now }");
  });

  it("renders query-preserving page controls", () => {
    expect(source).toContain("currentPage - 1");
    expect(source).toContain("currentPage + 1");
    expect(source).toContain('className="hub-search-pages"');
    expect(source).toContain("listHref");
  });

  it("hides list controls on availability and finance summary sections", () => {
    expect(source).toContain("const isSummarySection");
    expect(source).toContain('requestedSection === "musaitlik" && canReadAvailability');
    expect(source).toContain('requestedSection === "odemeler" && canReadFinance');
    expect(source).toContain("!isSummarySection ? (");
  });

  it("falls back to the request queue when client access is missing", () => {
    expect(source).toContain(
      'requestedSection === "danisanlar" && canReadClients ? "danisanlar" : "talepler"',
    );
  });
});
