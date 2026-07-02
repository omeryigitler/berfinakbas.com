"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { BrandMark } from "@/components/public-shell";

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

      hero.style.setProperty("--hero-progress", progress.toFixed(4));
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
    <section className="scroll-hero" ref={heroRef} aria-labelledby="hero-scroll-title">
      <div className="scroll-hero-sticky">
        <div className="scroll-hero-room" aria-hidden="true">
          <span className="scroll-room-light" />
          <span className="scroll-room-frame scroll-room-frame-one" />
          <span className="scroll-room-frame scroll-room-frame-two" />
          <span className="scroll-room-bookcase">
            <i />
            <i />
            <i />
            <b />
          </span>
          <span className="scroll-room-plant scroll-room-plant-left">
            <i />
            <i />
            <i />
            <b />
          </span>
          <span className="scroll-room-plant scroll-room-plant-right">
            <i />
            <i />
            <i />
            <b />
          </span>
          <span className="scroll-room-chair">
            <i />
            <b />
          </span>
          <span className="scroll-room-table">
            <i />
          </span>
          <span className="scroll-room-rug" />
        </div>

        <header className="scroll-hero-nav" aria-label="Ana menü">
          <Link href="/" aria-label="Berfin Akbaş ana sayfa">
            <BrandMark />
          </Link>
          <nav>
            <Link href="/hizmetler">Hizmetler</Link>
            <Link href="/hakkimda">Hakkımda</Link>
            <Link href="/randevu">Randevu</Link>
            <Link href="/iletisim">İletişim</Link>
          </nav>
          <Link className="scroll-hero-nav-cta" href="/randevu">
            Randevu Al
          </Link>
        </header>

        <div className="scroll-hero-stage">
          <div className="scroll-hero-portrait" aria-label="Berfin Akbaş, Dil ve Konuşma Terapisti" role="img">
            <span className="scroll-portrait-photo" />
            <span className="scroll-portrait-card">
              <strong>Berfin Akbaş</strong>
              <small>Dil ve Konuşma Terapisti</small>
            </span>
          </div>

          <div className="scroll-hero-copy">
            <p className="section-kicker">Dil ve Konuşma Terapisi</p>
            <h1 id="hero-scroll-title">
              <span>Her kelime,</span>
              <em>yeni bir başlangıç.</em>
            </h1>
            <p>
              Çocuklar, ergenler ve yetişkinler için sıcak, güven veren ve kişiye özel iletişim
              desteği.
            </p>
            <div className="scroll-hero-actions">
              <Link className="primary-button" href="/randevu">
                Randevu Al
              </Link>
              <Link className="secondary-button" href="/hizmetler">
                Hizmetleri İncele
              </Link>
            </div>
            <ul className="scroll-hero-highlights" aria-label="Temel yaklaşım">
              {heroHighlights.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="scroll-speech-layer" aria-hidden="true">
            <span />
            <span />
            <span />
            <i />
            <i />
          </div>

          <div className="scroll-progress-card" aria-hidden="true">
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
