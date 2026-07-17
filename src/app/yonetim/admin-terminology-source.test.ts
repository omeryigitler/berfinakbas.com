import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("admin terminology", () => {
  it("keeps client creation labels fully Turkish", () => {
    const content = source("src/app/yonetim/danisan-olustur/page.tsx");
    expect(content).toContain("Yeni danışan");
    expect(content).toContain("Danışan oluştur");
    expect(content).not.toContain("CLIENT");
    expect(content).not.toContain("BO işlemleri");
  });

  it("keeps finance labels fully Turkish", () => {
    const content = source("src/app/yonetim/odemeler/page.tsx");
    expect(content).toContain("Ödeme ve planlar");
    expect(content).toContain("Danışan ödeme operasyonu");
    expect(content).not.toContain(">FINANCE<");
  });
});
