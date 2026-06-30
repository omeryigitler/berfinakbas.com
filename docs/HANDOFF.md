# Aktif Çalışma Devir Teslimi

Son güncelleme: 30 Haziran 2026, Europe/Berlin

## Aktif çalışma

- Draft PR: `#12 — [codex] Design appointment request transaction`
- Dal: `codex/booking-request-service`
- Durum: PR #11 `main` dalına birleştirildi. Hold’dan `REQUESTED` randevu üreten transaction servisi için uygulama sözleşmesi ve consent kanıtı join-table gereksinimi hazırlandı.

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

## Sıradaki

1. `appointment_consents` additive migration ve PostgreSQL integrity testini ekle.
2. Hold’dan `REQUESTED` randevu üreten application servisini transaction ve yarış testleriyle uygula.
3. Servis tamamlandıktan sonra public API/form sınırını ayrı PR’da aç.

## Engeller ve açık kararlar

- Hold süresinin canlı sistem ayarı açık karardır.
- Nihai aydınlatma/açık rıza metinleri ve operasyonel veli yetkisi doğrulama prosedürü hukukçu onayı bekler.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Bu cihazda yerel PostgreSQL çalışmadığı için integration paketi yerelde tekrar koşturulmadı; GitHub CI PostgreSQL 17.10 üzerinde doğrulamayı tamamladı.

## Son doğrulama

- `pnpm quality`: 22 test dosyası, 138 test geçti.
- `pnpm build`: başarılı.
- GitHub `quality` ve Vercel deployment kontrolleri: başarılı.
- GitHub `postgres-integration`: beş migration ve on test başarılı.
- Migration/veri modeli değişikliği: additive `granted_by_guardian_id`, foreign key, index ve grantor/client constraint’i.
- Kişisel/sağlık verisi kapsamı: genişlemedi.

## Kaynak önceliği

1. Tek açık Draft PR açıklaması
2. Bu dosya
3. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
