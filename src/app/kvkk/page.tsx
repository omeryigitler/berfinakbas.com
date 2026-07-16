import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/kvkk" },
  description: "Berfin Akbaş kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
  title: "KVKK Aydınlatma Metni | Berfin Akbaş",
};

export default function KvkkPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <article className="legal-page">
        <p className="section-kicker">Kişisel verilerin korunması</p>
        <h1>KVKK Aydınlatma Metni</h1>
        <p>
          <strong>Son güncelleme:</strong> 16 Temmuz 2026
        </p>
        <h2>Veri sorumlusu</h2>
        <p>
          Bu internet sitesi ve randevu operasyonu kapsamında kişisel veriler, veri sorumlusu
          sıfatıyla Dil ve Konuşma Terapisti Berfin Akbaş tarafından işlenir. İletişim başvuruları{" "}
          <Link href="/iletisim">iletişim sayfasındaki</Link> güncel kanallardan yapılabilir.
        </p>
        <h2>İşlenen veri grupları</h2>
        <p>
          Randevu talebi ve yönetimi için ad-soyad, telefon, e-posta, yaş grubu veya doğum yılı,
          seçilen hizmet ve zaman bilgileri; çocuk danışanlarda veli/sorumlu bilgileri ve ilişki
          bilgisi; gerekli bilgilendirme ve onay kayıtları; randevu, plan ve ödeme operasyon
          kayıtları işlenebilir.
        </p>
        <p>
          Public randevu formu klinik dosya değildir. Ayrıntılı sağlık öyküsü, rapor, tanı belgesi
          veya gereksiz özel nitelikli veri talep edilmez.
        </p>
        <h2>İşleme amaçları</h2>
        <ul>
          <li>Randevu talebini almak, uygunluğu kontrol etmek ve sonucu bildirmek,</li>
          <li>Danışan ve gerektiğinde veli ilişkisini doğrulamak,</li>
          <li>Görüşme planı, seans hakkı ve temel ödeme operasyonunu yürütmek,</li>
          <li>
            Bilgi güvenliği, hata takibi, denetim izi ve hukuki yükümlülükleri yerine getirmek,
          </li>
          <li>Açık rıza gereken işlemlerde rızayı ve geri çekme kaydını yönetmek.</li>
        </ul>
        <h2>Hukuki sebepler ve aktarım</h2>
        <p>
          Veriler; sözleşmenin kurulması veya ifası, hukuki yükümlülüklerin yerine getirilmesi, bir
          hakkın tesisi veya korunması, meşru menfaat ve gerekli hâllerde açık rıza hukuki
          sebeplerine dayanılarak işlenir. Barındırma, veritabanı, kimlik doğrulama ve iletişim
          hizmeti sağlayıcılarına yalnızca hizmetin gerektirdiği ölçüde ve uygun güvenlik
          tedbirleriyle aktarım yapılabilir.
        </p>
        <h2>Saklama ve güvenlik</h2>
        <p>
          Kayıtlar yalnızca işleme amacı ve ilgili mevzuatın gerektirdiği süre boyunca saklanır.
          Randevu, finans ve denetim kayıtları fiziksel olarak silinmek yerine mevzuat ve kayıt
          bütünlüğü gerektirdiğinde durum veya ters kayıt yöntemiyle korunabilir. Erişim rol ve
          yetkilere göre sınırlandırılır.
        </p>
        <h2>İlgili kişinin hakları</h2>
        <p>
          KVKK kapsamındaki şartlara göre verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme,
          işleme amacını ve amaca uygun kullanımı öğrenme, aktarılan üçüncü kişileri bilme, eksik
          veya yanlış verinin düzeltilmesini isteme, silme/yok etme talebinde bulunma, düzeltme veya
          silmenin aktarılan taraflara bildirilmesini isteme, otomatik analiz sonucuna itiraz etme
          ve kanuna aykırı işleme nedeniyle zararın giderilmesini isteme haklarına sahipsiniz.
        </p>
        <p>
          Başvurunuzda kimliğinizi doğrulamaya yeterli bilgi ile talebinizi açıkça belirtmeniz
          gerekir. Başvurular <Link href="/iletisim">iletişim kanalları</Link> üzerinden alınır.
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
