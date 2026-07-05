# Aktif Çalışma Devir Teslimi

Son güncelleme: 5 Temmuz 2026, Europe/Berlin

## Aktif çalışma

- Draft PR: `codex/integration-health-panel` dalının push'uyla PR #24 açıldı
- Dal: `codex/integration-health-panel`
- Durum: PR #23 transactional outbox çekirdeğini `main`e teslim etti. Aktif milestone; read-only entegrasyon/outbox sağlık panelini PR #24'te teslim etmektir.

## Bağlayıcı çalışma biçimi

- Windows ve macOS’ta aynı kural geçerlidir: Issue #19 güncel roadmap kaynağıdır.
- PR #18 homepage hero/Hakkımda görselini, PR #20 transaction retry sağlamlaştırmasını, PR #21 public randevu akışını, PR #22 admin ödeme operasyonunu ve PR #23 transactional outbox çekirdeğini teslim etti.
- Aktif health panel milestone'u read-only API, yönetim paneli görünümü, güvenli aggregate metrikleri ve `technical-health:read` yetki kontrolünü PR #24'te teslim eder. Gerçek e-posta/Calendar gönderimi ve provider adapter'ları sonraki review edilebilir milestone'lardır.
- En fazla iki yerel commit, testlerden sonra tek push, tek CI sonuç okuması ve milestone sonunda tek merge onayı hedeflenir.
- CI sonucunu kaydetmek için ayrı commit/push yapılmaz. Dokümanlar ana uygulama değişikliğiyle aynı push’ta güncellenir.
- Bölme yalnızca bağımsız güvenlik hotfix’i, riskli migration veya dış engel varsa ve gerekçe kullanıcıya önceden açıklanırsa yapılır.

## Tamamlananlar

