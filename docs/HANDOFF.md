# Aktif Çalışma Devir Teslimi

Son güncelleme: 30 Haziran 2026, Europe/Berlin

## Aktif çalışma

- Draft PR: `#12 — [codex] Design appointment request transaction`
- Dal: `codex/booking-request-service`
- Durum: PR #11 `main` dalına birleştirildi. PR #12’de additive `appointment_consents` migration’ı ve hold’dan `REQUESTED` randevu üreten atomik application service uygulandı; yerel kalite/PostgreSQL doğrulaması geçiyor.

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

## Sıradaki

1. Draft PR #12’nin GitHub quality, PostgreSQL integration ve Vercel kontrollerini tamamla; uygunsa birleştir.
2. Application service için güvenli public request API sınırını ayrı PR’da aç.
3. Nihai hukuk onayı olmadan public formu/canlı gönderimi etkinleştirme.

## Engeller ve açık kararlar

- Hold süresinin canlı sistem ayarı açık karardır.
- Nihai aydınlatma/açık rıza metinleri ve operasyonel veli yetkisi doğrulama prosedürü hukukçu onayı bekler.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Yönetilen PostgreSQL sağlayıcısı/bölgesi ve nihai hukuk onayı canlı yayın öncesi hâlâ seçilmelidir; yerel PostgreSQL 17 integration paketi çalışmaktadır.

## Son doğrulama

- `pnpm quality`: 23 test dosyası, 143 test geçti.
- `pnpm build`: başarılı.
- Yerel `pnpm test:integration`: altı migration ve on altı test başarılı.
- GitHub `quality`, `postgres-integration` ve Vercel: yeni commit push edildikten sonra yeniden çalışacak.
- Migration/veri modeli değişikliği: additive `appointment_consents` composite key, iki `ON DELETE RESTRICT` foreign key ve consent index’i.
- Kişisel/sağlık verisi kapsamı: genişlemedi.

## Kaynak önceliği

1. Tek açık Draft PR açıklaması
2. Bu dosya
3. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
