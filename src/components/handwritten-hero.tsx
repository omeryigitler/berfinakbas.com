"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/public-shell";

import styles from "./handwritten-hero.module.css";

type ServiceIcon = "fluency" | "plan" | "speech" | "voice" | "adult";

type ServiceCard = {
  annotation: string;
  icon: ServiceIcon;
  title: string;
  tone: "blue" | "charcoal" | "cream" | "peach" | "sage";
};

const serviceCards: ServiceCard[] = [
  {
    annotation: "Erken Müdahale",
    icon: "speech",
    title: "Gecikmiş Konuşma",
    tone: "peach",
  },
  {
    annotation: "Akıcılık Gelişimi",
    icon: "fluency",
    title: "Akıcı Konuşma",
    tone: "sage",
  },
  {
    annotation: "Check-list",
    icon: "plan",
    title: "Klinik Plan",
    tone: "cream",
  },
  {
    annotation: "İletişim Stratejileri",
    icon: "adult",
    title: "Yetişkin Terapisi",
    tone: "blue",
  },
  {
    annotation: "Ses Sağlığı",
    icon: "voice",
    title: "Ses Terapisi",
    tone: "charcoal",
  },
];

function DoodleIcon({ type }: { type: ServiceIcon }) {
  if (type === "speech") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 72">
        <path d="M18 18c0-7 7-12 16-12h23c10 0 17 6 17 14v13c0 8-7 14-17 14H42L26 59l4-13c-7-2-12-7-12-13V18Z" />
        <path d="M36 25h21M36 33h14" />
        <circle cx="30" cy="26" r="2" />
        <path d="m62 56 7-6 8 8M68 50l5-7 7 7" />
      </svg>
    );
  }

  if (type === "fluency") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 72">
        <path d="M8 52c10-28 18 22 29-10S54 64 65 30s16 10 23-6" />
        <path d="M12 17h16l5-8 8 17 7-12 8 10h26" />
        <path d="M13 62c15-5 27-4 39-1 12 4 23 4 34-2" />
      </svg>
    );
  }

  if (type === "plan") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 72">
        <rect x="20" y="14" width="55" height="45" rx="3" />
        <path d="M20 27h55M33 8v12M62 8v12M31 37h8M46 37h8M61 37h7M31 47h8M46 47h8M61 47h7" />
        <path d="m8 22 8 5-7 5M80 52l7 5-8 5" />
      </svg>
    );
  }

  if (type === "adult") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 72">
        <circle cx="34" cy="23" r="10" />
        <path d="M16 58c2-15 9-23 18-23s16 8 18 23" />
        <circle cx="68" cy="29" r="8" />
        <path d="M56 58c1-12 6-19 13-19 6 0 11 7 12 19" />
        <path d="M43 21c8-6 13-6 18-3M47 27c5 0 9 1 13 5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 96 72">
      <rect x="40" y="10" width="17" height="35" rx="8" />
      <path d="M32 33c0 11 7 18 17 18s17-7 17-18M49 51v13M38 64h22" />
      <path d="M11 43c8-18 12 18 20-2M69 41c7-16 10 15 17-4" />
    </svg>
  );
}

function wrappedOffset(index: number, activeIndex: number) {
  let offset = index - activeIndex;
  const midpoint = Math.floor(serviceCards.length / 2);

  if (offset > midpoint) offset -= serviceCards.length;
  if (offset < -midpoint) offset += serviceCards.length;

  return offset;
}

function ChevronLeft() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function HandwrittenHero() {
  const [activeIndex, setActiveIndex] = useState(2);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const hero = heroRef.current;

    if (!track || !hero) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;

    const update = () => {
      frame = null;

      if (reducedMotion.matches) {
        hero.style.setProperty("--word-one", "1");
        hero.style.setProperty("--word-two", "1");
        hero.style.setProperty("--cards-reveal", "1");
        return;
      }

      const rect = track.getBoundingClientRect();
      const scrollDistance = Math.max(track.offsetHeight - window.innerHeight, 1);
      const progress = clamp01(-rect.top / scrollDistance);
      const wordOne = clamp01(progress / 0.24);
      const wordTwo = clamp01((progress - 0.08) / 0.26);
      const cards = clamp01((progress - 0.18) / 0.36);

      hero.style.setProperty("--word-one", wordOne.toFixed(4));
      hero.style.setProperty("--word-two", wordTwo.toFixed(4));
      hero.style.setProperty("--cards-reveal", cards.toFixed(4));
    };

    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  const previous = () => {
    setActiveIndex((current) => (current - 1 + serviceCards.length) % serviceCards.length);
  };

  const next = () => {
    setActiveIndex((current) => (current + 1) % serviceCards.length);
  };

  return (
    <section className={styles.heroTrack} ref={trackRef} aria-labelledby="home-title">
      <div className={styles.hero} ref={heroRef}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="Berfin Akbaş ana sayfa">
            <BrandMark />
          </Link>

          <nav className={styles.nav} aria-label="Ana menü">
            <Link href="/hizmetler">Hizmetler</Link>
            <span aria-hidden="true">·</span>
            <Link href="/hakkimda">Hakkımda</Link>
            <span aria-hidden="true">·</span>
            <Link href="/surec">Süreç</Link>
            <span aria-hidden="true">·</span>
            <Link href="/iletisim">İletişim</Link>
          </nav>

          <div className={styles.headerActions}>
            <span className={styles.onlineNote}>online &amp; yüz yüze</span>
            <Link className={styles.bookingPill} href="/randevu">
              Randevu Al
            </Link>
          </div>
        </header>

        <div className={styles.heroCenter}>
          <h1 className={styles.backgroundWords} id="home-title">
            <span>Dil ve Konuşma Keşfi:</span>
            <span>Kişiselleştirilmiş Notlarla</span>
          </h1>

          <div
            className={`${styles.carousel} ${isHovered ? styles.carouselHovered : ""}`}
            aria-label="Destek alanları"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {serviceCards.map((service, index) => {
              const offset = wrappedOffset(index, activeIndex);
              const active = index === activeIndex;

              return (
                <button
                  aria-label={`${service.title} defterini öne getir`}
                  aria-pressed={active}
                  className={`${styles.notebook} ${styles[service.tone]} ${
                    active ? styles.active : ""
                  }`}
                  data-offset={offset}
                  key={service.title}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <span className={styles.spiral} aria-hidden="true" />
                  <span className={styles.notebookTopline}>
                    <span>{service.annotation}</span>
                    <i aria-hidden="true">↗</i>
                  </span>
                  <DoodleIcon type={service.icon} />
                  <strong>{service.title}</strong>
                  <span className={styles.coverNote}>kişiye göre planlanan süreç</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.mobileControls} aria-label="Defter seçimi">
          <button aria-label="Önceki defter" onClick={previous} type="button">
            <ChevronLeft />
          </button>
          <button aria-label="Sonraki defter" onClick={next} type="button">
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
