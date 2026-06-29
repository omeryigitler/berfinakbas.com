# Mimari Karar Kaydı

Bu dosya, görüşmelerde alınan kararları uygulanabilir ve değiştirilebilir kayıtlar halinde tutar.

## ADR-001 — Backend tek randevu kaynağıdır

- Durum: Kabul edildi
- Karar: Google Calendar ve mesajlaşma kanalları kaynak değil, senkronizasyon/iletişim katmanıdır.
- Gerekçe: Dış sistem hatasının randevu kaybına veya çift rezervasyona dönüşmesini engellemek.

## ADR-002 — PostgreSQL kullanılacaktır

- Durum: Kabul edildi
- Karar: İlişkisel bütünlük, transaction, çakışma önleme ve raporlama gereksinimleri nedeniyle PostgreSQL + Prisma.
- Not: Prisma’nın desteklemediği gelişmiş constraint gerekirse SQL migration ile açıkça yönetilir.

## ADR-003 — Preset + custom + validation

- Durum: Kabul edildi
- Karar: Süre, buffer, iptal penceresi, hatırlatma, seans sayısı ve ödeme planında hazır seçeneklerle birlikte özel değer desteklenir.
- Kısıt: Her alan için min/max ve iş mantığı validasyonu zorunludur.

## ADR-004 — Geçmiş kayıtlar snapshot taşır

- Durum: Kabul edildi
- Karar: Randevu, oluşturulduğu andaki hizmet adı, süre, buffer, konum ve politika özetini saklar.
- Gerekçe: Ayar değişikliklerinin geçmiş ve mevcut randevuları sessizce bozmaması.

## ADR-005 — Randevu talebi kontrollü onaylanır

- Durum: Önerildi
- Karar: İlk sürümde slot seçimi kesin onay anlamına gelmez; talep admin onayıyla randevuya dönüşür.
- Açık konu: Hangi hizmetlerin ileride otomatik onaylanabileceği.

## ADR-006 — Kritik kayıtlar append-only düzeltilir

- Durum: Kabul edildi
- Karar: Ödeme, finans hareketi, seans hakkı, onay ve audit kayıtlarında silme yerine ters kayıt/düzeltme kullanılır.

## ADR-007 — Public site erken yayınlanabilir

- Durum: Kabul edildi
- Karar: Public bilgilendirme sitesi randevu motoruyla paralel geliştirilebilir. Randevu gönderimi çekirdek tamamlanana kadar kapalı tutulur.

## ADR-008 — Klinik kayıt yönetimi MVP dışıdır

- Durum: Önerildi
- Karar: Tanı, klinik not, test sonucu, rapor ve terapi dosyası saklanmaz.
- Gerekçe: Veri minimizasyonu ve ürünün operasyon/randevu odağını korumak.

## ADR-009 — Temel finans operasyonu, resmi muhasebe değildir

- Durum: Kabul edildi
- Karar: Sistem plan, seans hakkı, ödeme, vade ve belge durumunu izler; resmi muhasebe/e-Belge sistemi yerine geçmez.

## ADR-010 — Yurt içi public içerik promosyon içermeyecektir

- Durum: Kabul edildi
- Karar: Fiyat, indirim, kampanya, hasta yorumu, başarı garantisi ve sponsorlu sağlık hizmeti tanıtımı public içerik kapsamına alınmaz.
- Dayanak: 12.11.2025 tarihli sağlık hizmetlerinde tanıtım ve bilgilendirme düzenlemesi ve Bakanlık SSS’si; canlıya çıkışta hukukçu teyidi gerekir.

## ADR-011 — Varsayılan olarak hasta/çocuk görseli kullanılmaz

- Durum: Önerildi
- Karar: MVP’de terapist, mekân ve materyal görselleri tercih edilir. Gerçek hasta görseli ayrı hukuki ve operasyonel onay süreci olmadan kullanılmaz.

## ADR-012 — Sağlayıcı ve barındırma bölgesi henüz seçilmedi

- Durum: Açık
- Karar ölçütleri: Veri konumu, yurt dışı aktarım mekanizması, veri işleyen sözleşmesi, yedekleme, şifreleme, erişim ve maliyet.

## ADR-013 — Admin kimliği kapalı Google OAuth ile başlatılacaktır

