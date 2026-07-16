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
