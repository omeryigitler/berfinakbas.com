import Link from "next/link";

import { BerfinPortrait } from "@/components/public-shell";

type AboutHighlightProps = {
  actionHref?: string;
  actionLabel?: string;
  lead?: string;
  page?: boolean;
  paragraphs?: string[];
  title?: string;
  values?: string[];
};

const defaultParagraphs = [
  "Her iletişim ihtiyacı kendine özgüdür. İlk görüşmenin amacı aceleyle bir sonuca varmak değil; ihtiyacı, gündelik yaşamı ve uygun sonraki adımı birlikte anlamaktır.",
  "Bu sitede hizmet alanları sade bir dille anlatılır. Randevu talebi ise seçilen saati doğrudan kesinleştirmez; uygunluk kontrolü ve onay sonrasında netleşir.",
];

const defaultValues = ["Dinlemeye alan açan", "Aileyle iş birliğine açık", "Mahremiyete duyarlı"];

export default function AboutHighlight({
  actionHref = "/surec",
  actionLabel = "Görüşme süreci nasıl işler?",
  lead,
  page = false,
  paragraphs = defaultParagraphs,
  title = "Sizi dinleyen, süreci anlaşılır kılan bir görüşme alanı.",
  values = defaultValues,
}: AboutHighlightProps) {
  const headingId = page ? "about-page-title" : "about-title";

  return (
    <section
      className={page ? "inner-hero portrait-page-layout" : "about-section"}
      id={page ? undefined : "hakkimda"}
      aria-labelledby={headingId}
    >
      <BerfinPortrait page={page} />

      <div className={page ? "inner-copy" : "about-copy"}>
        <p className="section-kicker">Hakkımda</p>
        {page ? <h1 id={headingId}>{title}</h1> : <h2 id={headingId}>{title}</h2>}
        {lead ? <p className={page ? "inner-lead" : undefined}>{lead}</p> : null}
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="about-values">
          {values.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
        <Link className={page ? "primary-button inner-action" : "text-link"} href={actionHref}>
          {actionLabel}
          {page ? null : <span aria-hidden="true">→</span>}
        </Link>
      </div>
    </section>
  );
}
