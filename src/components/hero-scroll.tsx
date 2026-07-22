"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { BrandMark } from "@/components/public-shell";
import { getHeroMotionState, heroContent } from "./hero-scroll-model";
import styles from "./hero-scroll.module.css";

const MOBILE_HERO_QUERY = "(max-width: 980px)";

function ProgressCard({ className }: { className: string }) {
  return (
    <div className={`${styles.scrollProgressCard} ${className}`} aria-hidden="true">
      <div className={styles.cardHeading}>
        <span className={styles.cardKicker}>
          <i className={styles.statusDot} />
          Randevu süreci
        </span>
        <small className={styles.cardTag}>Kontrollü akış</small>
      </div>
      <div className={styles.cardStage}>
        <strong>Talep</strong>
        <span className={styles.cardStep}>1 / 3</span>
      </div>
      <div className={styles.requestTrack}>
        <i />
        <i />
        <i />
      </div>
      <div className={styles.cardSteps}>
        <span className={styles.stepActive}>Talep</span>
        <span>Kontrol</span>
        <span>Onay</span>
      </div>
    </div>
  );
}

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
    const mobileHeroQuery = window.matchMedia(MOBILE_HERO_QUERY);
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
    ];

    const updateHeroProgress = () => {
      const rect = hero.getBoundingClientRect();
      const animationDistance = Math.max(window.innerHeight * 1.15, 1);
      const state = getHeroMotionState(-rect.top / animationDistance);

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
      const shouldUseStaticMode = reducedMotionQuery.matches || mobileHeroQuery.matches;
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
    mobileHeroQuery.addEventListener("change", syncMotionMode);

    return () => {
      window.removeEventListener("scroll", scheduleHeroUpdate);
      window.removeEventListener("resize", scheduleHeroUpdate);
      reducedMotionQuery.removeEventListener("change", syncMotionMode);
      mobileHeroQuery.removeEventListener("change", syncMotionMode);
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

          <details className="hero-mobile-menu">
            <summary aria-label="Menüyü aç veya kapat">
              <span />
              <span />
              <span />
            </summary>
            <div className="hero-mobile-menu-panel">
              <Link className="hero-mobile-menu-brand" href="/" aria-label="Berfin Akbaş ana sayfa">
                <BrandMark />
              </Link>

              <nav aria-label="Mobil menü">
                <Link href="/hizmetler">Hizmetler</Link>
                <Link href="/hakkimda">Hakkımda</Link>
                <Link href="/surec">Terapi Yaklaşımı</Link>
                <Link className="hero-mobile-menu-booking" href="/randevu">
                  Randevu Talebi
                </Link>
                <Link href="/iletisim">İletişim</Link>
              </nav>

              <div className="hero-mobile-menu-actions">
                <Link className="primary-button" href="/randevu">
                  Online Randevu Talebi Oluştur
                </Link>
                <Link className="secondary-button" href="/hizmetler">
                  Hizmetleri İncele
                </Link>
              </div>

              <small>© Berfin Akbaş 2026</small>
            </div>
          </details>
        </header>

        <div className={styles.scrollHeroStage}>
          <div className={styles.scrollHeroPortrait}>
            <Image
              src="/berfin-hero-standing.png"
              alt="Berfin Akbaş portresi"
              draggable={false}
              height={1353}
              priority
              sizes="(max-width: 980px) 40vw, 320px"
              width={413}
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

            <ProgressCard className="hero-progress-card-mobile" />

            <ul className={styles.scrollHeroHighlights} aria-label="Temel yaklaşım">
              {heroContent.highlights.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <ProgressCard className="hero-progress-card-desktop" />
        </div>
      </div>

      <style jsx global>{`
        .hero-mobile-menu,
        .hero-progress-card-mobile {
          display: none;
        }

        @media (max-width: 980px) {
          html:has(.hero-mobile-menu[open]),
          body:has(.hero-mobile-menu[open]) {
            overflow: hidden;
          }

          .${styles.scrollHero} {
            height: auto;
            min-height: 1030px;
          }

          .${styles.scrollHeroSticky} {
            position: relative;
            top: auto;
            height: 1030px;
            min-height: 1030px;
          }

          .${styles.scrollHeroRoom} {
            inset: 0;
          }

          .${styles.scrollHeroRoom} img {
            object-position: center bottom;
          }

          .${styles.scrollHeroSticky}::after {
            background: linear-gradient(
              180deg,
              rgb(255 250 244 / 4%) 0%,
              rgb(255 250 244 / 8%) 35%,
              rgb(255 250 244 / 70%) 57%,
              rgb(255 250 244 / 96%) 82%,
              #fffaf4 100%
            );
            opacity: 1;
          }

          .${styles.scrollHeroStage} {
            width: min(640px, calc(100% - 24px));
          }

          .${styles.scrollHeroNav} {
            top: 12px;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            width: calc(100% - 24px);
            min-height: 72px;
            padding: 7px 10px 7px 12px;
            opacity: 1;
            transform: translate3d(-50%, 0, 0);
          }

          .${styles.scrollHeroNav} > nav,
          .${styles.scrollHeroNavCta} {
            display: none;
          }

          .${styles.scrollHeroNav} .brand-mark {
            min-width: 0;
            gap: 9px;
          }

          .${styles.scrollHeroNav} .brand-symbol {
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
          }

          .${styles.scrollHeroNav} .brand-mark strong {
            overflow: hidden;
            font-size: 1rem;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .${styles.scrollHeroNav} .brand-mark small {
            display: block;
            overflow: hidden;
            margin-top: 1px;
            font-size: 0.5rem;
            letter-spacing: 0.1em;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .hero-mobile-menu {
            position: relative;
            display: block;
            justify-self: end;
          }

          .hero-mobile-menu[open] {
            position: fixed;
            inset: 0;
            z-index: 1000;
            padding: 12px;
            background: rgb(44 38 34 / 72%);
          }

          .hero-mobile-menu summary {
            display: grid;
            width: 44px;
            height: 44px;
            place-content: center;
            gap: 5px;
            border: 1px solid rgb(88 62 49 / 13%);
            border-radius: 50%;
            background: rgb(255 255 255 / 44%);
            cursor: pointer;
            list-style: none;
          }

          .hero-mobile-menu[open] summary {
            position: fixed;
            top: 28px;
            right: 28px;
            z-index: 1002;
            border-color: rgb(88 62 49 / 18%);
            background: rgb(255 250 244 / 76%);
            backdrop-filter: blur(18px);
          }

          .hero-mobile-menu summary::-webkit-details-marker {
            display: none;
          }

          .hero-mobile-menu summary::marker {
            content: "";
          }

          .hero-mobile-menu summary span {
            display: block;
            width: 21px;
            height: 2px;
            border-radius: 999px;
            background: var(--ink);
            transition:
              transform 160ms ease,
              opacity 160ms ease;
          }

          .hero-mobile-menu[open] summary span:nth-child(1) {
            transform: translateY(7px) rotate(45deg);
          }

          .hero-mobile-menu[open] summary span:nth-child(2) {
            opacity: 0;
          }

          .hero-mobile-menu[open] summary span:nth-child(3) {
            transform: translateY(-7px) rotate(-45deg);
          }

          .hero-mobile-menu-panel {
            position: fixed;
            inset: 12px;
            z-index: 1001;
            display: grid;
            grid-template-rows: auto 1fr auto auto;
            align-items: center;
            overflow-y: auto;
            padding: 28px 22px 24px;
            border: 1px solid rgb(255 255 255 / 64%);
            border-radius: 30px;
            background:
              linear-gradient(180deg, rgb(255 250 244 / 92%), rgb(250 239 228 / 96%)),
              rgb(255 250 244 / 92%);
            box-shadow:
              0 28px 80px rgb(36 27 22 / 28%),
              inset 0 1px 0 rgb(255 255 255 / 88%);
            backdrop-filter: blur(28px) saturate(1.15);
          }

          .hero-mobile-menu-brand {
            justify-self: center;
            padding-top: 2px;
          }

          .hero-mobile-menu-brand .brand-mark {
            flex-direction: column;
            gap: 7px;
            text-align: center;
          }

          .hero-mobile-menu-brand .brand-symbol {
            width: 58px !important;
            height: 58px !important;
            flex-basis: 58px !important;
          }

          .hero-mobile-menu-brand .brand-mark strong {
            font-size: 1.35rem !important;
          }

          .hero-mobile-menu-brand .brand-mark small {
            display: block !important;
            font-size: 0.52rem !important;
            letter-spacing: 0.13em !important;
          }

          .hero-mobile-menu-panel nav {
            display: grid !important;
            align-content: center;
            width: min(100%, 360px);
            margin: 20px auto;
          }

          .hero-mobile-menu-panel nav a {
            padding: 14px 8px;
            border-bottom: 1px solid rgb(88 62 49 / 12%);
            color: var(--ink);
            font-family: var(--serif);
            font-size: clamp(1.65rem, 7.5vw, 2.25rem);
            font-weight: 500;
            line-height: 1.05;
            text-align: center;
          }

          .hero-mobile-menu-panel nav a:last-child {
            border-bottom: 0;
          }

          .hero-mobile-menu-panel nav .hero-mobile-menu-booking {
            color: var(--coral-dark);
          }

          .hero-mobile-menu-actions {
            display: grid;
            gap: 10px;
            width: 100%;
            margin-bottom: 18px;
          }

          .hero-mobile-menu-actions a {
            width: 100%;
            min-height: 56px;
            font-family: var(--serif);
            font-size: 1rem;
          }

          .hero-mobile-menu-panel > small {
            color: var(--muted);
            font-size: 0.72rem;
            text-align: center;
          }

          .${styles.scrollHeroPortrait} {
            top: 106px;
            bottom: auto;
            left: 50%;
            z-index: 12;
            width: min(360px, 90vw);
            height: 520px;
            min-height: 520px;
            transform: translateX(-50%) scale(1);
            transform-origin: top center;
            -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 76%, transparent 100%);
            mask-image: linear-gradient(180deg, #000 0%, #000 76%, transparent 100%);
          }

          .${styles.scrollHeroCopy} {
            top: 466px;
            right: auto;
            bottom: auto;
            left: 0;
            z-index: 20;
            width: 100%;
            padding: 0 4px 28px;
            text-align: center;
            opacity: 1;
            transform: none;
          }

          .${styles.scrollHeroCopy} > .section-kicker {
            display: none;
          }

          .${styles.scrollHeroCopy} h1 {
            font-size: clamp(3rem, 13vw, 5.3rem);
            line-height: 0.88;
          }

          .${styles.scrollHeroCopy} > p:not(.section-kicker) {
            max-width: 520px;
            margin: 15px auto 0;
            color: #3f332e;
            font-size: 0.9rem;
            line-height: 1.5;
          }

          .${styles.scrollHeroActions} {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 18px;
          }

          .${styles.scrollHeroActions} .primary-button,
          .${styles.scrollHeroActions} .secondary-button {
            width: 100%;
            min-height: 52px;
            padding: 8px 10px;
            font-size: clamp(0.62rem, 2.5vw, 0.75rem);
            line-height: 1.15;
            text-align: center;
          }

          .hero-progress-card-mobile {
            position: relative;
            inset: auto;
            display: block !important;
            width: 100%;
            margin-top: 16px;
            padding: 17px 18px 16px;
            text-align: left;
            opacity: 1;
            transform: none;
          }

          .hero-progress-card-desktop,
          .${styles.scrollHeroHighlights} {
            display: none !important;
          }
        }

        @media (max-width: 420px) {
          .${styles.scrollHeroNav} {
            width: calc(100% - 20px);
          }

          .${styles.scrollHeroNav} .brand-mark {
            gap: 7px;
          }

          .${styles.scrollHeroNav} .brand-symbol {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
          }

          .${styles.scrollHeroNav} .brand-mark strong {
            font-size: 0.94rem;
          }

          .${styles.scrollHeroNav} .brand-mark small {
            font-size: 0.46rem;
            letter-spacing: 0.08em;
          }

          .hero-mobile-menu-panel {
            inset: 8px;
            padding: 24px 18px 20px;
            border-radius: 26px;
          }

          .hero-mobile-menu[open] summary {
            top: 22px;
            right: 22px;
          }

          .hero-mobile-menu-panel nav a {
            padding-block: 12px;
            font-size: clamp(1.5rem, 7vw, 1.95rem);
          }

          .hero-mobile-menu-actions a {
            min-height: 52px;
            font-size: 0.9rem;
          }

          .${styles.scrollHeroPortrait} {
            top: 100px;
            width: min(340px, 94vw);
            height: 500px;
            min-height: 500px;
          }

          .${styles.scrollHeroCopy} {
            top: 450px;
          }

          .${styles.scrollHeroCopy} h1 {
            font-size: clamp(2.9rem, 13.2vw, 4.25rem);
          }

          .hero-progress-card-mobile {
            padding-inline: 16px;
          }
        }
      `}</style>
    </section>
  );
}
