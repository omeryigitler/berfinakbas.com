# Hub Tabanlı Tek Yönetim Paneli — Teslim ve Kontrol Planı

Son güncelleme: 17 Temmuz 2026 · Europe/Malta

Aktif dal: `design/unified-admin-panel`  
Aktif Draft PR: #107

## Nihai mimari

`/yonetim` altında tek bir yönetim kabuğu vardır. Bütün rotalar aynı sidebar, üst bar, renk sistemi, tipografi, modal, dropdown, takvim ve tam sayfa çalışma davranışını kullanır.

`AdminShell` teknik adı geriye dönük import uyumluluğu için korunmuştur; eski panel değildir. Uygulamadaki tek Hub kabuğunu ifade eder.

`/yonetim/hub`, ayrı bir tasarım veya ikinci kabuk değil; ortak kabuk içindeki kayıt merkezi rotasıdır.

## Tamamlanan bilgi mimarisi

### Çalışma Alanım

- Genel bakış
- Gerçek dashboard özetleri
- Hızlı işlemler
- Çalışma sekmeleriyle site ayarlarından ayrılmış operasyon görünümü

### Randevular

- Talep kuyruğu
- Randevu liste/detay ve durum işlemleri
- Müsaitlik özeti
- Müsaitlik yönetimi ve istisnalar

### Danışanlar

- Danışan kayıt merkezi
- Arama ve filtreleme
- Yeni yetişkin/çocuk danışan
- Mevcut veya yeni veli bağlantısı
- Profil, consent, randevu, finans ve operasyon zaman çizelgesi

### Finans

- Ödeme özeti
- Planlar ve seans hakları
- Taksitler ve beklenen ödemeler
- Ödeme hareketleri ve append-only ledger işlemleri

### Site Yönetimi

- Public iletişim ayarları
- Hizmetler
- Terapist ve çalışma kuralları
- Görüşme süreleri, buffer ve operasyon ayarları

### Sistem

- Entegrasyon ve outbox sağlığı
- Teknik sağlık

## Tamamlanan kullanıcı deneyimi

- Sol menü izin bazlı akordeondur.
- Aktif rotanın veya URL bölümünün grubu otomatik açılır.
- Kayıt merkezi liste → seçili kayıt → çalışma alanı şeklinde ilerler.
- Uzun tam işlem sayfaları yerel çalışma sekmelerine ayrılır.
- `Tam sayfa çalış / Panelleri geri aç` bütün ana rotalarda çalışır.
- `F` kısayolu ve `?gorunum=tam` URL state aktiftir.
- Mobil/tablet görünümünde kabuk tek sütuna iner; akordeon ve çalışma sekmeleri kaydırılabilir kalır.
- URL tabanlı modallar korunur.
- Ortak custom takvim ve kaydırılabilir custom dropdown kullanılır.
- Gerçek danışan/veli fotoğrafı yoktur; deterministik monogram avatar vardır.
- Yapay A/B/C veya klinik hazırlık puanı kullanıcıya gösterilmez. Açık kayıt eksikleri “Kayıt kontrolü” listesiyle açıklanır.

## Eski tasarımdan kaldırılanlar

- Standalone `DashboardHub` bileşeni
- İkinci Hub sidebar/rail
- “Klasik panele dön” bağlantısı
- Yerel Hub genişletme düğmesi ve ikinci tam ekran state’i
- Kullanıcı yüzeyindeki ağırlıklı skor ve liste puanı
- Eski standalone Hub CSS kuralları
- Koyu yeşil eski sidebar teması
- Mercan/serif modal, müsaitlik, finans ve randevu form katmanları
- İkinci admin deneyimi izlenimi veren görünür metinler

Bazı teknik dosya adları import uyumluluğu için kalır. Bu dosyaların içerikleri artık eski tasarım değil, Hub tokenları veya yapısal responsive/scroll kurallarıdır.

## Rota dönüşüm durumu

| Rota | Durum | Hub içindeki rolü |
| --- | --- | --- |
| `/yonetim` | Tamamlandı | Genel bakış + çalışma sekmeleri + site yönetimi |
| `/yonetim/hub` | Tamamlandı | Tek kabuk içindeki kayıt merkezi |
| `/yonetim/danisanlar` | Tamamlandı | Danışan yönetimi |
| `/yonetim/danisan-olustur` | Tamamlandı | Yeni danışan formu |
| `/yonetim/danisan-profili` | Tamamlandı | Danışan detay çalışma alanı |
| `/yonetim/randevular` | Tamamlandı | Randevu operasyonu |
| `/yonetim/musaitlik` | Tamamlandı | Müsaitlik ve istisna düzenleme |
| `/yonetim/odemeler` | Tamamlandı | Plan, taksit, ödeme ve ledger |
| `/yonetim/saglik` | Tamamlandı | Read-only sistem sağlığı |

Eski URL sözleşmeleri kırılmamıştır.

## Fonksiyon eşitliği kontrol listesi

- [x] Genel dashboard ve hızlı işlemler
- [x] Danışan arama / filtre / oluşturma
- [x] Çocuk danışan + veli bağlantısı
- [x] Danışan detay, consent ve operasyon geçmişi
- [x] Randevu liste/detay/durum işlemleri
- [x] Müsaitlik kuralı ve istisna düzenleme
- [x] Ödeme alma, plan, taksit, seans hakkı ve ledger
- [x] Hizmet, terapist, süre, buffer ve public iletişim ayarları
- [x] Sistem ve entegrasyon sağlığı
- [x] URL modal, custom dropdown ve custom takvim
- [x] Tam sayfa çalışma modu bütün ana ekranlarda
- [x] Eski standalone Hub kaynağının kaldırılması
- [x] Eski görünür tema katmanlarının Hub tokenlarına geçirilmesi
- [x] Otomatik rol/yetki ve kalite testleri
- [ ] Yetkili hesapla masaüstü/tablet/mobil manuel smoke turu
- [ ] Read-only rolün gerçek veriyle manuel görsel kontrolü
- [ ] Uzun metin, boş/hata ve yüksek kayıt sayısı manuel görsel kontrolü
- [ ] Kullanıcının final görünüm onayı

## Otomatik kalite durumu

Quality run #425:

- Prisma validate: başarılı
- ESLint: başarılı
- TypeScript: başarılı
- Test paketi: başarılı
- Production build: başarılı
- Production-build smoke: başarılı
- PostgreSQL integration: başarılı
- Vercel Preview: Ready

## Veri, güvenlik ve KVKK etkisi

- Migration yok.
- Yeni secret yok.
- Yeni kişisel veri alanı yok.
- Randevu durum makinesi değişmedi.
- Consent ve veli doğrulama kapıları değişmedi.
- Finans ledger’ı append-only kalır.
- Liste yüzeylerinde minimum veri ilkesi korunur.
- Klinik not veya sağlık öyküsü eklenmedi.

## Merge ve deploy kapısı

1. Son dokümantasyon commitinin CI ve Preview sonucunu doğrula.
2. Yetkili hesapla tüm rotalarda tek manuel smoke turu yap.
3. Görsel regresyon varsa aynı Draft PR’da tek toplu düzeltme uygula.
4. Kullanıcıdan tek final merge onayı al.
5. Tek squash merge ve tek Production deploy yap.

PR #107 bu adımlar tamamlanana kadar Draft kalır.
