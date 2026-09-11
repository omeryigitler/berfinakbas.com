import type { Metadata } from "next";

import AboutHighlight from "@/components/about-highlight";
import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/hakkimda" },
  description: "Berfin Akbaş’ın görüşme yaklaşımı ve çalışma prensipleri hakkında bilgi.",
  title: "Hakkımda | Berfin Akbaş",
};

const aboutPageValues = [
  {
    label: "01",
    text: "Görüşme biçimi ve sonraki adım, ilk temasın ardından netleştirilir.",
    title: "Önce ihtiyaç",
  },
  {
    label: "02",
    text: "Randevu öncesinde yalnızca planlama için gerekli bilgiler istenir.",
    title: "Minimum veri",
  },
  {
    label: "03",
    text: "Talep, değerlendirme ve onay durumları anlaşılır biçimde paylaşılır.",
    title: "Açık iletişim",
  },
];

export default function AboutPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <style>{`
        /* Hakkımda page only: keep the shared visual language, but prevent the
           absolutely-positioned portrait notes from colliding with the copy. */
        .inner-page #hakkimda {
          align-items: start;
          gap: clamp(52px, 5vw, 74px);
          padding-block: clamp(52px, 5.4vw, 70px) clamp(58px, 6vw, 78px);
        }

        .inner-page #hakkimda > div:first-child {
          min-height: 530px;
        }

        .inner-page #hakkimda .sketch-about-name-card {
          top: 24px;
          right: -18px;
          width: min(62%, 218px);
          padding: 13px 16px 14px;
        }

        .inner-page #hakkimda .sketch-about-name-card > strong {
          margin-top: 4px;
          font-size: 1.48rem;
        }

        .inner-page #hakkimda .sketch-about-name-card > small {
          margin-top: 2px;
        }

        .inner-page #hakkimda .sketch-about-note-card {
          bottom: -10px;
          left: -42px;
        }

        .inner-page #hakkimda .sketch-about-copy > h1 {
          max-width: 690px;
          font-size: clamp(3.05rem, 4.35vw, 4.55rem);
          line-height: 0.97;
        }

        .inner-page #hakkimda .sketch-about-copy > p:not(.section-kicker) {
          margin-top: 13px;
          line-height: 1.64;
        }

        .inner-page #hakkimda .sketch-about-values {
          gap: 10px;
          margin-top: 20px;
        }

        .inner-page #hakkimda .sketch-about-values article {
          min-height: 128px;
          padding: 16px 42px 16px 18px;
        }

        .inner-page #hakkimda .sketch-about-values article > strong {
          margin-top: 13px;
        }

        .inner-page #hakkimda .sketch-about-values article > small {
          margin-top: 7px;
          line-height: 1.48;
        }

        .inner-page #hakkimda .sketch-about-copy > div:last-child {
          margin-top: 22px;
        }

        @media (max-width: 980px) {
          .inner-page #hakkimda {
            gap: 38px;
          }

          .inner-page #hakkimda > div:first-child {
            min-height: 500px;
          }

          .inner-page #hakkimda .sketch-about-name-card {
            right: -8px;
          }

          .inner-page #hakkimda .sketch-about-copy > h1 {
            font-size: clamp(2.8rem, 5.6vw, 4rem);
          }
        }

        @media (max-width: 720px) {
          .inner-page #hakkimda {
            gap: 30px;
            padding-block: 46px 58px;
          }

          .inner-page #hakkimda > div:first-child {
            min-height: 500px;
          }

          .inner-page #hakkimda .sketch-about-name-card {
            top: 14px;
            right: 14px;
            width: min(62%, 210px);
            padding: 13px 15px 14px;
          }

          .inner-page #hakkimda .sketch-about-note-card {
            left: -18px;
          }
        }
      `}</style>
      <AboutHighlight
        isPage
        title="İletişim ihtiyacını anlamak, doğru soruyla başlar."
        lead="İlk görüşmede amaç hızlı bir etiket koymak değil; ihtiyacı, gündelik yaşamı ve uygun sonraki adımı birlikte anlamaktır."
        paragraphs={[
          "Her danışanın yaşı, iletişim ortamı ve destek ağı farklıdır. Bu nedenle süreç, bilgilendirme ve değerlendirme sonrasında kişiye göre planlanır.",
          "Çocuklarla yürütülen görüşmelerde aileyle iş birliği; yetişkin görüşmelerinde ise kişinin hedefleri ve gündelik ihtiyaçları merkezdedir.",
        ]}
        values={aboutPageValues}
        actionLabel="Süreci incele"
        showSecondaryAction={false}
      />

      <section className="inner-band" aria-labelledby="principles-title">
        <div>
          <p className="section-kicker">Çalışma prensipleri</p>
          <h2 id="principles-title">Sakin, açık ve öngörülebilir bir görüşme akışı.</h2>
        </div>
        <div className="content-card-grid content-card-grid-three">
          <article>
            <span>01</span>
            <h3>Önce ihtiyaç</h3>
            <p>Görüşme biçimi ve sonraki adım, ilk temasın ardından netleştirilir.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Minimum veri</h3>
            <p>Randevu öncesinde yalnızca planlama için gerekli bilgiler istenir.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Açık iletişim</h3>
            <p>Talep, değerlendirme ve onay durumları anlaşılır biçimde paylaşılır.</p>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
