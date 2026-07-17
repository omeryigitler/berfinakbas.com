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
5. Draft PR açıklamasını, `docs/HANDOFF.md`, `docs/MVP_PLAN.md`, `docs/DECISIONS.md` ve aktif tasarım çalışmasında `docs/ADMIN_REDESIGN_PLAN.md` dosyasını okuyarak kaldığın bağlamı kur.

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
- PR #106 sonrası aktif production durumu: public site cilası ve `/yonetim/hub` kayıt merkezi canlıdır; BotID Basic ve açık mükerrer danışan inceleme akışı da production kapsamındadır.
- Aktif yönetim tasarımı çalışması Draft PR #107 ve `design/unified-admin-panel` dalıdır. Bu çalışma tamamlanana kadar başka bir admin tasarım dalı açılmaz.
- Öncelikli ürün/yayın başlıkları: Vercel Firewall rate limit kuralı, bildirim/Calendar provider worker, mesaj şablonu ve alıcı matrisi, backup restore tatbikatı, Google OAuth/MFA doğrulaması ve canlı yayın hukuki kapılarıdır.
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

## Birleşik Yönetim Paneli — Bağlayıcı Tasarım Kararı

Yönetim paneli artık iki ayrı görsel ürün olarak geliştirilmez. `/yonetim` çalışma alanı ile `/yonetim/hub` kayıt merkezi aynı tasarım sistemi, aynı terminoloji ve aynı etkileşim kurallarını kullanır.

### Bilgi mimarisi

- `/yonetim`: operasyon özeti, hızlı işlemler ve deploy gerektirmeyen hizmet/iletişim ayarları.
- `/yonetim/hub`: kayıt seçme, inceleme ve izin verilen durum geçişleri için kademeli kayıt merkezi.
- `/yonetim/danisanlar`: danışan arama, filtre ve kayıt listesi.
- `/yonetim/danisan-profili?clientId=...`: danışan, veli, consent, randevu ve finans bağlamının ana profil yüzeyi.
- `/yonetim/randevular`: takvim/liste ve ağır randevu işlemleri.
- `/yonetim/musaitlik`: haftalık kurallar ve istisnalar.
- `/yonetim/odemeler`: plan, taksit, ödeme ve hareket yönetimi.
- `/yonetim/saglik`: read-only entegrasyon ve sistem sağlığı.

Menü öğesi yalnızca ilgili `*:read` yetkisi varsa görünür. Yazma butonunun görünmesi yeterli değildir; sunucu her istekte `*:manage`, oturum, origin ve kapsam doğrulamasını tekrar yapar.

### Tek görsel sistem

- Zemin `#e9e7e2`, panel `#fbfaf8`, yumuşak panel `#f4f2ec`, çizgi `#e3ded7`, mürekkep `#201c19`.
- Seçili kayıt ve sıradaki işlem için lime `#dfec83`; olumlu durum ve ana işlem için teal `#12897b`; kayıt/başlık vurgusu için şeftali `#fbe3d2 → #f6d0c0` kullanılır.
- Admin fontu self-host Inter Variable’dır. Public sitenin serif kimliği admin veri yüzeylerine taşınmaz.
- Unicode işaretler yalnızca geçici navigasyon ikonu olabilir; yeni ortak bileşenlerde erişilebilir, tutarlı SVG ikon tercih edilir.
- Gerçek danışan/veli fotoğrafı gösterilmez. Avatarlar yalnızca deterministik monogramdır.
- Masaüstünde sol navigasyon + çalışma alanı, tablette sarılan navigasyon, mobilde tek sütun uygulanır. `prefers-reduced-motion` korunur.

### Etkileşim kuralları

- Browser `alert`, `confirm` ve native belirsiz popup kullanılmaz. Kritik işlem inline confirmation veya erişilebilir modal ile onaylanır.
- Filtre, seçili kayıt, açık modal ve sekme yenilenebilir/paylaşılabilir olması gerekiyorsa URL query’de yaşar.
- Tarih alanlarında ortak custom takvim; seçenek alanlarında ortak custom dropdown kullanılır. Uzun seçenek listeleri kaydırılabilir olmalıdır.
- Üst arama mevcut sözleşmede danışan adı, telefon ve e-postaya gider. Gerçek çoklu-entity arama API’si yazılmadan “global arama” iddiası gösterilmez.
- Dashboard yalnızca veritabanından hesaplanan gerçek metrikleri gösterir. Sahte yüzde trendi, başarı oranı, doğrulanmamış danışan sayısı veya tahminî finans değeri yasaktır.
- Hub’daki sayı klinik başarı/öncelik skoru değildir. Gösterilecekse adı **Kayıt tamlığı** olmalı ve hangi alanların eksik olduğu açıkça listelenmelidir; ürün kararı olmadan ağırlıklar iş kuralı gibi sunulmaz.
- Liste yüzeyi minimum veri gösterir. İletişim, consent ve finans ayrıntısı yalnızca izinli kayıt detayında açılır.

### Bileşen standardı

- Navigasyon, üst bar, profil pili, durum çipi, filtre çubuğu, kart, tablo/liste satırı, empty state, hata bandı, toast, modal, custom dropdown ve custom takvim tek ortak tasarım dilinde olmalıdır.
- Aynı işlev için yeni bir lokal CSS varyantı eklemeden önce mevcut ortak bileşen genişletilir.
- `admin-dashboard-refresh.module.css` klasik sayfaların Hub tokenlarına geçiş katmanıdır. Yeni kalıcı özellikler mümkün olduğunda ortak token/bileşene taşınmalı; yeni “polish/fix” override dosyası açılmamalıdır.

### Geçiş durumu — PR #107

- Ortak `AdminShell` menüsü çalışma alanı, kayıt merkezi, danışan, randevu, müsaitlik, ödeme ve sistem sağlığı terminolojisine geçirildi.
- Klasik sayfaların sidebar, topbar, başlık, kart, liste, form ve responsive görünümü Hub tokenlarıyla birleştirildi.
- Mevcut iş kuralları, API’ler, migration’lar ve veri modeli değiştirilmedi.
- Sonraki adım: Preview’da tüm yönetim rotalarını yetkili hesapla dolaş; taşma, odak, modal, custom kontrol ve dar ekran regresyonlarını tek turda düzelt. Ardından `pnpm quality`, `pnpm build`, ilgili PostgreSQL kapıları ve tek production merge/deploy.
