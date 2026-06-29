import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  description: "Berfin Akbaş için iletişim ve randevu talebi kanalları hakkında bilgi.",
  title: "İletişim | Berfin Akbaş",
};

export default function ContactPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <section className="inner-hero centered-inner-hero" aria-labelledby="contact-title">
        <p className="section-kicker">İletişim</p>
        <h1 id="contact-title">Doğru kanaldan, gerekli kadar bilgiyle başlayın.</h1>
        <p className="inner-lead">
          Randevu ve genel iletişim kanalları yayına çıkmadan önce son kez doğrulanacaktır.
        </p>
      </section>

      <section className="content-card-grid contact-grid">
        <article>
          <span>Randevu</span>
          <h2>Kontrollü talep</h2>
          <p>Saat seçiminiz uygunluk kontrolü ve onay sonrasında kesinleşir.</p>
          <Link href="/randevu">Süreci incele →</Link>
        </article>
        <article>
          <span>Genel iletişim</span>
          <h2>Doğrulanmış kanal</h2>
          <p>
            E-posta ve çalışma konumu, yayın öncesi doğrulama tamamlandığında burada yer alacak.
          </p>
        </article>
        <article>
          <span>Acil durumlar</span>
          <h2>Bu site acil yardım kanalı değildir</h2>
          <p>Acil durumlarda bulunduğunuz yerdeki resmi acil yardım hizmetlerine başvurun.</p>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
