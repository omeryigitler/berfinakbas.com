import { describe, expect, it } from "vitest";

import { getHeroMotionState, heroContent } from "./hero-scroll-model";

describe("hero scroll model", () => {
  it("clamps scroll progress and returns stable motion endpoints", () => {
    expect(getHeroMotionState(-1)).toMatchObject({
      cardOpacity: 0,
      copyOpacity: 0,
      copyY: 100,
      navOpacity: 0,
      navY: -96,
      overlayOpacity: 0,
      portraitBottom: -8,
      portraitLeft: 49,
      portraitWidth: 530,
      roomScale: 1.13,
    });
    const completedState = getHeroMotionState(2);

    expect(completedState).toMatchObject({
      cardOpacity: 1,
      cardY: 0,
      copyOpacity: 1,
      copyY: 0,
      navOpacity: 1,
      navY: 20,
      overlayOpacity: 1,
      portraitBottom: 2,
      portraitLeft: 26,
      portraitScale: 0.92,
      portraitWidth: 375,
    });
    expect(completedState.roomScale).toBeCloseTo(1);
  });

  it("keeps public hero copy free of unverified metrics and service claims", () => {
    const content = JSON.stringify(heroContent).toLocaleLowerCase("tr-TR");

    expect(heroContent.primaryActionLabel).toBe("Randevu talebi oluştur");
    expect(content).not.toMatch(/%|online|çevrim içi|garanti|başarı/);
  });

  it("reveals navigation, copy, and the process card in sequence", () => {
    const earlyState = getHeroMotionState(0.1);
    const middleState = getHeroMotionState(0.4);
    const lateState = getHeroMotionState(0.7);

    expect(earlyState.navOpacity).toBeGreaterThan(0);
    expect(earlyState.copyOpacity).toBe(0);
    expect(earlyState.cardOpacity).toBe(0);
    expect(middleState.navOpacity).toBe(1);
    expect(middleState.copyOpacity).toBeGreaterThan(0);
    expect(middleState.cardOpacity).toBe(0);
    expect(lateState.copyOpacity).toBe(1);
    expect(lateState.cardOpacity).toBeGreaterThan(0);
  });
});
