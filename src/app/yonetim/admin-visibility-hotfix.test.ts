import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const visibilityCss = readFileSync(
  join(repositoryRoot, "src/app/yonetim/admin-visibility-hotfix.css"),
  "utf8",
);

describe("therapist admin navigation", () => {
  it("hides the technical system group without adding a replacement", () => {
    expect(visibilityCss).toContain('[data-admin-group="sistem"]');
    expect(visibilityCss).toContain("display: none !important");
  });

  it("does not expose the removed health page or dashboard component", () => {
    expect(existsSync(join(repositoryRoot, "src/app/yonetim/saglik/page.tsx"))).toBe(false);
    expect(
      existsSync(join(repositoryRoot, "src/components/admin/outbox-health-dashboard.tsx")),
    ).toBe(false);
  });
});
