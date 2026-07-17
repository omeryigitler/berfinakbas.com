import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/components/admin/client-profile-url-modals.tsx"),
  "utf8",
);

describe("client profile note copy", () => {
  it("describes the actual note visibility without promising timeline history", () => {
    expect(source).toContain("Son kaydedilen notlar bu pencerenin altında listelenir.");
    expect(source).not.toContain("profil geçmişinde görünür");
  });

  it("uses Turkish management terminology", () => {
    expect(source).toContain("Yönetim notu");
    expect(source).not.toContain("Admin notu");
  });
});
