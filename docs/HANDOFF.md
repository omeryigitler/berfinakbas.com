# Aktif Çalışma Devir Teslimi

Son güncelleme: 30 Haziran 2026, Europe/Berlin

## Aktif çalışma

- Draft PR: `#11 — [codex] Define booking consent and guardian policy`
- Dal: `codex/booking-consent-decisions`
- Durum: PR #10 `main` dalına birleştirildi. PR #11’deki consent/veli politikası, additive migration, quality, PostgreSQL integration ve Vercel kontrolleri geçti; inceleme/birleştirme kararı bekliyor.

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

## Sıradaki

1. Draft PR #11’i incele; uygun olduğunda incelemeye hazır işaretle ve `main` dalına birleştir.
2. Hold’dan `REQUESTED` randevu üreten application servisini ADR-017 kapılarıyla uygula.
3. Public API/form açılmadan önce nihai hukuki metin ve veli prosedürü yayın kapılarını doğrula.

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
