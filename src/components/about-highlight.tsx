import Link from "next/link";

import styles from "./about-highlight.module.css";

const values = [
  {
    label: "01",
    text: "İlk temasın aceleye gelmediği, ihtiyacın sakin biçimde anlaşıldığı bir görüşme alanı.",
    title: "Dinlemeye alan açan",
  },
  {
    label: "02",
    text: "Çocuk ve ergen süreçlerinde aileyi bilgilendiren, şeffaf ve iş birliğine açık ilerleyiş.",
    title: "Aile ile iş birliği",
  },
  {
    label: "03",
    text: "Görüşme hedeflerini kişinin yaşına, ihtiyacına ve gündelik yaşamına göre şekillendiren yaklaşım.",
    title: "Kişiye özel plan",
  },
];

export default function AboutHighlight() {
  return (
    <section className={styles.aboutSection} id="hakkimda" aria-labelledby="about-title">
      <div className={styles.visualColumn}>
        <div className={styles.portraitPanel}>
          <span className={styles.softCircle} aria-hidden="true" />
          <span className={styles.orbitLine} aria-hidden="true" />
          <img src="/berfin-hero.png" alt="Berfin Akbaş, Dil ve Konuşma Terapisti" draggable="false" />
        </div>

        <div className={styles.nameCard}>
          <span>Tanışın</span>
          <strong>Berfin Akbaş</strong>
          <small>Dil ve Konuşma Terapisti</small>
        </div>

        <div className={styles.noteCard} aria-hidden="true">
          <span>Yaklaşım</span>
          <strong>Sakin, anlaşılır ve güven veren süreç</strong>
        </div>
      </div>

      <div className={styles.copyColumn}>
        <p className="section-kicker">Hakkımda</p>
        <h2 id="about-title">Sizi dinleyen, süreci anlaşılır kılan bir görüşme alanı.</h2>
        <p className={styles.leadText}>
          Her bireyin iletişim süreci kendine özgüdür. İlk görüşmede ihtiyaçları anlamaya, süreci
          sadeleştirmeye ve size en uygun yol haritasını oluşturmaya odaklanıyorum.
        </p>
        <p>
          Çocuklar, ergenler ve yetişkinler için değerlendirme, terapi planlama ve seans süreci;
          güven veren, mahremiyete duyarlı ve anlaşılır bir çerçevede ilerler.
        </p>

        <div className={styles.valueGrid} aria-label="Çalışma yaklaşımı">
          {values.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </article>
          ))}
        </div>

        <div className={styles.actions}>
          <Link className="primary-button" href="/surec">
            Süreci İncele
          </Link>
          <Link className="secondary-button" href="/hakkimda">
            Hakkımda Daha Fazla
          </Link>
        </div>
      </div>
    </section>
  );
}
