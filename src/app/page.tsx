import Image from "next/image";
import Link from "next/link";

import AboutHighlight from "@/components/about-highlight";
import HeroScroll from "@/components/hero-scroll";
import { SiteFooter } from "@/components/public-shell";

import "./home-performance.module.css";

const audiences = [
  {
    accent: "peach",
    description: "Konuşma, dil ve iletişim gelişimini destekleyen sakin ve anlaşılır görüşmeler.",
    eyebrow: "Çocuklar için",
    image: "/audience-cocuk.png",
    title: "Gelişimi anlamaya yönelik başlangıç",
  },
  {
    accent: "sage",
    description: "Gündelik iletişim ihtiyaçlarına saygılı, açık ve iş birliğine dayalı bir süreç.",
    eyebrow: "Ergenler için",
    image: "/audience-ergen.png",
    title: "Kendini ifade etmeye alan açan destek",
  },
  {
    accent: "sand",
    description: "İletişim hedefleri ve yaşam düzeni dikkate alınarak planlanan görüşmeler.",
    eyebrow: "Yetişkinler için",
    image: "/audience-yetiskin.png",
    title: "Kişiye göre şekillenen görüşme alanı",
  },
  {
    accent: "rose",
    description:
      "Ailelerin süreci anlamasına ve sonraki adımı net görmesine yardımcı olan buluşmalar.",
    eyebrow: "Aileler için",
    image: "/audience-aile.png",
    title: "Bilgi ve iş birliği odaklı danışmanlık",
  },
];

export default function Home() {
  return (
    <main id="ana-icerik">
      <HeroScroll />

      <section className="principles-strip" aria-label="Çalışma ilkeleri">
        <article>
          <span>01</span>
          <div>
            <strong>Bilgilendirici yaklaşım</strong>
            <small>Açık, anlaşılır ve sakin bir ilk temas.</small>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <strong>Kontrollü randevu</strong>
            <small>Saat seçiminin yalnızca onay sonrasında kesinleşmesi.</small>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <strong>Mahremiyet odağı</strong>
            <small>Randevu öncesinde yalnızca gerekli bilgilerin istenmesi.</small>
          </div>
        </article>
      </section>

      <div className="about-pin">
        <div className="about-pin-sticky">
          <AboutHighlight />
        </div>
      </div>

      <section className="audience-section" id="destek-alanlari" aria-labelledby="audience-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Destek alanları</p>
            <h2 id="audience-title">Size nasıl destek olabilirim?</h2>
          </div>
          <p>
            Aşağıdaki başlıklar bilgilendirme amaçlıdır; kişiye özel plan ilk görüşmeyle şekillenir.
          </p>
        </div>

        <div className="audience-grid">
          {audiences.map((item) => (
            <article className="audience-card" key={item.eyebrow}>
              <div className={`audience-illustration audience-${item.accent}`} aria-hidden="true">
                <Image
                  className="audience-photo"
                  src={item.image}
                  alt=""
                  width={520}
                  height={430}
                  sizes="(max-width: 900px) 90vw, 280px"
                />
              </div>
              <div className="audience-card-copy">
                <p>{item.eyebrow}</p>
                <h3>{item.title}</h3>
                <span>{item.description}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section" id="sss" aria-labelledby="faq-title">
        <div>
          <p className="section-kicker">Sık sorulan sorular</p>
          <h2 id="faq-title">Merak ettikleriniz</h2>
          <p>Buradaki yanıtlar genel bilgilendirme içindir.</p>
        </div>
        <div className="faq-list">
          <details>
            <summary>Seçtiğim saat hemen kesinleşir mi?</summary>
            <p>Hayır. Saat seçimi bir taleptir; uygunluk kontrolü ve onay sonrasında kesinleşir.</p>
          </details>
          <details>
            <summary>İlk talepte hangi bilgiler istenir?</summary>
            <p>İlk adımda yalnızca iletişim ve planlama için gerekli minimum bilgiler alınır.</p>
          </details>
          <details>
            <summary>İlk görüşme nasıl planlanır?</summary>
            <p>
              Görüşme biçimi ve sonraki adım, ilk temas ve uygunluk değerlendirmesiyle netleşir.
            </p>
          </details>
        </div>
      </section>

      <section className="booking-banner" id="randevu" aria-labelledby="booking-title">
        <div className="booking-copy">
          <p className="section-kicker">Randevu</p>
          <h2 id="booking-title">Sizin için uygun zamanı birlikte planlayalım.</h2>
          <p className="booking-lead">
            Kontrollü randevu talebi ile ilk adımı buradan, yalnızca birkaç dakikada
            oluşturabilirsiniz. Saatiniz uygunluk kontrolü ve onay sonrasında kesinleşir.
          </p>
          <div className="booking-actions">
            <Link className="primary-button" href="/randevu">
              Randevu talebi oluştur
            </Link>
            <Link className="booking-contact" href="/iletisim">
              Ya da iletişime geçin
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <aside className="booking-flowcard" aria-hidden="true">
          <div className="booking-flowcard-head">
            <span className="booking-flowcard-dot" />
            Randevu akışı
          </div>
          <ol className="booking-steplist">
            <li>
              <span className="booking-flownum">01</span>
              <div>
                <strong>Talep</strong>
                <small>Tercih ettiğiniz zamanı iletin.</small>
              </div>
            </li>
            <li>
              <span className="booking-flownum">02</span>
              <div>
                <strong>Kontrol</strong>
                <small>Uygunluk güvenle değerlendirilir.</small>
              </div>
            </li>
            <li>
              <span className="booking-flownum">03</span>
              <div>
                <strong>Onay</strong>
                <small>Saatiniz onayla kesinleşir.</small>
              </div>
            </li>
          </ol>
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
