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
- PR #99 sonrası aktif durum: production sertleştirmeleri, consent/veli doğrulama kapıları, session-credit bütünlüğü, sağlık kontrolü ve güvenlik başlıkları canlıdır. Sıradaki işler Issue #19 roadmap, `docs/HANDOFF.md` ve açık ürün kararlarına göre review edilebilir milestone’lara bölünür. Sağlayıcı, mesaj şablonu, alıcı matrisi, worker hosting veya production politikası netleşmeden gerçek dış gönderim açılmaz.
- Öncelikli pending başlıklar: kalıcı rate limit/bot koruması, mükerrer public talep incelemesi, bildirim/Calendar provider worker, mesaj şablonu ve alıcı matrisi, backup restore tatbikatı, Google OAuth/MFA doğrulaması ve canlı yayın hukuki kapılarıdır.
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

## Yönetim Paneli "Hub" Yeniden Tasarımı — Uygulama Planı

Bu bölüm, yönetim panelinin Dynamics 365 "Sales Hub / Sales Accelerator"
tarzında kademeli (progressive drill-in) bir dashboard'a dönüştürülmesinin
bağlayıcı planıdır. Kota/oturum kesilirse çalışmaya buradan devam edilir.
Çalışma dalı: `claude/hero-woman-animation-tzl5zg`.

### Hedef deneyim — 4 kademe

1. **Kademe 1 · Menü rayı (sol):** Gruplu dikey menü (Çalışma Alanım,
   Danışanlar, Randevular, Finans, Sistem). Grup başlığına tıklanınca alt
   öğeleri akordeon gibi açılır; öğe seçilince Kademe 2 açılır.
2. **Kademe 2 · Liste paneli (~300px):** Seçilen bölümün kayıt listesi.
   Zaman gruplu ("Bugün", "Bu hafta", "Daha eski"), her satırda monogram
   avatar + isim + son işlem + durum çipi + mini skor. Seçili satır lime
   vurgulu.
3. **Kademe 3 · Kayıt paneli:** Satır tıklanınca sağa açılır. Şeftali
   degrade başlık (isim, hizmet, durum çipleri), aşama şeridi
   (Talep → Kontrol → Onay → Görüşme; aktif dilim teal), Özet/İletişim
   sekmeleri.
4. **Kademe 4 · Geniş çalışma alanı:** "Sıradaki adımlar" sıralı görev
   kartları (lime), kesikli teal **hazırlık skoru halkası** (referanstaki
   Lead Score 90 karşılığı), "Bağlantılı kayıtlar" ve zaman çizelgesi.
   "Genişlet" düğmesi ray + liste panelini daraltıp çalışma alanını tam
   genişliğe çıkarır (rahat çalışma modu).

Geri yürüme: her panelin başındaki ‹ düğmesi bir kademe kapatır. Faz 1'de
panel durumu yerel state'tir; Faz 3'te URL query'ye (`?kayit=`) taşınır.

### Görsel dil (referansla birebir)

- Zemin: açık sıcak gri `#e9e7e2`; paneller beyaz/krem `#fbfaf8`,
  18–26px radius, yumuşak geniş gölgeler.
- Vurgular: **lime** `#dfec83` (seçili öğe, görev kartı), **teal**
  `#12897b` (aşama, skor, olumlu durum), **şeftali degrade**
  (`#fbe3d2 → #f6d0c0`, kayıt başlığı), mürekkep `#201c19`.
- Pill butonlar: beyaz zemin, 1px `#e3ded7` kenar, 999px radius; kayıt
  üstünde yatay eylem şeridi (Kaydet, Yeni, Yenile, PDF, Süreç…).
- Font: Inter benzeri geometrik sans yığını (`"Inter", "SF Pro Text",
"Segoe UI", system-ui, sans-serif`) — yalnızca hub kapsamında
  (`--hub-font`); kamu sitesinin serif kimliğine dokunulmaz. Gerçek Inter
  dosyası Faz 5'te `next/font` ile eklenebilir.
- **Gerçek fotoğraf yok:** üyelerden görsel alınmaz. Avatar yerine
  `HubAvatar` monogramı kullanılır: isim baş harfleri + isimden
  deterministik türetilen sıcak pastel degrade zemin + durum halkası.

### Dosya planı

- `src/components/admin/hub/hub.module.css` — tüm tasarım tokenları ve
  panel/bileşen stilleri (tek dosya).
- `src/components/admin/hub/hub-model.ts` — tipler, sentetik örnek veri
  (gerçek kişi verisi yasak), monogram/grup yardımcıları (saf, test
  edilebilir).
- `src/components/admin/hub/hub-model.test.ts` — yardımcıların unit
  testleri.
- `src/components/admin/hub/hub-avatar.tsx` — monogram avatar.
- `src/components/admin/hub/dashboard-hub.tsx` — 4 kademeli shell
  (client component).
- `src/app/yonetim/hub/page.tsx` — `requirePermission` arkasında önizleme
  rotası; mevcut sayfalara dokunmaz.

### Fazlar

- **Faz 0 (tamam):** Bu plan.
- **Faz 1 (tamam):** Hub kabuğu + sentetik veri + `/yonetim/hub` önizlemesi.
- **Faz 2 (tamam):** `/yonetim/hub` gerçek verilerle besleniyor: sayfa
  `appointments:read` yetkisiyle son 30 talebi (client, guardian,
  practitioner, statusLogs dahil) çeker; `hub-data.ts` saf eşleyicisi durum →
  aşama/çip, zaman grubu, hazırlık skoru (ağırlıklar kodda), sıradaki adımlar
  ve zaman çizelgesini üretir; nav rozetleri açık taleplerden hesaplanır.
- **Faz 3 (tamam):** Kayıt eylemleri canlı: `hub-actions.ts` durum başına
  yalnızca domain durum makinesinin (appointment-status.ts) izin verdiği
  geçişleri sunar ve mevcut PATCH `/api/admin/appointments/:id/status`
  sözleşmesini (reasonCode/toStatus) aynen kullanır; eylemler inline
  onaylıdır (Eminim/Vazgeç), başarıda `router.refresh()`; eylemler yalnızca
  `appointments:manage` yetkisiyle görünür; kayıt seçimi `?kayit=` URL
  parametresinde yaşar (paylaşılabilir/yenilemeye dayanıklı).
- **Faz 4:** Danışanlar, Müsaitlik ve Ödemeler sayfalarının hub'ın
  liste → kayıt akışına taşınması; eski `AdminShell`'in emekliliği.
- **Faz 5:** Cila — gerçek Inter fontu, klavye kısayolları, panel geçiş
  animasyonları, dar ekran davranışı (ray ikonlaşır, paneller üst üste
  kayar).

### Faz 1 kabul ölçütleri

- `/yonetim/hub` yetkili kullanıcıyla açılır; menü → liste → kayıt →
  çalışma alanı akışı çalışır; "Genişlet" modu ray+listeyi daraltır.
- Görsel dil referans paletiyle eşleşir; hiçbir yerde gerçek kişi
  fotoğrafı yoktur (yalnızca monogram avatar).
- Mevcut yönetim sayfaları davranış değiştirmez; kalite kapıları yeşildir.
