import AboutHighlight from "@/components/about-highlight";
import HeroScroll from "@/components/hero-scroll";
import { SiteFooter } from "@/components/public-shell";

const audiences = [
  {
    accent: "peach",
    description: "Konuşma, dil ve iletişim gelişimini destekleyen sakin ve anlaşılır görüşmeler.",
    eyebrow: "Çocuklar için",
    title: "Gelişimi anlamaya yönelik başlangıç",
  },
  {
    accent: "sage",
    description: "Gündelik iletişim ihtiyaçlarına saygılı, açık ve iş birliğine dayalı bir süreç.",
    eyebrow: "Ergenler için",
    title: "Kendini ifade etmeye alan açan destek",
  },
  {
    accent: "sand",
    description: "İletişim hedefleri ve yaşam düzeni dikkate alınarak planlanan görüşmeler.",
    eyebrow: "Yetişkinler için",
    title: "Kişiye göre şekillenen görüşme alanı",
  },
  {
    accent: "rose",
    description: "Ailelerin süreci anlamasına ve sonraki adımı net görmesine yardımcı olan buluşmalar.",
    eyebrow: "Aileler için",
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

function AudienceIllustration({ accent, index }: { accent: string; index: number }) {
  return (
    <div className={`audience-illustration audience-${accent}`} aria-hidden="true">
      <svg viewBox="0 0 240 150">
        <path
          className="illustration-backdrop"
          d="M26 124c8-52 31-91 86-98 47-6 92 25 103 71 2 8 2 17 1 27H26Z"
        />
        <circle className="illustration-sun" cx="194" cy="34" r="14" />
        <path
          className="illustration-plant"
          d="M188 122V84m0 17c-14-4-18-13-15-24 12 2 18 10 15 24Zm1-8c13-4 18-12 17-23-12 1-18 9-17 23Z"
        />
        <circle className="illustration-person-a" cx={index % 2 ? 85 : 94} cy="68" r="19" />
        <path
          className="illustration-person-a"
          d={
            index % 2
              ? "M55 124c4-30 16-47 31-47 17 0 29 17 33 47H55Z"
              : "M63 124c4-30 16-47 31-47 17 0 29 17 33 47H63Z"
          }
        />
        <circle className="illustration-person-b" cx={index % 2 ? 137 : 146} cy="76" r="15" />
        <path
          className="illustration-person-b"
          d={
            index % 2
              ? "M115 124c2-25 10-39 23-39s22 14 25 39h-48Z"
              : "M124 124c2-25 10-39 23-39s22 14 25 39h-48Z"
          }
        />
        <path className="illustration-line" d="M101 52c10-15 27-18 43-8" />
        <path className="illustration-line" d="M117 38c-3-8-1-15 6-20" />
      </svg>
    </div>
  );
}

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
            <strong>Esnek görüşme biçimi</strong>
            <small>Uygunluğa göre yüz yüze veya çevrim içi seçenekler.</small>
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

      <AboutHighlight />

      <section className="audience-section" id="destek-alanlari" aria-labelledby="audience-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Destek alanları</p>
            <h2 id="audience-title">Size nasıl destek olabilirim?</h2>
          </div>
          <p>
            Aşağıdaki başlıklar bilgilendirme amaçlıdır; kişiye özel plan ilk görüşmeyle
            şekillenir.
          </p>
        </div>

        <div className="audience-grid">
          {audiences.map((item, index) => (
            <article className="audience-card" key={item.eyebrow}>
              <AudienceIllustration accent={item.accent} index={index} />
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
            <summary>Online görüşme mümkün mü?</summary>
            <p>Uygunluğa göre yüz yüze veya çevrim içi görüşme seçenekleri değerlendirilebilir.</p>
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