- Durum: Teknik iskelet kabul edildi; sağlayıcı/hukuk doğrulaması bekliyor
- Karar: Admin alanı parola saklamaz. Auth.js + Prisma oturumu ve izinli/davetli e-posta kontrolü kullanır. Çok faktörlü doğrulama Google hesabı/Workspace politikası üzerinden uygulanır.
- Kısıt: OAuth istemcisi, zorunlu MFA politikası, yurt dışı veri aktarımı ve sağlayıcı sözleşmeleri onaylanmadan canlı giriş açılmaz.
- Güvenlik: Suspended kullanıcı girişi reddedilir; roller sunucu tarafında kontrol edilir; hassas admin POST isteklerinde origin doğrulanır.
- Bootstrap: Allowlist’teki yeni yönetici ilk girişte ancak `SUPER_ADMIN` rol kataloğu mevcutsa aktive edilir; rol ataması ve audit kaydı aynı transaction içinde yazılır. E-posta karşılaştırması locale bağımsız normalize edilir.

## ADR-014 — Public tasarım sıcak marka dili ve kontrollü teknoloji katmanı kullanacaktır

- Durum: Kabul edildi
- Karar: Kırık beyaz, mercan, kum ve adaçayı paleti; serif başlık ve sade sans metin; öne çıkan Hakkımda bölümü; illüstrasyon hizmet kartları ve randevu akışında hafif dijital göstergeler.
- Görsel kural: Gerçek kişi olarak yalnızca Berfin’in onaylı portresi kullanılabilir. Diğer kişi temsilleri illüstrasyon olur.
- Geçici portre: Kullanıcının seçtiği beyaz kıyafetli sosyal medya görseli dosya olarak değiştirilmeden CSS ile odaklanarak kullanılır; yüksek çözünürlüklü orijinal geldiğinde değiştirilir.
- İçerik kuralı: Taslak görsellerdeki danışan sayısı, başarı oranı, deneyim/eğitim iddiası ve benzeri metrikler doğrulanmadan yayınlanmaz.

## ADR-015 — Hold ve randevu aynı zaman tahsis kısıtını paylaşacaktır

- Durum: Kabul edildi
- Karar: Hold ve randevuların buffer dâhil meşgul aralıkları ortak `booking_allocations` tablosuna bağlanır. Aynı terapistin aktif aralıkları PostgreSQL `btree_gist` ve `tstzrange` exclusion constraint ile çakışamaz.
- Gerekçe: Ayrı hold ve appointment tablolarındaki application-level “önce sorgula, sonra ekle” kontrolü eşzamanlı isteklerde yeterli değildir.
- İşlem kuralı: Hold oluşturma; hold, ilk durum kaydı, allocation ve minimum audit kaydını aynı serializable transaction içinde üretir. Süresi dolan hold aynı transaction içinde serbest bırakılır ve geçmişi korunur.
- Güvenlik: Ham tek kullanımlık hold token’ı saklanmaz; yalnızca SHA-256 özeti tutulur ve audit özetine eklenmez.
- OPEN: Canlı ortamda kullanılacak hold süresi henüz ürün kararı değildir. Kod süreyi yapılandırılmış girdi olarak alır; public API açılmadan önce sistem ayarına bağlanacaktır.

## ADR-016 — Randevu durum geçişleri atomik ve yarışa dayanıklı olacaktır

- Durum: Kabul edildi
- Karar: Her geçiş mevcut durum koşuluyla güncellenir; appointment, status log ve audit kaydı aynı transaction içinde yazılır. Aynı durumdan iki eşzamanlı komuttan yalnızca biri başarılı olabilir.
- Onay: `confirmed` geçişi aktif booking allocation ister; yetkili kullanıcı ve zamanı randevu üzerinde saklar.
- Tahsis: Ret veya taraflardan birinin iptali aktif booking allocation’ı aynı transaction içinde serbest bırakır. `reschedule_proposed`, eski randevuyu yeni slot kesinleşmeden serbest bırakmaz.
- Gizlilik: Audit özetleri yalnızca durum bilgisini taşır; danışan notu veya iletişim bilgisi audit özetine kopyalanmaz.
- API sınırı: Durum değiştirme endpoint’i aktif oturum, `appointments:manage`, güvenilir origin ve terapist için kendi practitioner kaydına bağlı randevu kontrolü ister. Yetkisiz veya başka terapiste ait kayıtlar servis katmanına iletilmez.
- OPEN: Bildirim/Calendar yan etkileri outbox modeli eklendiğinde aynı transaction’a idempotent event olarak bağlanacaktır.
