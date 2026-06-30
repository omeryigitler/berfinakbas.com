# Aktif Çalışma Devir Teslimi

Son güncelleme: 30 Haziran 2026, Europe/Malta

## Aktif çalışma

- Draft PR: `#16 — [codex] Add a fail-closed public appointment hold API`
- Dal: `codex/public-appointment-hold-api`
- Durum: PR #15 `main` dalına birleştirildi. PR #16’da same-origin, strict/limited JSON ve güvenli hata sözleşmeli public hold API sınırı ekleniyor; sunucu bayrağı varsayılan kapalıdır ve public form açılmıyor.

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

## Sıradaki

1. Draft PR #16’nın GitHub quality, PostgreSQL integration ve Vercel kontrollerini tamamla; uygunsa birleştir.
2. Public slot okuma ve client/consent edinim akışlarını ayrı, varsayılan kapalı teslimler halinde tasarla.
3. Production hold süresi ile dağıtık abuse kontrolü onaylanmadan public hold yazımını etkinleştirme.
4. Dağıtık rate-limit/abuse kontrolü ve nihai hukuk onayı olmadan production bayrağını veya public formu etkinleştirme.

## Engeller ve açık kararlar

- `BOOKING_HOLD_DURATION_MINUTES` production değeri ürün onayı bekleyen açık karardır; ayar tanımsızken servis fail-closed kalır.
- Aynı gün için farklı aktif rule kayıtlarında farklı slot artışlarının öncelik/çözüm kuralı açık karardır; servis bu durumda fail-closed davranır.
- Nihai aydınlatma/açık rıza metinleri ve operasyonel veli yetkisi doğrulama prosedürü hukukçu onayı bekler.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Yönetilen PostgreSQL sağlayıcısı/bölgesi ve nihai hukuk onayı canlı yayın öncesi hâlâ seçilmelidir; yerel PostgreSQL 17 integration paketi çalışmaktadır.
- Public yazma endpoint’i etkinleştirilmeden önce dağıtık rate-limit/abuse altyapısı seçilmelidir; sağlayıcı tahmin edilmemiştir.

## Son doğrulama

- Hedefli env/public hold route doğrulama: 2 test dosyası, 19 test başarılı.
- `pnpm quality`: 26 test dosyası, 174 test başarılı.
- `pnpm build`: sentetik build-time ortam değerleriyle başarılı.
- PR #15 için GitHub `quality`, gerçek PostgreSQL `postgres-integration`, Vercel ve preview comment kontrolleri başarılı.
- PR #16 için GitHub `quality`, gerçek PostgreSQL `postgres-integration`, Vercel ve preview comment kontrolleri başarılı.
- Migration/veri modeli değişikliği: yok.
- Kişisel/sağlık verisi kapsamı: genişlemedi.

## Kaynak önceliği

1. Tek açık Draft PR açıklaması
2. Bu dosya
3. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
