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
    image: null,
    imageAlt: "Halka dizme oyuncağı, ABC blokları, oyuncak ayı ve görsel kartların siyah beyaz çizimi",
    label: "Çocuklar",
    text: "İletişim ve konuşma ihtiyaçlarının yaş, aile ve gündelik yaşam bağlamında ele alındığı görüşmeler.",
  },
  {
    accent: "sage",
    image: "/service-teen.webp",
    imageAlt: "Tablet ve kulaklığın siyah beyaz çizimi",
    label: "Ergenler",
    text: "Ergenin kendini ifade etmesine ve sürece katılmasına alan açan, iş birliği odaklı görüşmeler.",
  },
  {
    accent: "sand",
    image: "/service-adult.webp",
    imageAlt: "Defter, açık ajanda, kalem ve kahve fincanının siyah beyaz çizimi",
    label: "Yetişkinler",
    text: "Kişinin iletişim hedefleri ve yaşam koşulları dikkate alınarak planlanan görüşmeler.",
  },
  {
    accent: "rose",
    image: "/service-family.webp",
    imageAlt: "Aile not defteri, görsel kartlar, bitki ve yapboz parçalarının siyah beyaz çizimi",
    label: "Aileler",
    text: "Ailelerin süreci anlamasına ve doğru sonraki adımı görmesine yardımcı olan bilgilendirme görüşmeleri.",
  },
];

function ChildrenIllustration() {
  return (
    <svg
      className="service-visual-art service-children-inline"
      viewBox="0 0 720 540"
      role="img"
      aria-label="Halka dizme oyuncağı, ABC blokları, oyuncak ayı ve görsel kartların siyah beyaz çizimi"
    >
      <defs>
        <filter id="child-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <g fill="#d8d5d0" opacity="0.4" filter="url(#child-soft-shadow)">
        <ellipse cx="168" cy="446" rx="120" ry="18" />
        <ellipse cx="380" cy="449" rx="145" ry="18" />
        <ellipse cx="568" cy="448" rx="106" ry="20" />
      </g>

      <g fill="#fff" stroke="#3f3c38" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(55 104)">
          <path d="M83 0h43c9 0 15 6 15 15v45H68V15C68 6 74 0 83 0Z" />
          <rect x="57" y="50" width="96" height="45" rx="22" />
          <rect x="46" y="88" width="118" height="51" rx="25" />
          <rect x="33" y="132" width="144" height="58" rx="29" />
          <rect x="19" y="183" width="172" height="66" rx="33" />
          <rect x="0" y="240" width="210" height="74" rx="37" />
        </g>

        <g transform="translate(278 166)">
          <g transform="translate(80 -64)">
            <rect width="126" height="126" rx="12" />
            <text x="63" y="68" fill="#3f3c38" stroke="none" fontFamily="Georgia, serif" fontWeight="700" fontSize="64" textAnchor="middle" dominantBaseline="middle">A</text>
          </g>
          <g transform="translate(0 62)">
            <rect width="126" height="126" rx="12" />
            <text x="63" y="68" fill="#3f3c38" stroke="none" fontFamily="Georgia, serif" fontWeight="700" fontSize="64" textAnchor="middle" dominantBaseline="middle">B</text>
          </g>
          <g transform="translate(130 62)">
            <rect width="126" height="126" rx="12" />
            <text x="63" y="68" fill="#3f3c38" stroke="none" fontFamily="Georgia, serif" fontWeight="700" fontSize="64" textAnchor="middle" dominantBaseline="middle">C</text>
          </g>
        </g>

        <g transform="translate(500 91)">
          <circle cx="6" cy="39" r="39" />
          <circle cx="100" cy="39" r="39" />
          <circle cx="53" cy="87" r="70" />
          <ellipse cx="53" cy="219" rx="79" ry="105" />
          <ellipse cx="4" cy="202" rx="35" ry="66" transform="rotate(24 4 202)" />
          <ellipse cx="102" cy="202" rx="35" ry="66" transform="rotate(-24 102 202)" />
          <ellipse cx="18" cy="300" rx="42" ry="53" transform="rotate(10 18 300)" />
          <ellipse cx="88" cy="300" rx="42" ry="53" transform="rotate(-10 88 300)" />
          <ellipse cx="53" cy="101" rx="32" ry="25" />
          <path d="M16 146c18 8 31 21 37 36 7-15 20-28 38-36-1 22-14 40-38 51-23-11-36-29-37-51Z" />
        </g>

        <g transform="translate(220 422) rotate(-6)">
          <rect width="148" height="102" rx="10" />
          <path d="M74 70c-27-19-35-33-24-43 10-9 22-3 24 8 2-11 14-17 24-8 11 10 3 24-24 43Z" />
        </g>
        <g transform="translate(380 418) rotate(5)">
          <rect width="148" height="102" rx="10" />
          <circle cx="74" cy="56" r="22" />
          <circle cx="49" cy="42" r="12" />
          <circle cx="99" cy="42" r="12" />
        </g>
      </g>

      <g fill="none" stroke="#716c66" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M130 129h54M113 181h90M104 222h108M89 270h136M76 322h162M65 383h186" />
        <path d="M526 165v15m0 0c-12 13-22 10-28 3m28-3c12 13 22 10 28 3" />
        <path d="M246 443h96M410 449h90" />
      </g>

      <g fill="#3f3c38">
        <circle cx="506" cy="165" r="7" />
        <circle cx="546" cy="165" r="7" />
      </g>
    </svg>
  );
}

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
            <div className="service-visual-image">
              {service.image ? (
                <Image
                  src={service.image}
                  alt={service.imageAlt}
                  width={320}
                  height={240}
                  className="service-visual-art"
                />
              ) : (
                <ChildrenIllustration />
              )}
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

        .service-page-grid-visual .service-visual-art {
          width: min(100%, 300px);
          height: auto;
          object-fit: contain;
          opacity: 0.96;
          transform-origin: 50% 60%;
          transition:
            transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
            filter 280ms ease,
            opacity 280ms ease;
        }

        .service-page-grid-visual .service-children-inline {
          display: block;
          overflow: visible;
        }

        .service-page-grid-visual .service-visual-card:hover .service-visual-art {
          filter: contrast(1.08);
          opacity: 1;
          transform: translateY(-8px) scale(1.045) rotate(-1deg);
        }

        .service-page-grid-visual .service-visual-card:nth-child(even):hover .service-visual-art {
          transform: translateY(-8px) scale(1.045) rotate(1deg);
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

          .service-page-grid-visual .service-visual-art {
            width: min(100%, 270px);
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

          .service-page-grid-visual .service-visual-art {
            width: min(84vw, 300px);
          }

          .service-page-grid-visual .service-visual-copy {
            grid-row: 2;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .service-page-grid-visual .service-visual-card,
          .service-page-grid-visual .service-visual-copy a,
          .service-page-grid-visual .service-visual-art {
            transition: none;
          }

          .service-page-grid-visual .service-visual-card:hover,
          .service-page-grid-visual .service-visual-card:nth-child(even):hover,
          .service-page-grid-visual .service-visual-card:hover .service-visual-art,
          .service-page-grid-visual .service-visual-card:nth-child(even):hover .service-visual-art {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
