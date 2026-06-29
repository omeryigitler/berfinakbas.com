# AGENTS.md

Bu dosya, projede çalışan geliştirici ve kod ajanları için bağlayıcı çalışma kurallarını tanımlar.

## Dil ve ürün bağlamı

- Kullanıcıya görünen tüm metinler varsayılan olarak Türkçe yazılır.
- Teknik isimler İngilizce olabilir; domain dili tutarlı tutulur.
- Bu uygulama gerçek sağlık randevuları ve özel nitelikli kişisel verilerle çalışabilir. Hızdan önce doğruluk, veri minimizasyonu ve geri alınabilirlik gelir.
- Belirsiz iş kuralı tahmin edilmez. `docs/` altında açık karar yoksa konu `OPEN` olarak işaretlenir.

## Değişiklik sınırları

- İstenen görevin kapsamını sessizce genişletme.
- Sağlayıcı, ödeme sistemi, saklama süresi veya hukuki işleme şartı uydurma.
- Klinik not, tanı, dosya veya ayrıntılı sağlık öyküsü alanı ekleme; bunlar MVP dışıdır.
- Fiyat, kampanya, hasta yorumu veya başarı garantisini public siteye ekleme.

## Mimari kurallar

- Backend, randevuların tek gerçek kaynağıdır.
- Google Calendar, e-posta ve WhatsApp entegrasyonları asenkron yan etkidir; çekirdek işlemi başarısızlığa sürükleyemez.
- Dış entegrasyon çağrıları idempotent olmalı ve outbox/retry yaklaşımı kullanmalıdır.
- Tarihler veritabanında UTC, işletme kuralları yapılandırılmış IANA saat dilimiyle işlenir.
- Para değerleri kayan nokta olarak saklanmaz; en küçük para birimi ve para birimi kodu kullanılır.
- Değişebilir süre, buffer, iptal penceresi, hatırlatma ve görünürlük kuralları hardcoded olmaz.
- Randevu oluşturulurken hizmet adı, süre, buffer, konum ve ilgili politikalar snapshot olarak kaydedilir.

## Veri bütünlüğü

- Randevu, ödeme, finans hareketi, seans hakkı, onay ve audit log kayıtlarında hard delete yasaktır.
- Düzeltme; durum geçişi, ters kayıt veya yeni düzeltme kaydıyla yapılır.
- Bakiyenin gerçek kaynağı append-only hareketlerdir; cache alanları tek gerçek kaynak olamaz.
- Çakışma kontrolü yalnızca arayüzde yapılmaz; veritabanı/transaction katmanında garanti edilir.
- Her kritik yazma işlemi aynı transaction içinde iş kaydı, durum geçmişi ve gerekli audit kaydını üretir.

## Güvenlik ve gizlilik

- En az yetki ilkesi ve rol bazlı erişim uygulanır.
- Admin hesaplarında MFA canlıya çıkış koşuludur.
- Log, hata mesajı, analitik, e-posta konu satırı ve takvim başlığında sağlık ayrıntısı veya gereksiz kişisel veri bulunmaz.
- Secret değerler repoya, örnek veriye, test çıktısına veya istemci bundle’ına yazılmaz.
- Üretim verisi geliştirme/test ortamına kopyalanmaz.
- Dosya yükleme varsayılan olarak kapalıdır; açılırsa tür, boyut, zararlı içerik taraması, şifreleme ve erişim kontrolü gerekir.

## Veritabanı değişiklikleri

- Şema değişikliği migration olmadan yapılmaz.
- Migration geri dönüş veya ileri-düzeltme stratejisini belirtir.
- Üretimde veri kaybı riski olan migration iki aşamalı hazırlanır.
- Seed verisi sentetik olmalı; gerçek kişi bilgisi içermemelidir.

## Test gereksinimi

- Her özellik için uygun seviyede unit, integration veya end-to-end test eklenir.
- Randevu motorunda eşzamanlı istek, saat dilimi, yaz/kış saati, buffer ve ayar snapshot testleri zorunludur.
- `20260629030000_booking_hold_core` migration’ı gerçek PostgreSQL üzerinde uygulanıp hold-hold, hold-randevu ve randevu-randevu eşzamanlılık testleri geçene kadar bu konu canlıya çıkış engelidir. Randevu çekirdeğiyle ilgili her teslimde bu açık test yeniden belirtilir.
- Finans modülünde kısmi ödeme, ters kayıt, yuvarlama ve aynı isteğin tekrar gönderilmesi test edilir.
- Yetki testleri hem izin verilen hem reddedilen erişimi kapsar.
- Bir hata düzeltmesi, mümkünse önce hatayı yeniden üreten regresyon testiyle başlar.

## Kod kalitesi

- TypeScript strict mode korunur.
- Girdi sınırlarında Zod veya eşdeğer runtime validation kullanılır.
- Domain kuralları route/controller içine dağılmaz; test edilebilir servislerde tutulur.
- Kullanıcıya güvenli ve anlaşılır hata gösterilir; dahili ayrıntı yalnızca güvenli logda tutulur.
- Erişilebilirlik için klavye kullanımı, odak yönetimi, etiketler ve yeterli kontrast korunur.

## Görev teslim kontrolü

Her teslimde şunları belirt:

- Değişen davranış ve kapsam
- Değişen tablo/migration
- Güvenlik, KVKK ve veri aktarımı etkisi
- Eklenen veya çalıştırılan testler
- Bilinen riskler ve açık kararlar
- Randevu çekirdeği değiştiyse gerçek PostgreSQL migration/eşzamanlılık testinin güncel durumu

Şu soru cevaplanmadan kritik özellik tamamlanmış sayılmaz:

> Bu değişiklik randevu, ödeme, seans hakkı, onay veya danışan verisinde karışıklığa neden olabilir mi?
