import Image from "next/image";
import Link from "next/link";

const footerMapHref =
  "https://www.google.com/maps/search/?api=1&query=Kad%C4%B1k%C3%B6y%2C%20%C4%B0stanbul%2C%20T%C3%BCrkiye";

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
  return (
    <header className="site-header">
      <Link href="/" aria-label="Berfin Akbaş ana sayfa">
        <BrandMark />
      </Link>
      <nav aria-label="Ana menü">
        <Link href="/hizmetler">Hizmetler</Link>
        <Link href="/hakkimda">Hakkımda</Link>
        <Link href="/surec">Süreç</Link>
        <Link href="/#sss">SSS</Link>
        <Link href="/iletisim">İletişim</Link>
      </nav>
      <Link className="header-cta" href="/randevu">
        Randevu Al
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer-sketch">
      <div className="site-footer-top">
        <section className="site-footer-intro" aria-labelledby="footer-brand-title">
          <p className="site-footer-handnote">klinik notları / iletişim ↘</p>
          <Link href="/" aria-label="Berfin Akbaş ana sayfa" id="footer-brand-title">
            <BrandMark compact />
          </Link>
          <p className="site-footer-description">
            Çocuklar, ergenler ve yetişkinler için sakin, anlaşılır ve kişiye göre planlanan dil ve
            konuşma terapisi süreci.
          </p>

          <div className="site-footer-location-copy">
            <span>yüz yüze görüşme</span>
            <strong>Kadıköy, İstanbul</strong>
            <small>Randevu öncesinde görüşme konumu netleştirilir.</small>
          </div>

          <div className="site-footer-actions">
            <Link className="site-footer-cta" href="/randevu">
              Randevu Al <span aria-hidden="true">→</span>
            </Link>
            <Link className="site-footer-text-link" href="/iletisim">
              İletişime geç
            </Link>
          </div>
        </section>

        <a
          className="site-footer-map-card"
          href={footerMapHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Kadıköy konumunu Google Maps'te aç"
        >
          <Image
            src="/footer-kadikoy-map.svg"
            alt=""
            width={1000}
            height={560}
            className="site-footer-map-drawing"
            aria-hidden="true"
          />

          <span className="site-footer-map-grid" aria-hidden="true" />
          <div className="site-footer-map-label">
            <span>konum ↗</span>
            <strong>Kadıköy</strong>
            <small>Google Maps&apos;te aç</small>
          </div>
        </a>
      </div>

      <div className="site-footer-directory">
        <nav className="site-footer-nav" aria-label="Alt menü">
          <span>Keşfet</span>
          <div>
            <Link href="/hizmetler">Hizmetler</Link>
            <Link href="/hakkimda">Hakkımda</Link>
            <Link href="/surec">Süreç</Link>
            <Link href="/randevu">Randevu</Link>
            <Link href="/iletisim">İletişim</Link>
          </div>
        </nav>

        <div className="site-footer-note">
          <span>Bilgi notu</span>
          <p>Bu site tanı koymaz, sonuç vaat etmez ve kişiye özel sağlık önerisi sunmaz.</p>
        </div>

        <div className="site-footer-mode">
          <span>Görüşme biçimi</span>
          <p>Online ve yüz yüze görüşme seçenekleri uygunluk değerlendirmesi sonrasında planlanır.</p>
        </div>
      </div>

      <div className="site-footer-base">
        <span>© 2026 Berfin Akbaş · Tüm hakları saklıdır.</span>
        <nav className="site-footer-legal" aria-label="Yasal bağlantılar">
          <Link href="/kvkk">KVKK</Link>
          <span aria-hidden="true">·</span>
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
