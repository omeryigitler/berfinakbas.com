import { describe, expect, it } from "vitest";

import { getHeroMotionState, heroContent } from "./hero-scroll-model";

describe("hero scroll model", () => {
  it("clamps scroll progress and returns stable motion endpoints", () => {
    expect(getHeroMotionState(-1)).toMatchObject({
      cardOpacity: 0,
      overlayOpacity: 0.72,
      portraitLeft: 36,
      portraitWidth: 460,
      roomScale: 1.1,
    });
    expect(getHeroMotionState(2)).toMatchObject({
      cardOpacity: 1,
      cardY: 0,
      overlayOpacity: 1,
      portraitBottom: 5,
      portraitLeft: 26,
      portraitScale: 0.92,
      portraitWidth: 375,
      roomScale: 1,
    });
  });

  it("keeps public hero copy free of unverified metrics and service claims", () => {
    const content = JSON.stringify(heroContent).toLocaleLowerCase("tr-TR");

    expect(heroContent.primaryActionLabel).toBe("Randevu talebi oluştur");
    expect(content).not.toMatch(/%|online|çevrim içi|garanti|başarı/);
  });
});