- `main` üzerindeki admin randevu liste ve durum API’leri çalışma dalına alındı.
- Bekleyen randevu talepleri minimum veriyle yönetim ekranında listeleniyor.
- Onay/ret eylemleri işlem etkisini açıklayan onay adımından sonra güvenli durum API’sini çağırıyor.
- Başarılı işlem kuyruktan çıkarılıyor; yetki, yarış ve API hataları güvenli biçimde gösteriliyor.
- PostgreSQL deadlock/serialization yarışları sınırlı retry ile ele alınıyor.
- Windows ve macOS için LF satır sonu, UTF-8 editör ayarı ve Node.js 24.14.0 sabitlendi.
- PR #9 squash merge ile `main` dalına alındı.
- PostgreSQL 17 servis konteynerli integration CI işi eklendi.
- Prisma postinstall için CI `DATABASE_URL` bağlantısı tamamlandı; dört migration ve sekiz gerçek PostgreSQL testi GitHub’da geçti.
- PR #10 squash merge ile `main` dalına alındı.
- ADR-017 ile aydınlatma, açık rıza, randevu koşulları ve veli yetkisi ayrı kapılar olarak kabul edildi.
- Consent subject ile çocuk adına beyan veren guardian grantor ayrı alanlara taşındı.
- PR #11 squash merge ile `main` dalına alındı.
- Hold tüketimi, randevu, allocation devri ve consent kanıt bağlarını atomik yazacak application service sözleşmesi hazırlandı.
- `appointment_consents` additive migration’ı, Prisma ilişkileri ve integrity testleri eklendi.
- Hold tüketimi, snapshot, appointment, allocation devri, consent bağları, status geçmişi ve audit aynı transaction’da uygulandı.
- PR #12 squash merge ile `main` dalına alındı.
- Public appointment request endpoint’i strict/limited JSON, same-origin, güvenli correlation ID ve kontrollü hata sözleşmesiyle eklendi.
- Endpoint sunucu bayrağıyla varsayılan kapalıdır; kapalıyken application service ve veritabanı çağrılmaz.
- Zorunlu explicit-consent türleri yalnızca doğrulanmış sunucu ortam ayarından application service’e aktarılır.
- PR #13 squash merge ile `main` dalına alındı.
- Hold servisi uzmanın IANA saat diliminde availability rule/exception, hizmet süresi-buffer, minimum/maksimum rezervasyon sınırı ve günlük kapasiteyi yeniden uygular.
- Çalışma dışı/bloklu başlangıçlar hiçbir hold, allocation veya audit yazmadan reddedilir.
- Farklı aktif slot artışları ve çelişen istisna tipleri otomatik öncelik uydurmadan fail-closed reddedilir.
- PR #14 squash merge ile `main` dalına alındı.
- Hold süresi çağıran/istemci girdisinden çıkarıldı ve opsiyonel `BOOKING_HOLD_DURATION_MINUTES` sunucu ayarına bağlandı.
- Onaylı hold süresi tanımlı değilse hold servisi veritabanına erişmeden güvenli biçimde durur; test/CI dışında dakika değeri seçilmedi.
- PR #15 squash merge ile `main` dalına alındı.
- Public hold endpoint’i `POST /api/public/appointments/holds` olarak eklendi; süre istemciden alınmaz.
- Endpoint varsayılan kapalı sunucu bayrağı, same-origin, JSON content type, 4 KiB gövde sınırı, strict alan doğrulaması ve güvenli correlation ID uygular.
- Holder token yalnızca `no-store` oluşturma yanıtında döner; public form ve canlı özellik etkinleştirilmedi.
- PR #16 squash merge ile `main` dalına alındı.
- Public slot endpoint’i `GET /api/public/appointments/slots` olarak eklendi; yalnızca UTC başlangıç/bitiş saatlerini döndürür.
- Slot servisi aktif availability rule/exception, hizmet süresi-buffer, minimum/maksimum rezervasyon sınırı, günlük kapasite ve aktif hold/randevu tahsislerini uygular.
- Slot sonucu adaydır; gerçek uygunluk hold transaction’ında yeniden doğrulanır ve public form etkinleştirilmez.
- PR #17 squash merge ile `main` dalına alındı.
- Public booking bootstrap, hizmet/uzman seçimi, canlı slot, hold, minimum yetişkin veya çocuk/veli intake’ı, ayrı consent onayları ve talep referansı `/randevu` sayfasında tek akışta birleştirildi.
- Public client/guardian/consent edinimi hold tüketimi ve appointment ile aynı serializable transaction’a alındı; rollback yetim kişisel kayıt bırakmaz.
- Consent document public başlık/içeriği için yedinci additive migration eklendi; eksik, boş veya çakışan yürürlükte içerik public akışı fail-closed durdurur.
- Ana `PUBLIC_BOOKING_FLOW_ENABLED` bayrağı ve açıkça yapılandırılmış public practitioner sınırı eklendi; production varsayılanları kapalı kaldı.
- PR #20’nin P2034 retry kuralı public intake transaction’ına da uygulandı; üç deneme tükenince ham Prisma hatası yerine güvenli booking conflict döner.
- PR #21 squash merge ile `main` dalına alındı; public booking masaüstü/mobil tarayıcı kontrolü, kalite, build, PostgreSQL 17 ve Vercel kapıları geçti.
- Finans çekirdeği için integer minor-unit tutarlar kullanan `client_plans`, `plan_installments`, `payment_methods`, append-only `finance_ledger_entries` ve `session_credit_entries` modelleri ile additive migration hazırlandı.
- Plan/taksit toplamı, kısmi ödeme, plan ve taksit bakiyesi, fazla ödeme reddi, idempotent kayıt, serializable retry, ters kayıt ve audit kuralları transaction servisinde uygulandı.
- `finance:read`/`finance:manage` yetkili, same-origin, strict ve 32 KiB sınırlı admin API ile `/yonetim/odemeler` ekranı eklendi. Ödeme yöntemi katalogdan yönetilir; serbest metin değildir.
- Belge durumu ve harici referansı audit kaydıyla güncellenir. Bu yüzey resmi muhasebe/e-belge üretmez ve dosya saklamaz.
- PR #22 squash merge ile `main` dalına alındı; quality, build, PostgreSQL integration ve Vercel kapıları geçti.
- Dokuzuncu additive migration ile `outbox_events` ve `OutboxEventStatus` eklendi; idempotency key, worker lease, attempt, retry zamanı, güvenli hata kodu ve terminal zamanını saklar.
- Public request’in ilk `REQUESTED` kaydı ile admin randevu durum geçişleri, status log kimliğinden türetilen tekil `APPOINTMENT_STATUS_CHANGED` olayını aynı transaction’da üretir.
- Outbox payload’ı yalnızca appointment/status-log kimlikleri, önceki/yeni durum ve olay zamanını taşır; ad, iletişim, not, consent metni veya holder token kopyalanmaz.
- Worker servisi yarışta tek claim, süresi dolan lease’i geri alma, çağıranın belirlediği retry zamanı/deneme sınırı, başarılı tamamlama ve dead-letter geçişlerini iyimser koşullu güncellemeyle uygular.- PR #23 squash merge ile `main` dalına alındı; quality, build, PostgreSQL integration ve Vercel kapıları geçti.
- Read-only outbox health API `GET /api/admin/health/outbox` endpoint'i eklendi; safe aggregate metrikleri döndürüyor (status counts, success rate, avg attempts, oldest timestamps).
- Admin paneline `/yonetim/saglik` sayfası ve OutboxHealthDashboard bileşeni eklendi; `technical-health:read` yetkili rollerle görünür.
- Health API ve bileşen testleri (5 API test, 4 service test) eklendi ve tüm quality kontrolleri başarılı.
- PR #24 Draft olarak açıldı; GitHub CI ve Vercel sonucu bekleniyor.
## Sıradaki

