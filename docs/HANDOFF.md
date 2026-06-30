# Aktif Çalışma Devir Teslimi

Son güncelleme: 30 Haziran 2026, Europe/Malta

## Aktif çalışma

- Draft PR: `#13 — [codex] Add a fail-closed public appointment request API`
- Dal: `codex/public-appointment-request-api`
- Durum: PR #12 `main` dalına birleştirildi. PR #13’te atomik application service için güvenli, varsayılan kapalı public API sınırı ve testleri uygulanıyor; public form açılmıyor.

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

## Sıradaki

1. Draft PR #13’ün GitHub quality, PostgreSQL integration ve Vercel kontrollerini tamamla; uygunsa birleştir.
2. Public hold/client/consent edinim akışını ayrı ve varsayılan kapalı teslimler halinde tasarla.
3. Dağıtık rate-limit/abuse kontrolü ve nihai hukuk onayı olmadan production bayrağını veya public formu etkinleştirme.

## Engeller ve açık kararlar

- Hold süresinin canlı sistem ayarı açık karardır.
- Nihai aydınlatma/açık rıza metinleri ve operasyonel veli yetkisi doğrulama prosedürü hukukçu onayı bekler.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Yönetilen PostgreSQL sağlayıcısı/bölgesi ve nihai hukuk onayı canlı yayın öncesi hâlâ seçilmelidir; yerel PostgreSQL 17 integration paketi çalışmaktadır.
- Public yazma endpoint’i etkinleştirilmeden önce dağıtık rate-limit/abuse altyapısı seçilmelidir; sağlayıcı tahmin edilmemiştir.

## Son doğrulama

- Hedefli unit doğrulama: 3 test dosyası, 22 test başarılı.
- `pnpm quality`: 24 test dosyası, 157 test başarılı.
- `pnpm build`: sentetik build-time ortam değerleriyle başarılı.
- Yerel `pnpm test:integration`: altı migration ve on altı gerçek PostgreSQL testi başarılı.
- GitHub `quality`, `postgres-integration`, Vercel ve preview comment kontrolleri başarılı.
- Migration/veri modeli değişikliği: yok.
- Kişisel/sağlık verisi kapsamı: genişlemedi.

## Kaynak önceliği

1. Tek açık Draft PR açıklaması
2. Bu dosya
3. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
