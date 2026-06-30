# Aktif Çalışma Devir Teslimi

Son güncelleme: 30 Haziran 2026, Europe/Berlin

## Aktif çalışma

- Draft PR: Bu oturumda `codex/postgres-integration-ci` dalı için açılacak.
- Dal: `codex/postgres-integration-ci`
- Durum: PR #9 `main` dalına birleştirildi. Gerçek PostgreSQL migration ve yarış testlerini her pull requestte çalıştıracak ayrı CI işi hazırlanıyor.

## Tamamlananlar

- `main` üzerindeki admin randevu liste ve durum API’leri çalışma dalına alındı.
- Bekleyen randevu talepleri minimum veriyle yönetim ekranında listeleniyor.
- Onay/ret eylemleri işlem etkisini açıklayan onay adımından sonra güvenli durum API’sini çağırıyor.
- Başarılı işlem kuyruktan çıkarılıyor; yetki, yarış ve API hataları güvenli biçimde gösteriliyor.
- PostgreSQL deadlock/serialization yarışları sınırlı retry ile ele alınıyor.
- Windows ve macOS için LF satır sonu, UTF-8 editör ayarı ve Node.js 24.14.0 sabitlendi.
- PR #9 squash merge ile `main` dalına alındı.
- PostgreSQL 17 servis konteynerli integration CI işi eklendi.

## Sıradaki

1. Yeni Draft PR’da GitHub `quality`, `postgres-integration` ve Vercel kontrollerini doğrula.
2. CI işi geçtikten sonra PR’ı inceleyip `main` dalına birleştir.
3. Hold’dan randevu talebi üretmeden önce zorunlu consent türleri ile çocuk/veli yetki kararlarını kapat.

## Engeller ve açık kararlar

- Hold süresinin canlı sistem ayarı açık karardır.
- Zorunlu consent belgeleri ve çocuk/veli doğrulama kuralı açık karardır.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Bu cihazda yerel PostgreSQL çalışmadığı için integration paketi yerelde tekrar koşturulmadı; yeni GitHub CI işi gerçek PostgreSQL 17 üzerinde doğrulama sağlayacak.

## Son doğrulama

- `pnpm quality`: 21 test dosyası, 131 test geçti.
- `pnpm build`: başarılı.
- GitHub `quality` ve Vercel deployment kontrolleri: başarılı.
- Yeni `postgres-integration` CI işi: GitHub doğrulaması bekleniyor.
- Migration/veri modeli değişikliği: yok.
- Kişisel/sağlık verisi kapsamı: genişlemedi.

## Kaynak önceliği

1. Tek açık Draft PR açıklaması
2. Bu dosya
3. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
