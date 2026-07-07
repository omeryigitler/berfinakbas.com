import Image from "next/image";
import Link from "next/link";

import footer from "./public-footer.module.css";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark${compact ? "brand-mark-compact" : ""}`}>
      <span className="brand-symbol" aria-hidden="true">
        <Image
          alt=""
          className="brand-logo-image"
          height={44}
          priority={!compact}
          src="/logo.png"
          width={44}
        />
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
    <footer className={footer.footer}>
      <div className={footer.main}>
        <div className={footer.brand}>
          <Link href="/" aria-label="Berfin Akbaş ana sayfa">
            <BrandMark compact />
          </Link>
          <p>
            Çocuklar, ergenler ve yetişkinler için sıcak, güven veren ve kişiye özel dil ve konuşma
            terapisi.
          </p>
          <Link className={footer.cta} href="/randevu">
            Randevu süreci
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <nav className={footer.nav} aria-label="Alt menü">
          <span>Keşfet</span>
          <Link href="/hizmetler">Hizmetler</Link>
          <Link href="/hakkimda">Hakkımda</Link>
          <Link href="/surec">Süreç</Link>
          <Link href="/randevu">Randevu</Link>
          <Link href="/iletisim">İletişim</Link>
        </nav>

        <div className={footer.note}>
          <span>Bilgi</span>
          <p>Bu site tanı koymaz, sonuç vaat etmez ve kişiye özel sağlık önerisi sunmaz.</p>
        </div>
      </div>

      <div className={footer.base}>
        <span>© 2026 Berfin Akbaş · Tüm hakları saklıdır.</span>
        <p className={footer.credit}>
          Designed &amp; Developed by{" "}
          <a href="https://omeryigitler.com" target="_blank" rel="noreferrer">
            Ömer YİĞİTLER
          </a>
        </p>
      </div>
    </footer>
  );
}

export function BerfinPortrait({ page = false }: { page?: boolean }) {
  return (
    <div className={`berfin-visual${page ? "berfin-visual-page" : ""}`}>
      <div aria-label="Berfin Akbaş, beyaz kıyafetli portre" className="berfin-photo" role="img" />
      <div className="berfin-name-card">
        <small>Tanışın</small>
        <strong>Berfin Akbaş</strong>
        <span>Dil ve Konuşma Terapisti</span>
      </div>
    </div>
  );
}
