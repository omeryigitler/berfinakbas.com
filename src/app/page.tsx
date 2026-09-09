import Image from "next/image";
import Link from "next/link";

import HandwrittenHero from "@/components/handwritten-hero";
import ManagedContactFab from "@/components/managed-contact-fab";
import { SiteFooter } from "@/components/public-shell";

import styles from "./handwritten-home.module.css";

const principles = [
  {
    number: "01",
    title: "Önce dinlemek",
    text: "İlk temasın aceleye gelmediği, ihtiyacın sakin ve anlaşılır biçimde ele alındığı bir görüşme alanı.",
  },
  {
    number: "02",
    title: "Sonra planlamak",
    text: "Değerlendirme sonrasında hedeflerin, görüşme biçiminin ve sonraki adımların açıkça konuşulması.",
  },
  {
    number: "03",
    title: "Birlikte takip etmek",
    text: "Çocuk, ergen ve yetişkin süreçlerinde kişiye ve gerektiğinde aileye alan açan iş birliği yaklaşımı.",
  },
];

export default function Home() {
  return (
    <main className={styles.page} id="ana-icerik">
      <HandwrittenHero />

      <section className={styles.principles} aria-labelledby="principles-title">
        <div className={styles.sectionIntro}>
          <p className={styles.handKicker}>çalışma yaklaşımı</p>
          <h2 id="principles-title">Klinik netlik, insani bir dil.</h2>
          <p>
            Süreç; anlaşılır bilgi, mahremiyet ve birlikte karar verme ilkeleriyle ilerler. Görsel
            dil sıcak olabilir; profesyonel çerçeve her zaman nettir.
          </p>
        </div>

        <div className={styles.principleGrid}>
          {principles.map((principle) => (
            <article key={principle.number}>
              <span>{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>

        <div className={styles.scribbleArrow} aria-hidden="true">
          <span>önce dinle</span>
          <i>→</i>
          <span>sonra planla</span>
        </div>
      </section>

      <section className={styles.about} id="hakkimda" aria-labelledby="about-title">
        <div className={styles.aboutVisual}>
          <div className={styles.graphPaper} aria-hidden="true" />
          <Image
            className={styles.portrait}
            src="/berfin-hero-standing.png"
            alt="Berfin Akbaş portresi"
            draggable={false}
            height={1353}
            sizes="(max-width: 760px) 74vw, 390px"
            width={413}
          />
          <div className={styles.aboutLabel}>
            <span>Tanışın</span>
            <strong>Berfin Akbaş</strong>
            <small>Dil ve Konuşma Terapisti</small>
          </div>
          <span className={styles.portraitNote}>sakin · anlaşılır · güven veren</span>
        </div>

        <div className={styles.aboutCopy}>
          <p className={styles.handKicker}>hakkımda</p>
          <h2 id="about-title">Sizi dinleyen, süreci anlaşılır kılan bir görüşme alanı.</h2>
          <p className={styles.aboutLead}>
            Her bireyin iletişim süreci kendine özgüdür. İlk görüşmede ihtiyaçları anlamaya,
            süreci sadeleştirmeye ve size uygun yol haritasını oluşturmaya odaklanıyorum.
          </p>
          <p>
            Çocuklar, ergenler ve yetişkinler için değerlendirme ve terapi planlama süreci;
            mahremiyete duyarlı, iş birliğine açık ve anlaşılır bir çerçevede ilerler.
          </p>
          <div className={styles.aboutActions}>
            <Link className={styles.inkButton} href="/hakkimda">
              Hakkımda daha fazla
            </Link>
            <Link className={styles.textLink} href="/surec">
              Terapi yaklaşımını incele <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.faq} id="sss" aria-labelledby="faq-title">
        <div className={styles.faqHeading}>
          <p className={styles.handKicker}>küçük notlar / net cevaplar</p>
          <h2 id="faq-title">Merak ettikleriniz</h2>
          <p>Randevu ve ilk görüşme hakkında en sık karşılaşılan sorular.</p>
        </div>

        <div className={styles.faqList}>
          <details>
            <summary>
              <span>01</span>
              Seçtiğim saat hemen kesinleşir mi?
            </summary>
            <p>Hayır. Saat seçimi bir taleptir; uygunluk kontrolü ve onay sonrasında kesinleşir.</p>
          </details>
          <details>
            <summary>
              <span>02</span>
              İlk talepte hangi bilgiler istenir?
            </summary>
            <p>İlk adımda yalnızca iletişim ve planlama için gerekli minimum bilgiler alınır.</p>
          </details>
          <details>
            <summary>
              <span>03</span>
              İlk görüşme nasıl planlanır?
            </summary>
            <p>
              Görüşme biçimi ve sonraki adım, ilk temas ve uygunluk değerlendirmesiyle netleşir.
            </p>
          </details>
        </div>
      </section>

      <section className={styles.booking} id="randevu" aria-labelledby="booking-title">
        <div>
          <p className={styles.bookingHand}>birlikte planlayalım ↘</p>
          <h2 id="booking-title">İlk adımı sakin ve kontrollü biçimde oluşturun.</h2>
          <p>
            Tercih ettiğiniz zamanı iletin. Saatiniz, uygunluk kontrolü ve onay sonrasında
            kesinleşsin.
          </p>
        </div>
        <div className={styles.bookingActions}>
          <Link href="/randevu">Randevu talebi oluştur</Link>
          <Link href="/iletisim">Önce iletişime geç</Link>
        </div>
        <span className={styles.bookingWave} aria-hidden="true">
          ∿∿∿∿∿∿∿∿∿
        </span>
      </section>

      <SiteFooter />
      <ManagedContactFab />
    </main>
  );
}
