"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { BrandMark } from "@/components/public-shell";
import styles from "./hero-scroll.module.css";

const heroHighlights = [
  "Kişiye göre planlama",
  "Yüz yüze veya online görüşme",
  "Onaylı randevu akışı",
];

export default function HeroScroll() {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) {
      return;
    }

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const updateHeroProgress = () => {
      const rect = hero.getBoundingClientRect();
      const scrollableDistance = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / scrollableDistance, 0, 1);
      const copyProgress = clamp((progress - 0.2) / 0.55, 0, 1);
      const navProgress = clamp(progress / 0.26, 0, 1);
      const cardProgress = clamp((progress - 0.48) / 0.38, 0, 1);

      hero.style.setProperty("--hero-progress", progress.toFixed(4));
      hero.style.setProperty("--hero-room-scale", (1.18 - progress * 0.18).toFixed(4));
      hero.style.setProperty("--hero-room-x", `${progress * 4}vw`);
      hero.style.setProperty("--hero-nav-y", `${-112 + navProgress * 132}px`);
      hero.style.setProperty("--hero-nav-opacity", navProgress.toFixed(4));
      hero.style.setProperty("--hero-copy-y", `${110 - copyProgress * 110}px`);
      hero.style.setProperty("--hero-copy-opacity", copyProgress.toFixed(4));
      hero.style.setProperty("--hero-portrait-left", `${50 - progress * 22}%`);
      hero.style.setProperty("--hero-portrait-bottom", `${-3 + progress * 11}vh`);
      hero.style.setProperty("--hero-portrait-width", `${650 - progress * 190}px`);
      hero.style.setProperty("--hero-portrait-scale", (1.08 - progress * 0.18).toFixed(4));
      hero.style.setProperty("--hero-card-y", `${38 - cardProgress * 38}px`);
      hero.style.setProperty("--hero-card-opacity", cardProgress.toFixed(4));
      hero.style.setProperty("--hero-speech-opacity", (0.18 + progress * 0.34).toFixed(4));
    };

    updateHeroProgress();
    window.addEventListener("scroll", updateHeroProgress, { passive: true });
    window.addEventListener("resize", updateHeroProgress);

    return () => {
      window.removeEventListener("scroll", updateHeroProgress);
      window.removeEventListener("resize", updateHeroProgress);
    };
  }, []);

  return (
    <section className={styles.scrollHero} ref={heroRef} aria-labelledby="hero-scroll-title">
      <div className={styles.scrollHeroSticky}>
        <div className={styles.scrollHeroRoom} aria-hidden="true">
          <span className={styles.scrollRoomLight} />
          <span className={`${styles.scrollRoomFrame} ${styles.scrollRoomFrameOne}`} />
          <span className={`${styles.scrollRoomFrame} ${styles.scrollRoomFrameTwo}`} />
          <span className={styles.scrollRoomBookcase}>
            <i />
            <i />
            <i />
            <b />
          </span>
          <span className={`${styles.scrollRoomPlant} ${styles.scrollRoomPlantLeft}`}>
            <i />
            <i />
            <i />
            <b />
          </span>
          <span className={`${styles.scrollRoomPlant} ${styles.scrollRoomPlantRight}`}>
            <i />
            <i />
            <i />
            <b />
          </span>
          <span className={styles.scrollRoomChair}>
            <i />
            <b />
          </span>
          <span className={styles.scrollRoomTable}>
            <i />
          </span>
          <span className={styles.scrollRoomRug} />
        </div>

        <header className={styles.scrollHeroNav} aria-label="Ana menü">
          <Link href="/" aria-label="Berfin Akbaş ana sayfa">
            <BrandMark />
          </Link>
          <nav>
            <Link href="/hizmetler">Hizmetler</Link>
            <Link href="/hakkimda">Hakkımda</Link>
            <Link href="/randevu">Randevu</Link>
            <Link href="/iletisim">İletişim</Link>
          </nav>
          <Link className={styles.scrollHeroNavCta} href="/randevu">
            Randevu Al
          </Link>
        </header>

        <div className={styles.scrollHeroStage}>
          <div className={styles.scrollHeroPortrait} aria-label="Berfin Akbaş, Dil ve Konuşma Terapisti" role="img">
            <span className={styles.scrollPortraitPhoto} />
            <span className={styles.scrollPortraitCard}>
              <strong>Berfin Akbaş</strong>
              <small>Dil ve Konuşma Terapisti</small>
            </span>
          </div>

          <div className={styles.scrollHeroCopy}>
            <p className="section-kicker">Dil ve Konuşma Terapisi</p>
            <h1 id="hero-scroll-title">
              <span>Her kelime,</span>
              <em>yeni bir başlangıç.</em>
            </h1>
            <p>
              Çocuklar, ergenler ve yetişkinler için sıcak, güven veren ve kişiye özel iletişim
              desteği.
            </p>
            <div className={styles.scrollHeroActions}>
              <Link className="primary-button" href="/randevu">
                Randevu Al
              </Link>
              <Link className="secondary-button" href="/hizmetler">
                Hizmetleri İncele
              </Link>
            </div>
            <ul className={styles.scrollHeroHighlights} aria-label="Temel yaklaşım">
              {heroHighlights.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.scrollSpeechLayer} aria-hidden="true">
            <span />
            <span />
            <span />
            <i />
            <i />
          </div>

          <div className={styles.scrollProgressCard} aria-hidden="true">
            <div>
              <span>Gelişim takibi</span>
              <small>Bu ay</small>
            </div>
            <strong>86%</strong>
            <svg viewBox="0 0 180 70">
              <path d="M5 54 C28 45, 37 58, 58 43 S91 36, 108 31 S141 23, 175 9" />
            </svg>
            <small>Düzenli seans ile ilerleme takibi</small>
          </div>
        </div>
      </div>
    </section>
  );
}
