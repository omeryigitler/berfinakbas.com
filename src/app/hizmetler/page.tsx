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

      <section className="service-visual-hero" aria-labelledby="services-title">
        <div>
          <p className="section-kicker">İhtiyacınızı anlamanın bir ilk adımı</p>
          <h1 id="services-title">İhtiyacınıza yaklaşım bir ilk adım.</h1>
        </div>
        <p>
          Aşağıdaki başlıklar genel bilgilendirmedir. Kişiye özel görüşme biçimi, ihtiyaç ve
          uygunluk değerlendirildikten sonra planlanır.
        </p>
      </section>

      <section className="service-page-grid service-page-grid-visual" aria-label="Destek alanları">
        {serviceAreas.map((service, index) => (
          <article className={`service-visual-card service-visual-card-${service.accent}`} key={service.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="service-visual-copy">
              <h2>{service.label}</h2>
              <p>{service.text}</p>
              <Link href="/randevu">Randevu sürecini gör →</Link>
            </div>
            <div className="service-visual-image" aria-hidden="true">
              <Image
                src={service.image}
                alt=""
                width={520}
                height={430}
                sizes="(max-width: 700px) 88vw, (max-width: 1100px) 42vw, 300px"
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
        .service-visual-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(340px, 0.78fr);
          align-items: end;
          gap: clamp(48px, 8vw, 120px);
          width: min(1180px, calc(100% - 40px));
          margin-inline: auto;
          padding-block: 92px 72px;
        }

        .service-visual-hero h1 {
          max-width: 670px;
          margin: 0;
          font-family: var(--serif);
          font-size: clamp(3.2rem, 5.6vw, 5.6rem);
          font-weight: 500;
          letter-spacing: -0.05em;
          line-height: 0.96;
        }

        .service-visual-hero > p {
          max-width: 500px;
          margin: 0 0 10px;
          color: var(--muted);
          line-height: 1.75;
        }

        .service-page-grid-visual {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .service-page-grid-visual .service-visual-card {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(220px, 1.1fr);
          align-items: center;
          gap: 18px;
          min-height: 320px;
          overflow: hidden;
          padding: 34px 18px 34px 34px;
          background: rgb(255 255 255 / 62%);
        }

        .service-page-grid-visual .service-visual-card-peach {
          background:
            radial-gradient(circle at 84% 56%, rgb(247 223 208 / 92%), transparent 48%),
            rgb(255 255 255 / 68%);
        }

        .service-page-grid-visual .service-visual-card-sage {
          background:
            radial-gradient(circle at 84% 56%, rgb(226 232 220 / 95%), transparent 48%),
            rgb(255 255 255 / 68%);
        }

        .service-page-grid-visual .service-visual-card-sand {
          background:
            radial-gradient(circle at 84% 56%, rgb(239 226 200 / 95%), transparent 48%),
            rgb(255 255 255 / 68%);
        }

        .service-page-grid-visual .service-visual-card-rose {
          background:
            radial-gradient(circle at 84% 56%, rgb(242 216 211 / 94%), transparent 48%),
            rgb(255 255 255 / 68%);
        }

        .service-page-grid-visual .service-visual-copy {
          position: relative;
          z-index: 2;
          min-width: 0;
        }

        .service-page-grid-visual .service-visual-copy h2 {
          margin: 0;
          font-size: clamp(1.9rem, 2.7vw, 2.45rem);
        }

        .service-page-grid-visual .service-visual-copy p {
          max-width: 310px;
          margin-top: 18px;
        }

        .service-page-grid-visual .service-visual-copy a {
          margin-top: 30px;
        }

        .service-page-grid-visual .service-visual-image {
          position: relative;
          z-index: 1;
          display: grid;
          width: 100%;
          min-width: 0;
          place-items: center;
          align-self: stretch;
        }

        .service-page-grid-visual .service-visual-image img {
          width: 112%;
          max-width: none;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }

        @media (max-width: 980px) {
          .service-visual-hero {
            grid-template-columns: 1fr;
            align-items: start;
            gap: 24px;
            padding-block: 72px 54px;
          }

          .service-visual-hero > p {
            max-width: 680px;
            margin: 0;
          }

          .service-page-grid-visual .service-visual-card {
            grid-template-columns: minmax(0, 0.9fr) minmax(170px, 1.1fr);
            min-height: 300px;
          }
        }

        @media (max-width: 700px) {
          .service-page-grid-visual {
            grid-template-columns: 1fr;
          }

          .service-page-grid-visual .service-visual-card {
            grid-template-columns: minmax(0, 1fr);
            gap: 10px;
            padding: 26px;
          }

          .service-page-grid-visual .service-visual-image {
            min-height: 210px;
            grid-row: 1;
          }

          .service-page-grid-visual .service-visual-image img {
            width: 100%;
          }

          .service-page-grid-visual .service-visual-copy {
            grid-row: 2;
          }
        }
      `}</style>
    </main>
  );
}
