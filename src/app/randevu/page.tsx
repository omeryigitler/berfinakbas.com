import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  description: "Kontrollü randevu talebi akışı ve mevcut sistem durumu.",
  title: "Randevu Talebi | Berfin Akbaş",
};

export default function BookingPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <section className="booking-page-panel" aria-labelledby="booking-page-title">
        <div className="booking-page-copy">
          <p className="section-kicker">Randevu talebi</p>
          <h1 id="booking-page-title">Saat seçimi yakında burada başlayacak.</h1>
          <p>
            Randevu motoru ve çakışma kontrolleri tamamlanmadan kişisel bilgi alan bir form
            açmıyoruz. Sistem hazır olduğunda bu sayfa talep akışının başlangıcı olacak.
          </p>
          <div className="booking-readiness" role="status">
            <i aria-hidden="true" />
            <span>Talep formu henüz kapalı</span>
          </div>
          <Link className="secondary-button inner-action" href="/surec">
            Sürecin ayrıntısını gör
          </Link>
        </div>
        <ol className="booking-preview-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Hizmet ve görüşme biçimi</strong>
              <small>Yüz yüze veya çevrim içi tercih</small>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Uygun saat</strong>
              <small>Canlı takvim ve buffer kontrolü</small>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Minimum iletişim bilgisi</strong>
              <small>Klinik ayrıntı veya dosya yükleme yok</small>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <strong>Onay</strong>
              <small>Talep, kontrol sonrası kesinleşir</small>
            </div>
          </li>
        </ol>
      </section>
      <SiteFooter />
    </main>
  );
}
