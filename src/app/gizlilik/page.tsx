import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/gizlilik" },
  description: "Berfin Akbaş internet sitesi gizlilik ve çerez politikası.",
  title: "Gizlilik ve Çerez Politikası | Berfin Akbaş",
};

export default function PrivacyPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <article className="legal-page">
        <p className="section-kicker">Gizlilik</p>
        <h1>Gizlilik ve Çerez Politikası</h1>
        <p><strong>Son güncelleme:</strong> 16 Temmuz 2026</p>
        <h2>Bu politika neyi kapsar?</h2>
        <p>Bu politika, berfinakbas.com ziyaretiniz sırasında oluşan teknik verileri, randevu formuna yazdığınız bilgileri ve yönetim alanındaki güvenli oturum kullanımını açıklar. Kişisel verilerin işlenmesine ilişkin ayrıntılar <Link href="/kvkk">KVKK Aydınlatma Metni</Link> içinde yer alır.</p>
        <h2>Zorunlu teknik veriler</h2>
        <p>Site güvenliği, oturum yönetimi, kötüye kullanımın önlenmesi, hata teşhisi ve randevu akışının doğru çalışması için IP adresi, istek zamanı, tarayıcı/cihaz bilgisi ve güvenlik kayıtları sınırlı süreyle işlenebilir.</p>
        <h2>Çerezler</h2>
        <p>Site yalnızca yönetim oturumu, güvenlik ve temel işlevler için gerekli çerezleri kullanır. Reklam, çapraz-site takip veya pazarlama profili oluşturan çerezler kullanılmaz. İleride analitik veya isteğe bağlı bir çerez eklenirse bu politika ve gerekli tercih mekanizması kullanımdan önce güncellenir.</p>
        <h2>Randevu formu</h2>
        <p>Formda yalnızca talebi işlemek için gerekli bilgiler istenir. Slotu kısa süreli ayıran güvenlik belirteci URL’ye veya kalıcı tarayıcı depolamasına yazılmaz. Randevu talebi gönderilmediğinde geçici slot ayırma kaydı süresi sonunda geçersiz olur.</p>
        <h2>Üçüncü taraf hizmetler</h2>
        <p>Uygulama barındırma, veritabanı, kimlik doğrulama ve güvenli iletişim için hizmet sağlayıcılardan yararlanabilir. Bu sağlayıcılara yalnızca hizmet için gerekli veri aktarılır ve erişim teknik/organizasyonel tedbirlerle sınırlandırılır.</p>
        <h2>Tercihleriniz ve iletişim</h2>
        <p>Tarayıcınızdan çerezleri silebilir veya engelleyebilirsiniz; zorunlu çerezlerin engellenmesi yönetim girişi ya da randevu akışı gibi özelliklerin çalışmasını etkileyebilir. Gizlilik talepleri için <Link href="/iletisim">iletişim sayfasını</Link> kullanabilirsiniz.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
