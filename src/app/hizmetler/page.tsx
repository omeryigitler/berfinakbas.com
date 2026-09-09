import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";
import { ServiceSketchIllustration } from "@/components/service-sketch-illustration";

export const metadata: Metadata = {
  alternates: { canonical: "/hizmetler" },
  description: "Çocuklar, ergenler, yetişkinler ve aileler için bilgilendirici destek alanları.",
  title: "Hizmetler | Berfin Akbaş",
};

const serviceAreas = [
  {
    accent: "peach",
    illustration: "children" as const,
    label: "Çocuklar",
    text: "İletişim ve konuşma ihtiyaçlarının yaş, aile ve gündelik yaşam bağlamında ele alındığı görüşmeler.",
  },
  {
    accent: "sage",
    illustration: "teen" as const,
    label: "Ergenler",
    text: "Ergenin kendini ifade etmesine ve sürece katılmasına alan açan, iş birliği odaklı görüşmeler.",
  },
  {
    accent: "sand",
    illustration: "adult" as const,
    label: "Yetişkinler",
    text: "Kişinin iletişim hedefleri ve yaşam koşulları dikkate alınarak planlanan görüşmeler.",
  },
  {
    accent: "rose",
    illustration: "family" as const,
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
          <article
            className={`service-visual-card service-visual-card-${service.accent}`}
            key={service.label}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="service-visual-copy">
              <h2>{service.label}</h2>
              <p>{service.text}</p>
              <Link href="/randevu">Randevu sürecini gör →</Link>
            </div>
            <div className="service-visual-image" aria-hidden="true">
              <ServiceSketchIllustration type={service.illustration} />
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
          font-size: clamp(3.2rem, 5.6vw, 5.6rem);
          line-height: 0.96;
        }

        .service-visual-hero > p {
          max-width: 500px;
          margin: 0 0 10px;
          color: var(--sketch-muted);
          line-height: 1.75;
        }

        .service-page-grid-visual {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .service-page-grid-visual .service-visual-card {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(220px, 1.08fr);
          align-items: center;
          gap: 18px;
          min-height: 320px;
          overflow: hidden;
          padding: 34px 18px 34px 34px;
          border-color: rgb(63 60 56 / 54%);
          background-color: rgb(255 255 255 / 70%);
          background-image:
            linear-gradient(rgb(63 60 56 / 3.4%) 1px, transparent 1px),
            linear-gradient(90deg, rgb(63 60 56 / 3.4%) 1px, transparent 1px);
          background-size: 25px 25px;
          box-shadow: 6px 7px 0 rgb(63 60 56 / 10%);
          transition:
            transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 320ms ease,
            border-color 320ms ease,
            background-color 320ms ease;
        }

        .service-page-grid-visual .service-visual-card:hover {
          transform: translateY(-7px) rotate(-0.3deg);
          border-color: rgb(63 60 56 / 70%);
          background-color: rgb(255 255 255 / 82%);
          box-shadow:
            8px 10px 0 rgb(63 60 56 / 11%),
            0 28px 50px rgb(40 37 34 / 10%);
        }

        .service-page-grid-visual .service-visual-card:nth-child(even):hover {
          transform: translateY(-7px) rotate(0.3deg);
        }

        .service-page-grid-visual .service-visual-card:hover > span {
          color: var(--sketch-teal);
          font-size: 1rem;
          text-shadow: 0 7px 16px rgb(8 164 156 / 18%);
          transform: scale(1.08) rotate(-4deg);
        }

        .service-page-grid-visual .service-visual-card-peach {
          background-color: #f5f3ef;
        }

        .service-page-grid-visual .service-visual-card-sage {
          background-color: #efefeb;
        }

        .service-page-grid-visual .service-visual-card-sand {
          background-color: #f2f0eb;
        }

        .service-page-grid-visual .service-visual-card-rose {
          background-color: #f4f2ef;
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
          transition: transform 220ms ease, color 220ms ease;
        }

        .service-page-grid-visual .service-visual-card:hover .service-visual-copy a {
          color: var(--sketch-teal);
          transform: translateX(3px);
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

          .service-page-grid-visual .service-visual-copy {
            grid-row: 2;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .service-page-grid-visual .service-visual-card,
          .service-page-grid-visual .service-visual-copy a {
            transition: none;
          }

          .service-page-grid-visual .service-visual-card:hover,
          .service-page-grid-visual .service-visual-card:nth-child(even):hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
