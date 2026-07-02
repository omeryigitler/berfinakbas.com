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

    if (!hero) return;

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const updateHeroProgress = () => {
      const rect = hero.getBoundingClientRect();
      const scrollableDistance = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / scrollableDistance, 0, 1);
      const copyProgress = clamp((progress - 0.18) / 0.48, 0, 1);
      const navProgress = clamp(progress / 0.22, 0, 1);
      const cardProgress = clamp((progress - 0.52) / 0.3, 0, 1);

      hero.style.setProperty("--hero-room-scale", (1.13 - progress * 0.13).toFixed(4));
      hero.style.setProperty("--hero-room-y", `${progress * -1.8}vh`);
      hero.style.setProperty("--hero-nav-y", `${-96 + navProgress * 116}px`);
      hero.style.setProperty("--hero-nav-opacity", navProgress.toFixed(4));
      hero.style.setProperty("--hero-copy-y", `${100 - copyProgress * 100}px`);
      hero.style.setProperty("--hero-copy-opacity", copyProgress.toFixed(4));
      hero.style.setProperty("--hero-portrait-left", `${49 - progress * 23}%`);
      hero.style.setProperty("--hero-portrait-bottom", `${-2 + progress * 7}vh`);
      hero.style.setProperty("--hero-portrait-width", `${530 - progress * 155}px`);
      hero.style.setProperty("--hero-portrait-scale", (1.06 - progress * 0.14).toFixed(4));
      hero.style.setProperty("--hero-card-y", `${36 - cardProgress * 36}px`);
      hero.style.setProperty("--hero-card-opacity", cardProgress.toFixed(4));
      hero.style.setProperty("--hero-speech-opacity", (0.08 + progress * 0.3).toFixed(4));
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
        <div className={styles.scrollHeroRoom} aria-hidden="true" />

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
          <div className={styles.scrollHeroGhostTitle} aria-hidden="true">
            <span>DİL VE</span>
            <span>KONUŞMA</span>
          </div>

          <div className={styles.scrollHeroPortrait}>
            <img src="/berfin-hero.png" alt="Berfin Akbaş, Dil ve Konuşma Terapisti" draggable="false" />
          </div>

          <div className={styles.scrollHeroCopy}>
            <p className="section-kicker">Dil ve Konuşma Terapisi</p>
            <h1 id="hero-scroll-title">
              <span>Her kelime,</span>
              <em>yeni bir başlangıç.</em>
            </h1>
            <p>Çocuklar, ergenler ve yetişkinler için sıcak, güven veren ve kişiye özel iletişim desteği.</p>
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
