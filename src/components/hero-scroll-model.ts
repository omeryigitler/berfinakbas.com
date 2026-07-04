export const heroContent = Object.freeze({
  highlights: ["Kişiye göre planlama", "Minimum veriyle ilk temas", "Onayla kesinleşen randevu"],
  primaryActionLabel: "Randevu talebi oluştur",
  processCardLabel: "Talep → kontrol → onay",
});

export type HeroMotionState = Readonly<{
  cardOpacity: number;
  cardY: number;
  copyOpacity: number;
  copyY: number;
  navOpacity: number;
  navY: number;
  overlayOpacity: number;
  portraitBottom: number;
  portraitLeft: number;
  portraitScale: number;
  portraitWidth: number;
  roomScale: number;
  roomY: number;
  speechOpacity: number;
}>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function getHeroMotionState(rawProgress: number): HeroMotionState {
  const progress = clamp(rawProgress, 0, 1);
  const overlayProgress = clamp(progress / 0.42, 0, 1);
  const copyProgress = clamp((progress - 0.18) / 0.48, 0, 1);
  const navProgress = clamp(progress / 0.22, 0, 1);
  const cardProgress = clamp((progress - 0.52) / 0.3, 0, 1);

  return Object.freeze({
    cardOpacity: cardProgress,
    cardY: 36 - cardProgress * 36,
    copyOpacity: copyProgress,
    copyY: 100 - copyProgress * 100,
    navOpacity: navProgress,
    navY: -96 + navProgress * 116,
    overlayOpacity: overlayProgress,
    portraitBottom: -8 + progress * 13,
    portraitLeft: 49 - progress * 23,
    portraitScale: 1.06 - progress * 0.14,
    portraitWidth: 530 - progress * 155,
    roomScale: 1.13 - progress * 0.13,
    roomY: progress * -1.8,
    speechOpacity: 0.08 + progress * 0.3,
  });
}
