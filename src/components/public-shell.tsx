"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand-mark brand-mark-compact" : "brand-mark"}>
      <span className="brand-symbol" aria-hidden="true">
        <Image src="/logo-mark.png" alt="" width={44} height={44} />
      </span>
      <span>
        <strong>Berfin Akbaş</strong>
        {!compact && <small>Dil ve Konuşma Terapisti</small>}
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  function handleBrandClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/") return;

    event.preventDefault();
    if (event.detail >= 3) {
      router.push("/yonetim");
    }
  }

  return (
    <header className="site-header">
      <Link href="/" aria-label="Berfin Akbaş ana sayfa" onClick={handleBrandClick}>
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
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <Link href="/" aria-label="Berfin Akbaş ana sayfa">
            <BrandMark compact />
          </Link>
          <p>
            Çocuklar, ergenler ve yetişkinler için sıcak, güven veren ve kişiye özel dil ve konuşma
            terapisi.
          </p>
          <Link className="site-footer-cta" href="/randevu">
            Randevu süreci
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <nav className="site-footer-nav" aria-label="Alt menü">
          <span>Keşfet</span>
          <Link href="/hizmetler">Hizmetler</Link>
          <Link href="/hakkimda">Hakkımda</Link>
          <Link href="/surec">Süreç</Link>
          <Link href="/randevu">Randevu</Link>
          <Link href="/iletisim">İletişim</Link>
        </nav>

        <div className="site-footer-note">
          <span>Bilgi</span>
          <p>Bu site tanı koymaz, sonuç vaat etmez ve kişiye özel sağlık önerisi sunmaz.</p>
        </div>
      </div>

      <div className="site-footer-base">
        <span>© 2026 Berfin Akbaş · Tüm hakları saklıdır.</span>
        <nav className="site-footer-legal" aria-label="Yasal bağlantılar">
          <Link href="/kvkk">KVKK</Link>
          <Link href="/gizlilik">Gizlilik ve çerezler</Link>
        </nav>
        <p className="site-footer-credit">
          Designed &amp; Developed by{" "}
          <a href="https://omeryigitler.com" target="_blank" rel="noreferrer">
            Ömer YİĞİTLER
          </a>
        </p>
      </div>
    </footer>
  );
}
