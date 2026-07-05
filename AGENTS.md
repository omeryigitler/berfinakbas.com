# AGENTS.md

Bu dosya, projede çalışan geliştirici ve kod ajanları için bağlayıcı çalışma kurallarını tanımlar.

## Cihazlar arası çalışma ve devir teslim

GitHub deposu tek gerçek kaynaktır. Aynı anda yalnızca bir aktif Draft PR bulunur; bu PR’ın dalı Windows ve macOS cihazları arasında devam eden çalışmayı temsil eder.
**Continue davranışı:** Eğer GitHub'daki açık Draft PR bulunur ise, cihaz değiştirince o PR'ın dalına geç ve `git pull --ff-only` uygula. Bu "continue" davranışıdır. Eğer Draft PR yok ise (yeni görev) veya mevcut dal `main` ile aynı ise (önceki çalışma kaybolmuş), güncel `main`'den yeni `codex/<görev>` dalı oluştur.
Her çalışma oturumunun başında:

1. Yerel değişiklikleri ve mevcut dalı kontrol et; kullanıcıya ait veya açıklanamayan değişiklikleri ezme.
2. `git fetch --all --prune` ile uzak dalları güncelle.
3. GitHub’daki açık Draft PR’ları kontrol et. Tam olarak bir Draft PR varsa onun dalına geç ve `git pull --ff-only` uygula.
4. Birden fazla Draft PR varsa görev seçimini tahmin etme. Draft PR yoksa güncel `main` üzerinden açıkça adlandırılmış `codex/<görev>` dalı oluştur.
5. Draft PR açıklamasını, `docs/HANDOFF.md`, `docs/MVP_PLAN.md` ve `docs/DECISIONS.md` dosyalarını okuyarak kaldığın bağlamı kur.

Her çalışma oturumunun sonunda:

1. İlgili testleri, `pnpm quality` ve değişiklik gerektiriyorsa `pnpm build` komutunu çalıştır.
2. `docs/HANDOFF.md` içindeki aktif dal/PR, tamamlananlar, sıradaki iş, engeller ve son doğrulama alanlarını güncelle.
3. Draft PR açıklamasını aynı bilgilerle güncelle.
4. Yalnızca göreve ait dosyaları commit et ve aktif dalı push et.
5. `git status` çıktısının temiz ve dalın uzak karşılığıyla eşit olduğunu doğrula.

Ek kurallar:

- Aynı dal iki cihazda eşzamanlı düzenlenmez. Cihaz değiştirmeden önce commit ve push zorunludur.
- `.env` ve secret değerler commit edilmez; cihazlara parola yöneticisi veya güvenli kanal üzerinden ayrı kurulur.
- Çalışma klasörü iCloud, OneDrive veya Dropbox ile senkronize edilmez; her cihaz kendi clone’unu kullanır.
- Satır sonu ve editör davranışı `.gitattributes` ile `.editorconfig`, Node sürümü `.nvmrc` ve `.node-version`, pnpm sürümü `packageManager` alanı tarafından belirlenir.

## Teslim boyutu ve kota verimliliği

GitHub Issue #19’daki güncel roadmap Windows ve macOS dâhil tüm cihazlarda bağlayıcıdır:

- Birbiriyle ilişkili işler kullanıcıya anlamlı sonuç veren, review edilebilir milestone PR’larında toplanır; ilişkisiz kapsamlar aynı PR’a doldurulmaz.
- PR #18 homepage hero/Hakkımda görselini, PR #20 transaction retry sağlamlaştırmasını, PR #21 public booking akışını, PR #22 admin finans operasyonunu, PR #23 transactional outbox çekirdeğini ve PR #24 read-only entegrasyon/outbox sağlık panelini teslim etti.
- PR #24 sonrası aktif durum: Health panel canlıdır. Sıradaki işler Issue #19 roadmap, `docs/HANDOFF.md` ve açık ürün kararlarına göre seçilecek review edilebilir milestone’lara bölünür. Sağlayıcı, mesaj şablonu, alıcı matrisi, worker hosting veya production politikası netleşmeden gerçek dış gönderim açılmaz.
- Öncelikli pending başlıklar: bildirim/Calendar sağlayıcı kararı, mesaj şablonu ve alıcı matrisi, retry/backoff operasyon politikası, worker scheduler/hosting, Calendar external-event eşlemesi, ödeme ürünü kararları, production hold süresi, Google OAuth/MFA doğrulaması, yönetilen PostgreSQL bölgesi ve canlı yayın hukuki kapılarıdır.
- Varsayılan çalışma biçimi tek dal, en fazla iki yerel commit ve testlerden sonra tek push’tur. CI sonucunu kaydetmek veya dokümanı ayrıca güncellemek için yeni push/commit yapılmaz; durum PR açıklamasında güncellenir.
- İlgili hedefli testler bir kez, tam `pnpm quality` ve gerekiyorsa `pnpm build` bir kez çalıştırılır. GitHub CI tamamlandıktan sonra sonuç tek kez okunur.
- Kullanıcıdan milestone sonunda tek merge onayı istenir; ara adımlar için ayrı merge onayı istenmez.
- `main` dalına doğrudan commit atılmaz. Her değişiklik branch + PR + yeşil kalite kapıları üzerinden ilerler.

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
- `20260629030000_booking_hold_core` migration’ı ile hold-hold, hold-randevu ve randevu-randevu eşzamanlılık testleri gerçek PostgreSQL kapısında geçmektedir. Randevu çekirdeğiyle ilgili her teslim bu kapıyı yeniden çalıştırır; başarısızlık canlıya çıkış engelidir.
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
