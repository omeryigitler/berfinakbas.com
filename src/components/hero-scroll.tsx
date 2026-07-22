"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BrandMark } from "@/components/public-shell";
import { getHeroMotionState, heroContent } from "./hero-scroll-model";
import styles from "./hero-scroll.module.css";

const MOBILE_HERO_QUERY = "(max-width: 980px)";

type ContactLinks = {
  email: string;
  instagram: string;
  phone: string;
  whatsapp: string;
};

const defaultContactLinks: ContactLinks = {
  email: "/iletisim",
  instagram: "/iletisim",
  phone: "/iletisim",
  whatsapp: "/iletisim",
};

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

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5.2 18.2 3.8 21l3.3-1a9 9 0 1 0-1.9-1.8Z" />
      <path d="M8.2 9.3h7.6M8.2 13h5.2" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 11.8a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.8Z" />
      <path d="M9 8.2c.2-.4.4-.4.7-.4h.5l.8 1.8c.1.3.1.5-.1.7l-.6.7c-.2.2-.1.4 0 .6.7 1.2 1.7 2.2 3 2.8.3.1.5.1.7-.1l.8-1c.2-.2.4-.3.7-.2l1.7.8c.3.1.4.3.4.6 0 .5-.3 1.3-.8 1.7-.5.4-1.2.7-2 .5-1.1-.2-2.6-.7-4.4-2.2-1.4-1.2-2.4-2.7-2.8-3.7-.4-1-.1-1.9.4-2.4Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.3" cy="6.8" r=".7" className="filled" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7.2 3.8 9.5 8c.2.4.1.8-.2 1.1l-1.2 1.2a14 14 0 0 0 5.6 5.6l1.2-1.2c.3-.3.7-.4 1.1-.2l4.2 2.3c.4.2.6.7.5 1.1l-.5 2c-.1.5-.6.8-1.1.8C10.4 20.7 3.3 13.6 3.3 4.9c0-.5.3-1 .8-1.1l2-.5c.4-.1.9.1 1.1.5Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m5 7 7 5.5L19 7" />
    </svg>
  );
}

function ContactFab({ links }: { links: ContactLinks }) {
  const [isOpen, setIsOpen] = useState(false);
  const actions = [
    { href: links.whatsapp, icon: <WhatsAppIcon />, label: "WhatsApp ile bize ulaşın" },
    { href: links.instagram, icon: <InstagramIcon />, label: "Instagram'da bizi takip edin" },
    { href: links.phone, icon: <PhoneIcon />, label: "Telefonla bizi arayın" },
    { href: links.email, icon: <MailIcon />, label: "E-posta gönderin" },
  ];

  return (
    <div className={`contact-fab ${isOpen ? "is-open" : ""}`}>
      {isOpen ? (
        <div className="contact-fab-menu" id="contact-fab-menu" role="menu">
          <div className="contact-fab-heading">
            <span className="contact-fab-mini-brand">
              <span className="brand-symbol" aria-hidden="true">
                <Image src="/logo-mark.png" alt="" width={36} height={36} />
              </span>
              <strong>Berfin Akbaş</strong>
            </span>
          </div>
          {actions.map((action) => {
            const external = action.href.startsWith("http");
            return (
              <a
                href={action.href}
                key={action.label}
                onClick={() => setIsOpen(false)}
                rel={external ? "noreferrer" : undefined}
                role="menuitem"
                target={external ? "_blank" : undefined}
              >
                <span className="contact-fab-label">{action.label}</span>
                <span className="contact-fab-action-icon">{action.icon}</span>
              </a>
            );
          })}
        </div>
      ) : null}

      <button
        aria-controls="contact-fab-menu"
        aria-expanded={isOpen}
        aria-label={isOpen ? "İletişim menüsünü kapat" : "İletişim menüsünü aç"}
        className="contact-fab-trigger"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        {isOpen ? <span className="contact-fab-close">×</span> : <ChatIcon />}
      </button>
    </div>
  );
}

