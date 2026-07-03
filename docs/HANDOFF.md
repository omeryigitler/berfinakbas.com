# Aktif Çalışma Devir Teslimi

Son güncelleme: 3 Temmuz 2026, Europe/Malta

## Aktif çalışma

- Aktif PR: `#18 — Ana sayfaya Figma hissiyatlı scroll hero ekle`
- Dal: `feature/hero-scroll-animation`
- Durum: PR #17 `main` dalına birleştirildi. PR #18; homepage scroll hero, Berfin portresi ve Hakkımda görsel düzenini tamamlıyor. Public booking flow bu PR’ın kapsamı değildir.

## Bağlayıcı çalışma biçimi

- Windows ve macOS’ta aynı kural geçerlidir: Issue #19 güncel roadmap kaynağıdır.
- #18 yalnızca homepage hero ve Hakkımda görsel kalitesini teslim eder; booking/domain kapsamı eklenmez.
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

## Sıradaki

1. PR #18’de içerik kuralları, erişilebilirlik, responsive görünüm ve kalite kapılarını tamamla.
2. Vercel Preview ile homepage ve Hakkımda sayfasını masaüstü/mobil doğrula; kullanıcı onayından sonra merge et.
3. Merge sonrası production smoke test yap.
4. Sonraki milestone’da client/guardian/consent edinimini veri minimizasyonuyla slot→hold→request akışına bağla.
5. Production hold süresi, dağıtık abuse kontrolü ve nihai hukuk onayı olmadan public yazma bayraklarını/formu etkinleştirme.

## Engeller ve açık kararlar

- `BOOKING_HOLD_DURATION_MINUTES` production değeri ürün onayı bekleyen açık karardır; ayar tanımsızken servis fail-closed kalır.
- Aynı gün için farklı aktif rule kayıtlarında farklı slot artışlarının öncelik/çözüm kuralı açık karardır; servis bu durumda fail-closed davranır.
- Nihai aydınlatma/açık rıza metinleri ve operasyonel veli yetkisi doğrulama prosedürü hukukçu onayı bekler.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Yönetilen PostgreSQL sağlayıcısı/bölgesi ve nihai hukuk onayı canlı yayın öncesi hâlâ seçilmelidir; yerel PostgreSQL 17 integration paketi çalışmaktadır.
- Public yazma endpoint’i etkinleştirilmeden önce dağıtık rate-limit/abuse altyapısı seçilmelidir; sağlayıcı tahmin edilmemiştir.
- PR #18 görsellerinin yayın izni ve resmi mesleki unvan canlı yayın öncesi doğrulanmalıdır.

## Son doğrulama

- PR #18 hero model testi: 1 dosyada 2 test başarılı.
- `pnpm quality`: lint, typecheck, format ve 29 dosyada 188 test başarılı.
- `pnpm build`: sentetik build-time ortam değerleriyle başarılı.
- PR #18’in önceki GitHub turunda PostgreSQL integration geçti; format kontrolü iki dosyada başarısız olmuştu. Güncel push sonrasında CI yeniden doğrulanacak.
- In-app browser kontrol aracı bu oturumda sağlanmadı; desktop/mobile görsel doğrulama Vercel Preview’da manuel yayın kapısıdır.
- Migration/veri modeli değişikliği: yok.
- Kişisel/sağlık verisi kapsamı: genişlemedi.

## Kaynak önceliği

1. GitHub Issue #19 roadmap
2. Aktif PR açıklaması ve branch
3. Bu dosya
4. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
