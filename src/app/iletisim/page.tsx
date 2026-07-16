import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";
import { getPublicContactSettings } from "@/lib/public-contact-settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/iletisim" },
  description: "Berfin Akbaş iletişim, çalışma konumu ve kontrollü randevu talebi kanalları.",
  title: "İletişim | Berfin Akbaş",
};

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export default async function ContactPage() {
  const contact = await getPublicContactSettings();
  return (
    <main className="inner-page">
      <SiteHeader />
      <section className="inner-hero centered-inner-hero" aria-labelledby="contact-title">
        <p className="section-kicker">İletişim</p>
        <h1 id="contact-title">Doğru kanaldan, gerekli kadar bilgiyle başlayın.</h1>
        <p className="inner-lead">
          Randevu talebi, genel iletişim ve çalışma konumu bilgilerine buradan ulaşabilirsiniz.
        </p>
      </section>

      <section className="content-card-grid contact-grid">
        <article>
          <span>Randevu</span>
          <h2>Kontrollü talep</h2>
          <p>Saat seçiminiz uygunluk kontrolü ve onay sonrasında kesinleşir.</p>
          <Link href="/randevu">Randevu talebi oluştur →</Link>
        </article>
        <article>
          <span>Çalışma konumu</span>
          <h2>{contact.address}</h2>
          <p>Görüşme biçimi ve açık adres, randevu onayı sırasında netleştirilir.</p>
          {contact.mapsUrl ? (
            <a href={contact.mapsUrl} rel="noreferrer" target="_blank">
              Haritada aç →
            </a>
          ) : null}
        </article>
        <article>
          <span>İletişim kanalları</span>
          <h2>Berfin Akbaş</h2>
          {contact.email ? (
            <p>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
          ) : null}
          {contact.phone ? (
            <p>
              <a href={phoneHref(contact.phone)}>{contact.phone}</a>
            </p>
          ) : null}
          {contact.whatsappUrl ? (
            <p>
              <a href={contact.whatsappUrl} rel="noreferrer" target="_blank">
                WhatsApp üzerinden yazın →
              </a>
            </p>
          ) : null}
          {!contact.email && !contact.phone && !contact.whatsappUrl ? (
            <p>İlk iletişim için güvenli randevu talebi formunu kullanabilirsiniz.</p>
          ) : null}
        </article>
      </section>
      <section className="legal-information-note">
        <strong>Acil durumlar</strong>
        <p>
          Bu site acil yardım kanalı değildir. Acil durumlarda bulunduğunuz yerdeki resmi acil
          yardım hizmetlerine başvurun.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
