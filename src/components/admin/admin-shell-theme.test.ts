import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/components/admin/admin-shell.module.css"), "utf8");

describe("admin Hub base theme", () => {
  it("does not contain the retired coral and serif theme source", () => {
    expect(css).not.toContain("var(--coral");
    expect(css).not.toContain("var(--serif)");
    expect(css).not.toContain("#d96f4d");
    expect(css).not.toContain("#b75f44");
    expect(css).not.toContain("#4f3a33");
  });

  it("defines the single Hub token set in the base shell", () => {
    expect(css).toContain("--admin-bg: #e9e7e2");
    expect(css).toContain("--admin-panel: #fbfaf8");
    expect(css).toContain("--admin-lime: #dfec83");
    expect(css).toContain("--admin-teal: #12897b");
    expect(css).toContain("--admin-peach: #fbe3d2");
  });

  it("keeps the responsive Hub shell and focus-visible treatment", () => {
    expect(css).toContain("@media (max-width: 1100px)");
    expect(css).toContain("@media (max-width: 860px)");
    expect(css).toContain("@media (max-width: 600px)");
    expect(css).toContain(":focus-visible");
  });
});
