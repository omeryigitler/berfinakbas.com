import Image from "next/image";

import AboutHighlight from "@/components/about-highlight";
import HeroScroll from "@/components/hero-scroll";
import { SiteFooter } from "@/components/public-shell";

import styles from "./principles-hover.module.css";

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

const steps = [
  {
    index: "01",
    text: "İhtiyacınızı ve tercih ettiğiniz görüşme biçimini kısaca belirtin.",
    title: "Talebinizi iletin",
  },
  {
    index: "02",
    text: "Uygunluk ve gerekli minimum bilgiler güvenli biçimde kontrol edilsin.",
    title: "Uygunluk değerlendirilsin",
  },
  {
    index: "03",
    text: "Saatiniz yalnızca onay sonrasında kesin randevu olarak kaydedilsin.",
    title: "Randevunuz netleşsin",
  },
];

export default function Home() {
  return (
    <main className={styles.root} id="ana-icerik">
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

      <section className="process-section" id="surec" aria-labelledby="process-title">
        <div className="process-intro">
          <p className="section-kicker">Süreç</p>
          <h2 id="process-title">İlk adımdan onaya kadar ne olacağını bilin.</h2>
          <p>
            Akış açıldığında seçiminiz önce talep olarak kaydedilecek ve uygunluk doğrulandıktan
            sonra onaylanacak.
          </p>
        </div>
        <ol className="process-steps">
          {steps.map((step) => (
            <li key={step.index}>
              <span>{step.index}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
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
        <div className="booking-icon" aria-hidden="true">
          <span />
          <i />
        </div>
        <div>
          <p className="section-kicker">Randevu</p>
          <h2 id="booking-title">Sizin için uygun zamanı birlikte planlayalım.</h2>
          <p>
            Kontrollü randevu talep sistemi hazırlanıyor. Açıldığında buradan başlayabilirsiniz.
          </p>
        </div>
        <span className="booking-status">Yakında açılacak</span>
      </section>

      <SiteFooter />
    </main>
  );
}
