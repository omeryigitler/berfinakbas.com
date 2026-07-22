import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/hizmetler" },
  description: "Çocuklar, ergenler, yetişkinler ve aileler için bilgilendirici destek alanları.",
  title: "Hizmetler | Berfin Akbaş",
};

const serviceAreas = [
  {
    accent: "peach",
    image: "/audience-cocuk.png",
    label: "Çocuklar",
    text: "İletişim ve konuşma ihtiyaçlarının yaş, aile ve gündelik yaşam bağlamında ele alındığı görüşmeler.",
  },
  {
    accent: "sage",
    image: "/audience-ergen.png",
    label: "Ergenler",
    text: "Ergenin kendini ifade etmesine ve sürece katılmasına alan açan, iş birliği odaklı görüşmeler.",
  },
  {
    accent: "sand",
    image: "/audience-yetiskin.png",
    label: "Yetişkinler",
    text: "Kişinin iletişim hedefleri ve yaşam koşulları dikkate alınarak planlanan görüşmeler.",
  },
  {
    accent: "rose",
    image: "/audience-aile.png",
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

      <section className="service-page-grid service-page-grid-with-images" aria-label="Destek alanları">
        {serviceAreas.map((service, index) => (
          <article className="service-page-card" key={service.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="service-page-card-copy">
              <h2>{service.label}</h2>
              <p>{service.text}</p>
              <Link href="/randevu">Randevu sürecini gör →</Link>
            </div>
            <div
              className={`service-page-card-image service-page-card-image-${service.accent}`}
              aria-hidden="true"
            >
              <Image
                src={service.image}
                alt=""
                width={520}
                height={430}
                sizes="(max-width: 700px) 88vw, (max-width: 1100px) 38vw, 280px"
              />
            </div>
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

      <style>{`
        .service-page-grid-with-images .service-page-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(190px, 0.78fr);
          align-items: center;
          gap: clamp(22px, 3vw, 42px);
          min-height: 300px;
          padding: 34px;
        }

        .service-page-grid-with-images .service-page-card-copy {
          position: relative;
          z-index: 1;
          min-width: 0;
        }

        .service-page-grid-with-images .service-page-card h2 {
          margin-top: 0;
        }

        .service-page-grid-with-images .service-page-card p {
          max-width: 430px;
        }

        .service-page-grid-with-images .service-page-card-image {
          display: grid;
          min-height: 220px;
          place-items: center;
          overflow: hidden;
          border-radius: 24px;
        }

        .service-page-grid-with-images .service-page-card-image-peach {
          background: #f7dfd0;
        }

        .service-page-grid-with-images .service-page-card-image-sage {
          background: #e2e8dc;
        }

        .service-page-grid-with-images .service-page-card-image-sand {
          background: #efe2c8;
        }

        .service-page-grid-with-images .service-page-card-image-rose {
          background: #f2d8d3;
        }

        .service-page-grid-with-images .service-page-card-image img {
          width: 100%;
          height: 100%;
          min-height: 220px;
          object-fit: cover;
        }

        @media (max-width: 980px) {
          .service-page-grid-with-images .service-page-card {
            grid-template-columns: minmax(0, 1fr);
            align-items: stretch;
          }

          .service-page-grid-with-images .service-page-card-image {
            grid-row: 1;
            min-height: 200px;
          }

          .service-page-grid-with-images .service-page-card-copy {
            grid-row: 2;
          }
        }

        @media (max-width: 700px) {
          .service-page-grid-with-images {
            grid-template-columns: 1fr;
          }

          .service-page-grid-with-images .service-page-card {
            padding: 24px;
          }
        }
      `}</style>
    </main>
  );
}
