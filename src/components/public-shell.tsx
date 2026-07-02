import Image from "next/image";
import Link from "next/link";

import styles from "./berfin-portrait.module.css";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark${compact ? " brand-mark-compact" : ""}`}>
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path d="M29 8c-7 0-13 5.8-13 13 0 4.6 2.3 8.7 5.9 11.1V40l6.6-5.8H31c6.1 0 11-5 11-11.1C42 14.8 36.4 8 29 8Z" />
          <path d="M24 17c3.5-2.8 7.2-2.8 11 0M24 22c3.5-2.8 7.2-2.8 11 0M25 27c2.7-1.9 5.5-1.9 8.4 0" />
          <path d="M13.5 10.5c-3 4-4.4 8.5-4 13.5.3 4.5 2.1 8.6 5.2 12" />
        </svg>
      </span>
      <span>
        <strong>Berfin Akbaş</strong>
        {!compact && <small>Dil ve Konuşma Terapisti</small>}
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" aria-label="Berfin Akbaş ana sayfa">
        <BrandMark />
      </Link>
      <nav aria-label="Ana menü">
        <Link href="/hakkimda">Hakkımda</Link>
        <Link href="/hizmetler">Hizmetler</Link>
        <Link href="/surec">Süreç</Link>
        <Link href="/#sss">SSS</Link>
        <Link href="/iletisim">İletişim</Link>
      </nav>
      <Link className="header-cta" href="/randevu">
        Randevu süreci
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/" aria-label="Berfin Akbaş ana sayfa">
        <BrandMark compact />
      </Link>
      <p>Bu site tanı koymaz, sonuç vaat etmez ve kişiye özel sağlık önerisi sunmaz.</p>
      <span>© 2026 Berfin Akbaş</span>
    </footer>
  );
}

export function BerfinPortrait({ page = false }: { page?: boolean }) {
  return (
    <div className={`${styles.portrait}${page ? ` ${styles.page}` : ""}`}>
      <div className={styles.photoFrame}>
        <Image
          src="/berfin-hero.png"
          alt="Berfin Akbaş"
          fill
          priority={page}
          sizes={page ? "(max-width: 980px) 100vw, 430px" : "(max-width: 720px) 100vw, 380px"}
          className={styles.photo}
        />
      </div>
      <div className={`berfin-name-card ${styles.nameCard}`}>
        <small>Tanışın</small>
        <strong>Berfin Akbaş</strong>
        <span>Dil ve Konuşma Terapisti</span>
      </div>
    </div>
  );
}