export default function HeroScroll() {
  const heroRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [contactLinks, setContactLinks] = useState<ContactLinks>(defaultContactLinks);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/iletisim", { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error("contact"))))
      .then((html) => {
        if (!active) return;
        const documentFragment = new DOMParser().parseFromString(html, "text/html");
        const hrefs = Array.from(documentFragment.querySelectorAll<HTMLAnchorElement>("a[href]"))
          .map((anchor) => anchor.getAttribute("href") || "")
          .filter(Boolean);
        const phone = hrefs.find((href) => href.startsWith("tel:"));
        const email = hrefs.find((href) => href.startsWith("mailto:"));
        const whatsapp = hrefs.find(
          (href) => href.includes("wa.me") || href.includes("whatsapp.com") || href.includes("WhatsApp"),
        );
        const instagram = hrefs.find((href) => href.includes("instagram.com"));
        const phoneDigits = phone?.replace(/\D/g, "");

        setContactLinks({
          email: email || "/iletisim",
          instagram: instagram || "/iletisim",
          phone: phone || "/iletisim",
          whatsapp: whatsapp || (phoneDigits ? `https://wa.me/${phoneDigits}` : "/iletisim"),
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) return;

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
      if (hero.dataset.motion !== "scroll" || animationFrame !== null) return;
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

  const mobileMenu = isMounted && isMenuOpen
    ? createPortal(
        <div className="hero-mobile-menu-backdrop" onMouseDown={() => setIsMenuOpen(false)}>
          <div
            aria-label="Mobil menü"
            aria-modal="true"
            className="hero-mobile-menu-panel"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Menüyü kapat"
              className="hero-mobile-menu-close"
              onClick={() => setIsMenuOpen(false)}
              type="button"
            >
              <span />
              <span />
            </button>

            <Link
              className="hero-mobile-menu-brand"
              href="/"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Berfin Akbaş ana sayfa"
            >
              <BrandMark />
            </Link>

            <nav aria-label="Mobil menü bağlantıları">
              <Link href="/hizmetler" onClick={() => setIsMenuOpen(false)}>Hizmetler</Link>
              <Link href="/hakkimda" onClick={() => setIsMenuOpen(false)}>Hakkımda</Link>
              <Link href="/surec" onClick={() => setIsMenuOpen(false)}>Terapi Yaklaşımı</Link>
              <Link className="hero-mobile-menu-booking" href="/randevu" onClick={() => setIsMenuOpen(false)}>
                Randevu Talebi
              </Link>
              <Link href="/iletisim" onClick={() => setIsMenuOpen(false)}>İletişim</Link>
            </nav>

            <div className="hero-mobile-menu-actions">
              <Link className="primary-button" href="/randevu" onClick={() => setIsMenuOpen(false)}>
                Online Randevu Talebi Oluştur
              </Link>
              <Link className="secondary-button" href="/hizmetler" onClick={() => setIsMenuOpen(false)}>
                Hizmetleri İncele
              </Link>
            </div>

            <small>© Berfin Akbaş 2026</small>
          </div>
        </div>,
        document.body,
      )
    : null;

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
          <button
            aria-expanded={isMenuOpen}
            aria-label="Menüyü aç"
            className="hero-mobile-menu-trigger"
            onClick={() => setIsMenuOpen(true)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
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

      {mobileMenu}
      <ContactFab links={contactLinks} />

      <style jsx global>{`
        .hero-mobile-menu-trigger,
        .hero-progress-card-mobile {
          display: none;
        }

        .hero-mobile-menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 12px;
          background: rgb(43 37 33 / 76%);
        }

        .hero-mobile-menu-panel {
          position: relative;
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          align-items: center;
          width: min(420px, 100%);
          height: min(920px, calc(100dvh - 24px));
          overflow-y: auto;
          padding: 28px 22px 24px;
          border: 1px solid rgb(255 255 255 / 68%);
          border-radius: 30px;
          background:
            linear-gradient(180deg, rgb(255 250 244 / 94%), rgb(250 239 228 / 97%)),
            rgb(255 250 244 / 96%);
          box-shadow:
            0 28px 80px rgb(36 27 22 / 32%),
            inset 0 1px 0 rgb(255 255 255 / 90%);
          backdrop-filter: blur(28px) saturate(1.15);
        }

        .hero-mobile-menu-close {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 2;
          width: 46px;
          height: 46px;
          border: 1px solid rgb(88 62 49 / 16%);
          border-radius: 50%;
          background: rgb(255 250 244 / 68%);
          cursor: pointer;
        }

        .hero-mobile-menu-close span {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 22px;
          height: 2px;
          border-radius: 999px;
          background: var(--ink);
        }

        .hero-mobile-menu-close span:first-child {
          transform: translate(-50%, -50%) rotate(45deg);
        }

        .hero-mobile-menu-close span:last-child {
          transform: translate(-50%, -50%) rotate(-45deg);
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
          display: grid;
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

        .contact-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 9000;
          display: grid;
          justify-items: end;
          gap: 12px;
        }

        .contact-fab-trigger {
          display: grid;
          width: 58px;
          height: 58px;
          place-items: center;
          border: 1px solid rgb(255 255 255 / 58%);
          border-radius: 50%;
          background: var(--coral);
          color: white;
          box-shadow: 0 16px 36px rgb(116 51 32 / 30%);
          cursor: pointer;
        }

        .contact-fab-trigger svg {
          width: 27px;
          height: 27px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.8;
        }

        .contact-fab-close {
          font-family: Arial, sans-serif;
          font-size: 2rem;
          font-weight: 300;
          line-height: 1;
        }

        .contact-fab-menu {
          display: grid;
          width: 286px;
          overflow: hidden;
          border: 1px solid rgb(88 62 49 / 13%);
          border-radius: 24px;
          background: rgb(255 250 244 / 96%);
          box-shadow: 0 22px 60px rgb(54 37 28 / 22%);
          backdrop-filter: blur(22px);
        }

        .contact-fab-heading {
          display: flex;
          justify-content: center;
          padding: 17px 18px 13px;
          border-bottom: 1px solid rgb(88 62 49 / 10%);
        }

        .contact-fab-mini-brand {
          display: inline-flex;
          gap: 9px;
          align-items: center;
          font-family: var(--serif);
        }

        .contact-fab-mini-brand .brand-symbol {
          width: 36px;
          height: 36px;
        }

        .contact-fab-menu > a {
          display: grid;
          grid-template-columns: 1fr 36px;
          gap: 12px;
          align-items: center;
          padding: 11px 14px 11px 17px;
          border-bottom: 1px solid rgb(88 62 49 / 9%);
          color: var(--ink);
          font-size: 0.76rem;
          font-weight: 650;
        }

        .contact-fab-menu > a:last-child {
          border-bottom: 0;
        }

        .contact-fab-action-icon {
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border-radius: 50%;
          background: rgb(217 111 77 / 13%);
          color: var(--coral-dark);
        }

        .contact-fab-action-icon svg {
          width: 19px;
          height: 19px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.7;
        }

        .contact-fab-action-icon svg .filled {
          fill: currentColor;
          stroke: none;
        }

        @media (max-width: 980px) {
          .${styles.scrollHero} {
            height: auto;
            min-height: 900px;
          }

          .${styles.scrollHeroSticky} {
            position: relative;
            top: auto;
            height: 900px;
            min-height: 900px;
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

          .hero-mobile-menu-trigger {
            display: grid;
            width: 44px;
            height: 44px;
            place-content: center;
            gap: 5px;
            justify-self: end;
            border: 1px solid rgb(88 62 49 / 13%);
            border-radius: 50%;
            background: rgb(255 255 255 / 44%);
            cursor: pointer;
          }

          .hero-mobile-menu-trigger span {
            display: block;
            width: 21px;
            height: 2px;
            border-radius: 999px;
            background: var(--ink);
          }

          .${styles.scrollHeroPortrait} {
            top: 96px;
            bottom: auto;
            left: 50%;
            z-index: 12;
            width: min(350px, 90vw);
            height: 490px;
            min-height: 490px;
            transform: translateX(-50%) scale(1);
            transform-origin: top center;
            -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 76%, transparent 100%);
            mask-image: linear-gradient(180deg, #000 0%, #000 76%, transparent 100%);
          }

          .${styles.scrollHeroCopy} {
            top: 425px;
            right: auto;
            bottom: auto;
            left: 0;
            z-index: 20;
            width: 100%;
            padding: 0 4px 18px;
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

          .contact-fab {
            right: 16px;
            bottom: 18px;
          }

          .contact-fab-menu {
            width: auto;
            overflow: visible;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
          }

          .contact-fab-heading {
            display: none;
          }

          .contact-fab-menu > a {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 4px 0;
            border: 0;
          }

          .contact-fab-label {
            max-width: 190px;
            border: 1px solid rgb(88 62 49 / 11%);
            border-radius: 10px;
            background: rgb(255 250 244 / 96%);
            padding: 8px 10px;
            box-shadow: 0 8px 22px rgb(54 37 28 / 16%);
            color: var(--ink);
            font-size: 0.68rem;
            text-align: right;
          }

          .contact-fab-action-icon {
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
            background: var(--coral);
            color: white;
            box-shadow: 0 10px 24px rgb(116 51 32 / 25%);
          }

          .contact-fab-trigger {
            width: 56px;
            height: 56px;
          }
        }

        @media (max-width: 420px) {
          .${styles.scrollHero},
          .${styles.scrollHeroSticky} {
            height: 855px;
            min-height: 855px;
          }

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
            height: calc(100dvh - 16px);
            padding: 24px 18px 20px;
            border-radius: 26px;
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
            top: 92px;
            width: min(335px, 94vw);
            height: 460px;
            min-height: 460px;
          }

          .${styles.scrollHeroCopy} {
            top: 405px;
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
