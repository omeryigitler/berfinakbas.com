"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { BrandMark } from "@/components/public-shell";
import { getHeroMotionState, heroContent } from "./hero-scroll-model";
import styles from "./hero-scroll.module.css";

export default function HeroScroll() {
  const heroRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame: number | null = null;
    const motionProperties = [
      "--hero-overlay-opacity",
      "--hero-room-scale",
      "--hero-room-y",
      "--hero-nav-y",
      "--hero-nav-opacity",
      "--hero-copy-y",
      "--hero-copy-opacity",
      "--hero-portrait-left",
      "--hero-portrait-bottom",
      "--hero-portrait-width",
      "--hero-portrait-scale",
      "--hero-card-y",
      "--hero-card-opacity",
      "--hero-speech-opacity",
    ];

    const updateHeroProgress = () => {
      const rect = hero.getBoundingClientRect();
      const scrollableDistance = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const state = getHeroMotionState(-rect.top / scrollableDistance);

      hero.style.setProperty("--hero-overlay-opacity", state.overlayOpacity.toFixed(4));
      hero.style.setProperty("--hero-room-scale", state.roomScale.toFixed(4));
      hero.style.setProperty("--hero-room-y", `${state.roomY}vh`);
      hero.style.setProperty("--hero-nav-y", `${state.navY}px`);
      hero.style.setProperty("--hero-nav-opacity", state.navOpacity.toFixed(4));
      hero.style.setProperty("--hero-copy-y", `${state.copyY}px`);
      hero.style.setProperty("--hero-copy-opacity", state.copyOpacity.toFixed(4));
      hero.style.setProperty("--hero-portrait-left", `${state.portraitLeft}%`);
      hero.style.setProperty("--hero-portrait-bottom", `${state.portraitBottom}vh`);
      hero.style.setProperty("--hero-portrait-width", `${state.portraitWidth}px`);
      hero.style.setProperty("--hero-portrait-scale", state.portraitScale.toFixed(4));
      hero.style.setProperty("--hero-card-y", `${state.cardY}px`);
      hero.style.setProperty("--hero-card-opacity", state.cardOpacity.toFixed(4));
      hero.style.setProperty("--hero-speech-opacity", state.speechOpacity.toFixed(4));
      if (navRef.current) navRef.current.inert = state.navOpacity < 0.2;
      if (actionsRef.current) actionsRef.current.inert = state.copyOpacity < 0.2;
      animationFrame = null;
    };

    const scheduleHeroUpdate = () => {
      if (hero.dataset.motion !== "scroll") return;
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(updateHeroProgress);
    };

    const syncMotionMode = () => {
      const shouldUseStaticMode = reducedMotionQuery.matches;
      hero.dataset.motion = shouldUseStaticMode ? "static" : "scroll";

      if (shouldUseStaticMode) {
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
        motionProperties.forEach((property) => hero.style.removeProperty(property));
        if (navRef.current) navRef.current.inert = false;
        if (actionsRef.current) actionsRef.current.inert = false;
        return;
      }

      updateHeroProgress();
    };

    syncMotionMode();
    window.addEventListener("scroll", scheduleHeroUpdate, { passive: true });
    window.addEventListener("resize", scheduleHeroUpdate);
    reducedMotionQuery.addEventListener("change", syncMotionMode);

    return () => {
      window.removeEventListener("scroll", scheduleHeroUpdate);
      window.removeEventListener("resize", scheduleHeroUpdate);
      reducedMotionQuery.removeEventListener("change", syncMotionMode);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section className={styles.scrollHero} ref={heroRef} aria-labelledby="hero-scroll-title">
      <div className={styles.scrollHeroSticky}>
        <div className={styles.scrollHeroRoom} aria-hidden="true">
          <Image alt="" fill priority sizes="100vw" src="/therapy-office-hero.png" />
        </div>

        <header className={styles.scrollHeroNav} aria-label="Ana menü" ref={navRef}>
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
            {heroContent.primaryActionLabel}
          </Link>
        </header>

        <div className={styles.scrollHeroStage}>
          <div className={styles.scrollHeroPortrait}>
            <Image
              src="/berfin-hero-standing.png"
              alt="Berfin Akbaş portresi"
              draggable={false}
              height={1400}
              priority
              sizes="(max-width: 980px) 40vw, 320px"
              width={394}
            />
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
            <div className={styles.scrollHeroActions} ref={actionsRef}>
              <Link className="primary-button" href="/randevu">
                {heroContent.primaryActionLabel}
              </Link>
              <Link className="secondary-button" href="/hizmetler">
                Hizmetleri İncele
              </Link>
            </div>
            <ul className={styles.scrollHeroHighlights} aria-label="Temel yaklaşım">
              {heroContent.highlights.map((item) => (
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
            <div className={styles.cardHeading}>
              <span>Randevu süreci</span>
              <small>Kontrollü akış</small>
            </div>
            <strong>Talep</strong>
            <div className={styles.requestTrack}>
              <i />
              <i />
              <i />
            </div>
            <small>{heroContent.processCardLabel}</small>
          </div>
        </div>
      </div>
    </section>
  );
}
