import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  description: "Çocuklar, ergenler, yetişkinler ve aileler için bilgilendirici destek alanları.",
  title: "Hizmetler | Berfin Akbaş",
};

const serviceAreas = [
  {
    label: "Çocuklar",
    text: "İletişim ve konuşma ihtiyaçlarının yaş, aile ve gündelik yaşam bağlamında ele alındığı görüşmeler.",
  },
  {
    label: "Ergenler",
    text: "Ergenin kendini ifade etmesine ve sürece katılmasına alan açan, iş birliği odaklı görüşmeler.",
  },
  {
    label: "Yetişkinler",
    text: "Kişinin iletişim hedefleri ve yaşam koşulları dikkate alınarak planlanan görüşmeler.",
  },
  {
    label: "Aileler",
    text: "Ailelerin süreci anlamasına ve doğru sonraki adımı görmesine yardımcı olan bilgilendirme görüşmeleri.",
  },
];

export default function ServicesPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <section className="inner-hero centered-inner-hero" aria-labelledby="services-title">
        <p className="section-kicker">Hizmet alanları</p>
        <h1 id="services-title">Her yaşta iletişim ihtiyacına anlaşılır bir ilk adım.</h1>
        <p className="inner-lead">
          Aşağıdaki başlıklar genel bilgilendirmedir. Kişiye özel görüşme biçimi, ihtiyaç ve
          uygunluk değerlendirildikten sonra planlanır.
        </p>
      </section>

      <section className="service-page-grid" aria-label="Destek alanları">
        {serviceAreas.map((service, index) => (
          <article key={service.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{service.label}</h2>
            <p>{service.text}</p>
            <Link href="/randevu">Randevu sürecini gör →</Link>
          </article>
        ))}
      </section>

      <section className="legal-information-note">
        <strong>Bilgilendirme sınırı</strong>
        <p>
          Bu sayfa tanı koymaz, kişiye özel tedavi önermez ve sonuç garantisi sunmaz. Uygun süreç
          profesyonel görüşme sonrasında belirlenir.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
