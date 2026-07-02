import Link from "next/link";

import styles from "./about-highlight.module.css";

type ValueCard = {
  label: string;
  text: string;
  title: string;
};

type AboutHighlightProps = {
  actionHref?: string;
  actionLabel?: string;
  headingId?: string;
  isPage?: boolean;
  lead?: string;
  paragraphs?: string[];
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  sectionId?: string;
  showSecondaryAction?: boolean;
  title?: string;
  values?: ValueCard[];
};

const defaultValues: ValueCard[] = [
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

const defaultParagraphs = [
  "Çocuklar, ergenler ve yetişkinler için değerlendirme, terapi planlama ve seans süreci; güven veren, mahremiyete duyarlı ve anlaşılır bir çerçevede ilerler.",
];

export default function AboutHighlight({
  actionHref = "/surec",
  actionLabel = "Süreci İncele",
  headingId,
  isPage = false,
  lead = "Her bireyin iletişim süreci kendine özgüdür. İlk görüşmede ihtiyaçları anlamaya, süreci sadeleştirmeye ve size en uygun yol haritasını oluşturmaya odaklanıyorum.",
  paragraphs = defaultParagraphs,
  secondaryActionHref = "/hakkimda",
  secondaryActionLabel = "Hakkımda Daha Fazla",
  sectionId = "hakkimda",
  showSecondaryAction = true,
  title = "Sizi dinleyen, süreci anlaşılır kılan bir görüşme alanı.",
  values = defaultValues,
}: AboutHighlightProps) {
  const resolvedHeadingId = headingId ?? (isPage ? "about-page-title" : "about-title");
  const sectionClassName = `${styles.aboutSection}${isPage ? ` ${styles.pageSection}` : ""}`;

  return (
    <section className={sectionClassName} id={sectionId} aria-labelledby={resolvedHeadingId}>
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
        {isPage ? <h1 id={resolvedHeadingId}>{title}</h1> : <h2 id={resolvedHeadingId}>{title}</h2>}
        <p className={styles.leadText}>{lead}</p>
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

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
          <Link className="primary-button" href={actionHref}>
            {actionLabel}
          </Link>
          {showSecondaryAction ? (
            <Link className="secondary-button" href={secondaryActionHref}>
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
