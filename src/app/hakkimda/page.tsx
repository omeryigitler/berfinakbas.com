import type { Metadata } from "next";
import Link from "next/link";

import { BerfinPortrait, SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  description: "Berfin Akbaş’ın görüşme yaklaşımı ve çalışma prensipleri hakkında bilgi.",
  title: "Hakkımda | Berfin Akbaş",
};

export default function AboutPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <section className="inner-hero portrait-page-layout" aria-labelledby="about-page-title">
        <BerfinPortrait page />
        <div className="inner-copy">
          <p className="section-kicker">Hakkımda</p>
          <h1 id="about-page-title">İletişim ihtiyacını anlamak, doğru soruyla başlar.</h1>
          <p className="inner-lead">
            İlk görüşmede amaç hızlı bir etiket koymak değil; ihtiyacı, gündelik yaşamı ve uygun
            sonraki adımı birlikte anlamaktır.
          </p>
          <p>
            Her danışanın yaşı, iletişim ortamı ve destek ağı farklıdır. Bu nedenle süreç,
            bilgilendirme ve değerlendirme sonrasında kişiye göre planlanır.
          </p>
          <p>
            Çocuklarla yürütülen görüşmelerde aileyle iş birliği; yetişkin görüşmelerinde ise
            kişinin hedefleri ve gündelik ihtiyaçları merkezdedir.
          </p>
          <div className="about-values">
            <span>Dinlemeye alan açan</span>
            <span>Anlaşılır bilgi sunan</span>
            <span>Mahremiyete duyarlı</span>
          </div>
          <Link className="primary-button inner-action" href="/surec">
            Süreci incele
          </Link>
        </div>
      </section>

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