1. GitHub CI ve Vercel sonucunu yalnızca bir kez oku; sonucu PR #24 açıklamasına yansıt.
2. PR #24 hazır olduğunda kullanıcıdan tek merge onayı iste.

## Engeller ve açık kararlar

- MVP ödeme yöntemleri ürün tarafından henüz seçilmedi; kod sabit yöntem uydurmaz ve yetkili katalog kaydı olmadan ödeme kabul etmez.
- Fazla ödeme politikası açık karardır; mevcut uygulama fail-closed davranarak plan veya seçilen taksit bakiyesini aşan ödemeyi reddeder.
- Tek tahsilatın birden çok takside atomik dağıtımı, kısmi iade, plan uzatma, fatura dosyası ve otomatik seans hakkı tüketiminde birden fazla aktif plandan hangisinin seçileceği açık karardır; bu işlemler etkinleştirilmedi.
- CSV export doküman kapsamındadır ancak ayrı export izni ve audit kuralı tanımlanmadığı için bu milestone’a sessizce eklenmedi.
- E-posta/Calendar sağlayıcısı, onaylı mesaj şablonları, hangi durumun hangi alıcıya bildirim üreteceği ve worker çalışma ortamı henüz seçilmedi; outbox çekirdeği ve health monitoring bu kararları uydurmaz.
- Retry deneme sayısı ve backoff operasyon politikası açık karardır; servis doğrulanmış `maxAttempts` ve `nextAttemptAt` değerlerini çağırandan ister.
- Calendar external-event eşlemesi ve gerçek gönderim adapter'ları bu milestone'ın dışında kalır; health panel read-only metrikleri sağlar.
- `BOOKING_HOLD_DURATION_MINUTES` production değeri ürün onayı bekleyen açık karardır; ayar tanımsızken servis fail-closed kalır.
- Aynı gün için farklı aktif rule kayıtlarında farklı slot artışlarının öncelik/çözüm kuralı açık karardır; servis bu durumda fail-closed davranır.
- Nihai aydınlatma/açık rıza metinleri ve operasyonel veli yetkisi doğrulama prosedürü hukukçu onayı bekler.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Yönetilen PostgreSQL sağlayıcısı/bölgesi ve nihai hukuk onayı canlı yayın öncesi hâlâ seçilmelidir; yerel PostgreSQL 17 integration paketi çalışmaktadır.
- Public yazma endpoint’i etkinleştirilmeden önce dağıtık rate-limit/abuse altyapısı seçilmelidir; sağlayıcı tahmin edilmemiştir.
- PR #18 görsellerinin yayın izni ve resmi mesleki unvan canlı yayın öncesi doğrulanmalıdır.

