export const heroContent = Object.freeze({
  highlights: ["Kişiye göre planlama", "Minimum veriyle ilk temas", "Onayla kesinleşen randevu"],
  primaryActionLabel: "Randevu talebi oluştur",
  processCardLabel: "Talep → kontrol → onay",
});

export type HeroMotionState = Readonly<{
  cardOpacity: number;
  cardY: number;
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
  const cardProgress = clamp((progress - 0.52) / 0.3, 0, 1);

  return Object.freeze({
    cardOpacity: cardProgress,
    cardY: 36 - cardProgress * 36,
    overlayOpacity: 0.72 + overlayProgress * 0.28,
    portraitBottom: -2 + progress * 7,
    portraitLeft: 36 - progress * 10,
    portraitScale: 1.02 - progress * 0.1,
    portraitWidth: 460 - progress * 85,
    roomScale: 1.1 - progress * 0.1,
    roomY: progress * -1.8,
    speechOpacity: 0.08 + progress * 0.3,
  });
}
