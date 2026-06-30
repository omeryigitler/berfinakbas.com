# Aktif Çalışma Devir Teslimi

Son güncelleme: 30 Haziran 2026, Europe/Berlin

## Aktif çalışma

- Draft PR: `#10 — [codex] Run PostgreSQL integration tests in CI`
- Dal: `codex/postgres-integration-ci`
- Durum: PR #9 `main` dalına birleştirildi. PR #10’daki PostgreSQL 17 integration işi, quality ve Vercel kontrolleri geçti; inceleme/birleştirme kararı bekliyor.

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

## Sıradaki

1. Draft PR #10’u incele; uygun olduğunda incelemeye hazır işaretle ve `main` dalına birleştir.
2. Hold’dan randevu talebi üretmeden önce zorunlu consent türleri ile çocuk/veli yetki kararlarını kapat.
3. Canlıya çıkış öncesinde seçilecek yönetilen PostgreSQL sürümü/bölgesi üzerinde integration paketini çalıştır.

## Engeller ve açık kararlar

- Hold süresinin canlı sistem ayarı açık karardır.
- Zorunlu consent belgeleri ve çocuk/veli doğrulama kuralı açık karardır.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Bu cihazda yerel PostgreSQL çalışmadığı için integration paketi yerelde tekrar koşturulmadı; GitHub CI PostgreSQL 17.10 üzerinde doğrulamayı tamamladı.

## Son doğrulama

- `pnpm quality`: 21 test dosyası, 131 test geçti.
- `pnpm build`: başarılı.
- GitHub `quality` ve Vercel deployment kontrolleri: başarılı.
- GitHub `postgres-integration`: dört migration ve sekiz test başarılı.
- Migration/veri modeli değişikliği: yok.
- Kişisel/sağlık verisi kapsamı: genişlemedi.

## Kaynak önceliği

1. Tek açık Draft PR açıklaması
2. Bu dosya
3. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