## Son doğrulama

- Health API hedefli doğrulama: 2 dosyada 9 unit test (4 health service test, 5 API route test) başarılı; TypeScript type check temiz.
- Admin panel bileşeni: OutboxHealthDashboard client component, safe aggregate metrics (status counts, success rate, avg attempts, oldest timestamps) render ediyor, dış provider çağrısı yok.
- Lint/format/typecheck/test suite tamamlandi: `pnpm quality` başarılı.
- Güncel tam doğrulama: Prisma validate; `pnpm quality` ile lint, typecheck, format ve 35 dosyada 223 test; sentetik production ortamıyla `pnpm build` ve 20 sayfa başarılı.
- Yerel gerçek PostgreSQL doğrulaması: dokuz migration uygulandı; 5 dosyada 31 integration testi claim yarışı, retry zamanı, lease recovery, eski worker sonucu reddi, dead-letter, idempotency ve atomik randevu event’leri dahil başarılı.
- Finans doğrulaması: Prisma format/generate/validate geçti; `pnpm quality` lint, typecheck, format ve 34 dosyada 216 testi başarıyla tamamladı.
- `pnpm build`: `/api/admin/finance` ve `/yonetim/odemeler` dahil production derlemesi, 20 statik sayfa üretimi ve route type kontrolü başarılı.
- Yerel PostgreSQL servisi/`TEST_DATABASE_URL` bulunmadığı için sekizinci additive migration ile eşzamanlı idempotency/ledger integration senaryoları GitHub `postgres-integration` kapısında doğrulanacak.
- PR #18 merge sonrası main `quality`, PostgreSQL integration ve Vercel deployment başarılı.
- Production Vercel URL’i Deployment Protection nedeniyle giriş ekranına yönlendi; özel `berfinakbas.com` alan adı DNS’te çözülmediğinden dış smoke testi açık yayın kapısıdır.
- `P2034` düzeltmesi hedefli unit doğrulama: 2 dosyada 11 test başarılı.
- Gerçek PostgreSQL integration: 3 dosyada 18 test başarılı.
- `pnpm quality`: lint, typecheck, format ve 29 dosyada 191 test başarılı.
- `pnpm build`: sentetik build-time ortam değerleriyle başarılı.
- Public booking güncel `main` üzerinde hedefli doğrulama: 9 test dosyası, 62 test başarılı.
- Public booking güncel `main` üzerinde `pnpm quality`: 31 test dosyası, 200 test başarılı; lint, typecheck ve format kontrolü geçti.
- Public booking güncel `main` üzerinde `pnpm build`: 19 route ile başarılı.
- Public booking tarayıcı doğrulaması: `/randevu` masaüstü ve mobil görünüm geçti; yatay taşma yok, kapalı bayrakta form/kişisel veri alanı üretilmiyor.
- Yerel PostgreSQL servisi/`TEST_DATABASE_URL` bulunmadığı için yedinci migration ve yeni gerçek transaction senaryoları GitHub `postgres-integration` kapısında doğrulanacak.
- Migration/veri modeli değişikliği: `public_title` ve `public_content` nullable/additive alanları eklendi.
- Kişisel veri kapsamı: yalnızca minimum public intake uygulandı; sağlık verisi kapsamı genişlemedi.

## Kaynak önceliği

1. GitHub Issue #19 roadmap
2. Aktif PR açıklaması ve branch
3. Bu dosya
4. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
