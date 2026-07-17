# Aktif Çalışma Devir Teslimi

Son güncelleme: 17 Temmuz 2026, Europe/Malta

## Aktif çalışma

- Ana dal: `main`
- Son production teslimi: PR #106 — ana sayfa cilası + ilk Yönetim Hub teslimi
- Son production commit: `e1d2674659a0d8efc6c7e16fa08bf710d992ed65`
- Aktif dal: `design/unified-admin-panel`
- Aktif Draft PR: #107 — Hub tabanlı tek yönetim paneline tam geçiş
- Son doğrulanan head: `6341ebd5b45f99acf09d2cfa5ee6313e96db526c`
- Production’a henüz merge/deploy yapılmadı.

## Kullanıcının bağlayıcı kararı

- `/yonetim` altında yalnızca tek yönetim deneyimi bulunur.
- Sol navigasyon izin bazlı akordeondur.
- Liste gerektiren alanlar liste → kayıt → çalışma alanı biçiminde açılır.
- Her ana ekranda `Tam sayfa çalış / Panelleri geri aç` ve `F` kısayolu bulunur.
- Danışan, randevu, müsaitlik, finans, site yönetimi ve sistem sağlığı farklı bir tasarıma geçmeden aynı Hub kabuğunda çalışır.
- “Klasik panel”, ikinci sidebar veya ayrı Hub görünümü final üründe bulunmaz.

## Tamamlanan kod migrasyonu

- Bütün yönetim rotaları ortak Hub kabuğunu kullanıyor:
  - `/yonetim`
  - `/yonetim/hub`
  - `/yonetim/danisanlar`
  - `/yonetim/danisan-olustur`
  - `/yonetim/danisan-profili`
  - `/yonetim/randevular`
  - `/yonetim/musaitlik`
  - `/yonetim/odemeler`
  - `/yonetim/saglik`
- Sol akordeon grupları: Çalışma Alanım, Randevular, Danışanlar, Finans, Site Yönetimi ve Sistem.
- Talep kuyruğu, danışan kayıt merkezi, müsaitlik özeti ve ödeme özeti ilgili akordeon grubundan doğrudan URL state ile açılıyor.
- Uzun yönetim sayfaları çalışma sekmelerine ayrıldı; bütün bloklar aynı anda aşağı doğru yığılmıyor.
- `?gorunum=tam` ve `F` ile ortak tam sayfa çalışma modu aktif.
- `/yonetim/hub` içindeki eski standalone `DashboardHub`, ikinci rail, yerel genişletme düğmesi ve “Klasik panele dön” bağlantısı kaldırıldı.
- Yeni `RecordCenter` yalnızca ortak kabuk içinde çalışıyor.
- Kullanıcı yüzeyindeki A/B/C ve ağırlıklı hazırlık skoru kaldırıldı; açık alanlar “Kayıt kontrolü” listesiyle gösteriliyor.
- Eski koyu yeşil/mercan/serif tema üreten override katmanları Hub tokenlarına geçirildi veya yalnızca yapısal kurallara indirildi.
- URL tabanlı modallar, randevu formu, custom takvim ve custom dropdown Hub tasarım sistemine geçirildi.
- Müsaitlik istisnası artık serbest metin tarih/saat yerine ortak takvim ve kaydırılabilir saat dropdown’u kullanıyor.
- Finans plan, taksit, ödeme ve ledger yüzeyleri Hub tokenlarını kullanıyor; finans iş kuralları değiştirilmedi.
- Sistem sağlığı aynı kabukta read-only çalışıyor.

## Teknik adlandırma notu

- `AdminShell` bileşen adı import uyumluluğu için korunuyor; artık eski paneli temsil etmiyor. Uygulamadaki tek Hub kabuğunun teknik bileşenidir.
- `*-polish.module.css`, `symmetry` ve `icon-placement` isimli bazı dosyalar import uyumluluğu nedeniyle kalabilir; içerikleri eski tema değil Hub tokenları veya yapısal yerleşim kurallarıdır.
- Ayrı bir eski sidebar/topbar bileşeni veya standalone Hub kaynağı kalmadı.

## Otomatik doğrulama

Final Quality run tamamen başarılı olmalıdır:

- Prisma schema validation
- ESLint
- TypeScript typecheck
- Unit/integration test paketi
- Production build
- Production-build smoke
- Gerçek PostgreSQL integration
- Vercel Preview — Ready

Migration, yeni secret veya yeni kişisel veri alanı eklenmedi.

## Merge öncesi kalan manuel kapılar

1. Yetkili hesapla Preview’da masaüstü, tablet ve mobil rota turu.
2. Akordeon açılma, aktif grup, çalışma sekmeleri ve `?gorunum=tam` kontrolü.
3. Danışan oluşturma, çocuk–veli bağlantısı, profil ve URL modal smoke testi.
4. Randevu oluşturma/durum işlemleri ve müsaitlik istisnası smoke testi.
5. Finans read/write izinleri, plan/taksit/ödeme ekranı ve read-only rol görünümü.
6. Uzun ad, e-posta, tutar, boş veri, hata ve yüksek kayıt sayısı görsel kontrolleri.
7. Kullanıcının son görünüm onayı.
8. Tek squash merge ve tek Production deploy.

## Kullanıcının gördüğü eski kırmızı deploy

- Commit `9676b2984a96afe163edbafc9961bf93f7f755b5` production değildir.
- Dependabot’un TypeScript ve ESLint major sürümlerini birlikte yükselten ayrı Preview denemesidir.
- Tasarım PR’ına alınmamıştır ve `main` production durumunu etkilemez.

## Veri ve güvenlik sınırı

- Randevu durum makinesi, consent kapıları, yetki kontrolleri ve append-only finans ledger’ı korunur.
- Klinik not/sağlık öyküsü alanı eklenmedi.
- Gerçek danışan/veli fotoğrafı gösterilmiyor; monogram avatar kullanılıyor.
- Liste ekranlarında minimum veri ilkesi korunuyor.
- Public randevu, operasyonel yayın kapıları tamamlanana kadar fail-closed kalır.

## Deploy disiplini

- Yalnızca `design/unified-admin-panel` ve Draft PR #107 kullanılır.
- PR manuel smoke tamamlanmadan Ready veya merge yapılmaz.
- `main` dalına doğrudan commit atılmaz.
- Kullanıcı onayından sonra yalnızca tek squash merge ve tek Production deploy yapılır.
