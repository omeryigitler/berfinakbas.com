import { describe, expect, it } from "vitest";

import {
  defaultPublicContactSettings,
  publicContactSettingsSchema,
} from "./public-contact-settings";

describe("public contact settings", () => {
  it("accepts optional verified contact channels", () => {
    expect(
      publicContactSettingsSchema.parse({
        address: "Küçükçekmece, İstanbul",
        email: "info@example.com",
        mapsUrl: "https://maps.example.com/location",
        phone: "+90 555 000 00 00",
        whatsappUrl: "https://wa.me/905550000000",
      }),
    ).toMatchObject({
      address: "Küçükçekmece, İstanbul",
      email: "info@example.com",
    });
  });

  it("uses a location-only default and rejects unsafe URLs", () => {
    expect(defaultPublicContactSettings.address).toBe("Küçükçekmece, İstanbul");
    expect(() =>
      publicContactSettingsSchema.parse({
        ...defaultPublicContactSettings,
        mapsUrl: "javascript:alert(1)",
      }),
    ).toThrow();
  });
});
