# Aktif Çalışma Devir Teslimi

Son güncelleme: 30 Haziran 2026, Europe/Berlin

## Aktif çalışma

- Draft PR: `#9 — [codex] Add pending appointments admin screen`
- Dal: `codex/admin-pending-appointments-ui`
- Durum: Bekleyen talepler ekranı, transaction retry düzeltmesi, onay/ret eylemleri ve cihazlar arası devir teslim düzeni hazır. GitHub kalite ve Vercel kontrolleri geçti; Draft PR inceleme/birleştirme kararı bekliyor.

## Tamamlananlar

- `main` üzerindeki admin randevu liste ve durum API’leri çalışma dalına alındı.
- Bekleyen randevu talepleri minimum veriyle yönetim ekranında listeleniyor.
- Onay/ret eylemleri işlem etkisini açıklayan onay adımından sonra güvenli durum API’sini çağırıyor.
- Başarılı işlem kuyruktan çıkarılıyor; yetki, yarış ve API hataları güvenli biçimde gösteriliyor.
- PostgreSQL deadlock/serialization yarışları sınırlı retry ile ele alınıyor.
- Windows ve macOS için LF satır sonu, UTF-8 editör ayarı ve Node.js 24.14.0 sabitlendi.

## Sıradaki

1. Draft PR #9’u incele; uygun olduğunda incelemeye hazır işaretle ve birleştir.
2. Hold’dan randevu talebi üretmeden önce zorunlu consent türleri ile çocuk/veli yetki kararlarını kapat.
3. Yönetilen PostgreSQL/CI ortamında gerçek integration paketini yeniden çalıştır.

## Engeller ve açık kararlar

- Hold süresinin canlı sistem ayarı açık karardır.
- Zorunlu consent belgeleri ve çocuk/veli doğrulama kuralı açık karardır.
- Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici doğrulaması yayın kapısıdır.
- Bu cihazda yerel PostgreSQL çalışmadığı için integration paketi tekrar koşturulmadı; önceki doğrulamada sekiz test üç ardışık turda geçti.

## Son doğrulama

- `pnpm quality`: 21 test dosyası, 131 test geçti.
- `pnpm build`: başarılı.
- GitHub `quality` ve Vercel deployment kontrolleri: başarılı.
- Migration/veri modeli değişikliği: yok.
- Kişisel/sağlık verisi kapsamı: genişlemedi.

## Kaynak önceliği

1. Tek açık Draft PR açıklaması
2. Bu dosya
3. `docs/MVP_PLAN.md` ve `docs/DECISIONS.md`

Her çalışma oturumunun sonunda bu dosya ve Draft PR açıklaması birlikte güncellenir.
