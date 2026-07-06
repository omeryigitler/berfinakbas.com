import Image from "next/image";
import Link from "next/link";

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
