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
    title: "Birlikte planlamak",
    text: "Değerlendirme sonrasında hedeflerin ve sonraki adımların anlaşılır biçimde konuşulduğu bir süreç.",
  },
  {
    number: "03",
    title: "Düzenli takip etmek",
    text: "Süreç boyunca kişiye ve gerektiğinde aileye alan açan, açık ve iş birliğine dayalı takip.",
  },
];

export default function Home() {
  return (
    <main className={`${styles.page} public-sketch`} id="ana-icerik">
      <HandwrittenHero />

      <section className={styles.discovery} aria-labelledby="discovery-title">
        <div className={styles.discoveryInner}>
          <h2 id="discovery-title">
            <span>Süreci Beraber </span>
            <em>Keşfedelim</em>
          </h2>
          <p>
            Kişiselleştirilmiş defterler, anlaşılır içerikler ve uygulamalarla terapi sürecini
            birlikte takip edelim.
          </p>
          <Link className={styles.outlineButton} href="/surec">
            Daha Fazla Gör <span aria-hidden="true">↓</span>
          </Link>
        </div>
      </section>

      <section className={styles.principles} aria-labelledby="principles-title">
        <div className={styles.sectionHeading}>
          <p>çalışma yaklaşımı</p>
          <h2 id="principles-title">
            Klinik netlik,
            <em> insani bir dil.</em>
          </h2>
          <span>
            Görsel dil sıcak ve kişisel; değerlendirme, mahremiyet ve randevu akışı ise açık ve
            profesyonel.
          </span>
        </div>

        <div className={styles.principleGrid}>
          {principles.map((principle) => (
            <article key={principle.number}>
              <span className={styles.circleNumber}>{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.about} aria-labelledby="about-title">
        <div className={styles.aboutVisual}>
          <span className={styles.paperTape} aria-hidden="true" />
          <Image
            className={styles.portrait}
            src="/berfin-hero-standing.png"
            alt="Berfin Akbaş portresi"
            draggable={false}
            height={1353}
            sizes="(max-width: 760px) 72vw, 380px"
            width={413}
          />
          <div className={`${styles.nameNote} home-about-name-note`}>
            <small>Tanışın</small>
            <strong>Berfin Akbaş</strong>
            <span>Dil ve Konuşma Terapisti</span>
          </div>
        </div>

        <div className={styles.aboutCopy}>
          <p className={styles.handLabel}>hakkımda</p>
          <h2 id="about-title">
            Sizi dinleyen,
            <em> süreci anlaşılır kılan</em> bir görüşme alanı.
          </h2>
          <p className={styles.aboutLead}>
            Her bireyin iletişim süreci kendine özgüdür. İlk görüşmede ihtiyaçları anlamaya ve size
            uygun yol haritasını birlikte oluşturmaya odaklanıyorum.
          </p>
          <p>
            Çocuklar, ergenler ve yetişkinler için değerlendirme ve terapi planlama süreci;
            mahremiyete duyarlı, iş birliğine açık ve anlaşılır bir çerçevede ilerler.
          </p>
          <div className={styles.aboutActions}>
            <Link className={styles.inkButton} href="/hakkimda">
              Hakkımda
            </Link>
            <Link className={styles.outlineButton} href="/surec">
              Yaklaşımı Gör <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.faq} id="sss" aria-labelledby="faq-title">
        <div className={styles.faqHeading}>
          <p className={styles.handLabel}>küçük notlar / net cevaplar</p>
          <h2 id="faq-title">
            Merak
            <em> Ettikleriniz</em>
          </h2>
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
        <p className={styles.bookingNote}>birlikte planlayalım ↘</p>
        <h2 id="booking-title">
          İlk Adımı Beraber <em>Planlayalım</em>
        </h2>
        <p>
          Tercih ettiğiniz zamanı iletin. Saatiniz uygunluk kontrolü ve onay sonrasında
          kesinleşsin.
        </p>
        <div className={styles.bookingActions}>
          <Link className={styles.inkButton} href="/randevu">
            Randevu Al
          </Link>
          <Link className={styles.outlineButton} href="/iletisim">
            Önce İletişime Geç <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <SiteFooter />
      <ManagedContactFab />
    </main>
  );
}
