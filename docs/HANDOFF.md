# Aktif Çalışma Devir Teslimi

Son güncelleme: 16 Temmuz 2026, Europe/Malta

## Aktif çalışma

- Ana dal: `main`
- Son production teslimi: PR #99 — production workflows and data integrity hardening
- Son production commit: `3bdc1610d593730346e0bb702c5bc59a79703479`
- Açık PR: yok
- Public randevu: operasyonel yayın kapıları tamamlanana kadar fail-closed

## Canlı durum

- Vercel production deploy başarılı.
- `/api/health` veritabanını doğrulayarak `200 / ok` dönüyor.
- Eski `/yonetim/danisanlar/yeni` yolu `/yonetim/danisan-olustur` sayfasına yönleniyor.
- Public `/randevu` sayfası erişilebilir; form feature flag ve yapılandırma kapıları kapalıyken kişisel veri kabul etmiyor.
- Son kalite turunda lint, typecheck, unit, format, build ve PostgreSQL integration işleri geçti.

## Tamamlanan son kapsam

- Production migration guard yalnızca Vercel production ortamında çalışıyor.
- CI format kontrolü bloklayıcıdır.
- Randevu durum geçişleri Serializable transaction ve sınırlı retry kullanıyor.
- WEB randevuları onaylanmadan önce güncel consent belgeleri ve çocuk danışanda doğrulanmış veli yetkisi yeniden kontrol ediliyor.
- Danışan, veli, consent, finans ve operasyonel ayar değişiklikleri audit/hareket kaydı bırakıyor.
- Public booking SSR seviyesinde fail-closed davranıyor.
- Temel CSP, Permissions-Policy, Referrer-Policy, nosniff ve clickjacking başlıkları aktif.
- Yinelenen danışan sayfaları kaldırıldı; yalnızca uyumluluk yönlendirmeleri bırakıldı.

## Sıradaki güvenli çalışma sırası

1. Dokümantasyon ve bakım otomasyonunu güncel tut.
2. Public yazma endpoint’leri için kalıcı/dağıtık rate limit ve bot koruması seç.
3. Mükerrer danışan/talep inceleme akışını tamamla.
4. E-posta/Calendar outbox provider worker, retry/backoff ve alıcı matrisini devreye al.
5. Backup restore, MFA ve canlı rol matrisi tatbikatlarını tamamla.
6. KVKK, saklama süresi ve veri aktarımı metinlerini uzman kontrolünden geçir.
7. Yalnızca tüm yayın kapıları doğrulandıktan sonra public booking flag’lerini kontrollü aç.

## Açık kararlar ve engeller

- Rate-limit/bot koruma sağlayıcısı ve anahtar stratejisi seçilmedi.
- Mükerrer talep eşleştirme kuralları ürün ve gizlilik açısından onaylanmadı.
- E-posta/Calendar sağlayıcısı, şablonlar, alıcı matrisi ve worker hosting seçilmedi.
- Backup restore kanıtı, Google MFA ve canlı rol/yetki tatbikatı tamamlanmadı.
- Nihai aydınlatma/açık rıza metinleri ve veli yetkisi prosedürü hukukçu onayı bekliyor.
- Public booking feature flag’leri bu maddeler tamamlanmadan açılmayacak.

## Çalışma kuralı

- `main` dalına doğrudan commit atılmaz.
- Birbiriyle ilişkili değişiklikler tek branch, tek review edilebilir PR ve mümkün olan en az Preview/Production deploy ile teslim edilir.
- Her teslimde Prisma validate, lint, typecheck, unit, format, build ve gerekiyorsa PostgreSQL integration kapıları doğrulanır.
- CI sonucunu veya doküman durumunu kaydetmek için ayrı deploy üreten commit atılmaz.
