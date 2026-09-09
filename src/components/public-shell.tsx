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
          <svg className="site-footer-map-drawing" viewBox="0 0 760 360" aria-hidden="true">
            <path className="map-water" d="M0 292c90-35 157-43 234-24 72 18 125 57 194 63 97 9 169-41 238-83 38-23 66-34 94-37v149H0V292Z" />
            <path className="map-coast" d="M0 292c90-35 157-43 234-24 72 18 125 57 194 63 97 9 169-41 238-83 38-23 66-34 94-37" />
            <path className="map-road map-road-main" d="M-20 108C99 97 168 118 245 151c75 33 158 44 260 25 86-16 168-49 275-42" />
            <path className="map-road map-road-main" d="M160-20c8 72 37 124 84 166 43 38 75 77 89 135 8 32 9 60 5 96" />
            <path className="map-road" d="M38 28c66 44 127 64 184 62 76-3 132-44 211-49 84-5 145 33 236 35" />
            <path className="map-road" d="M32 182c74-18 132-12 188 15 64 31 117 40 183 28 64-11 114-43 169-54 58-12 107-7 169 11" />
            <path className="map-road" d="M73 244c63-36 118-47 176-34 67 15 107 55 171 63 61 8 120-18 175-41 50-21 93-26 145-20" />
            <path className="map-road" d="M305 10c7 53-1 94-28 128-31 38-38 82-20 131" />
            <path className="map-road" d="M464 0c-16 47-14 86 7 119 24 38 31 80 17 126" />
            <path className="map-road" d="M594 12c-23 42-28 84-13 125 14 38 16 72 4 106" />
            <path className="map-road-thin" d="M98 66l74 182M122 52l219 220M211 32l291 208M384 28l246 177M522 52l128 125" />
            <path className="map-road-thin" d="M56 138l594 58M84 206l495-84M202 286l371-190" />
            <g className="map-pin" transform="translate(406 144)">
              <path d="M0 0c-22 0-40 18-40 40 0 31 40 74 40 74s40-43 40-74C40 18 22 0 0 0Z" />
              <circle cx="0" cy="39" r="13" />
            </g>
            <g className="map-labels">
              <text x="432" y="132">Kadıköy</text>
              <text x="256" y="262">Moda</text>
              <text x="548" y="205">Rıhtım</text>
            </g>
          </svg>

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
