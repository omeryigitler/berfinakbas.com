import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  description: "Randevu talebi, uygunluk kontrolü ve görüşme onayı sürecinin adımları.",
  title: "Süreç Nasıl İşler? | Berfin Akbaş",
};

const processSteps = [
  [
    "01",
    "Talep",
    "Hizmet alanı, görüşme tercihi ve iletişim için gerekli minimum bilgiler iletilir.",
  ],
  ["02", "Uygunluk", "Seçilen saat, çalışma kuralları ve mevcut takvimle yeniden kontrol edilir."],
  ["03", "Onay", "Saat yalnızca onay mesajından sonra kesin randevuya dönüşür."],
  ["04", "Görüşme", "İlk görüşmede ihtiyaç ve uygun sonraki adım birlikte ele alınır."],
] as const;

export default function ProcessPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <section className="inner-hero centered-inner-hero" aria-labelledby="process-page-title">
        <p className="section-kicker">Süreç nasıl işler?</p>
        <h1 id="process-page-title">Talebinizin hangi aşamada olduğunu her zaman bilin.</h1>
        <p className="inner-lead">
          Saat seçimi doğrudan rezervasyon değildir. Kontrollü akış, takvim çakışmasını ve yanlış
          anlaşılmayı azaltır.
        </p>
      </section>

      <ol className="vertical-process-list">
        {processSteps.map(([number, title, text]) => (
          <li key={number}>
            <span>{number}</span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="process-privacy-panel">
        <div>
          <p className="section-kicker">Mahremiyet</p>
          <h2>Randevu formu klinik dosya değildir.</h2>
        </div>
        <p>
          İlk talepte ayrıntılı sağlık öyküsü, rapor, kimlik belgesi veya çocuk fotoğrafı istenmez.
          Planlama için gerekli olmayan bilgi toplanmaz.
        </p>
        <Link className="secondary-button" href="/randevu">
          Randevu durumunu gör
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
