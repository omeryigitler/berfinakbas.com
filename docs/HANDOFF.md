# Aktif Çalışma Devir Teslimi

Son güncelleme: 16 Temmuz 2026, Europe/Malta

## Aktif çalışma

- Ana dal: `main`
- Son production teslimi: PR #104 — public booking BotID Basic protection
- Son production commit: `25691ba02199c214d786adba5e1a9e737374dfb4`
- Aktif dal: `agent/duplicate-client-review`
- Aktif Draft PR: bu dal için tek review edilebilir PR
- Public randevu: operasyonel yayın kapıları tamamlanana kadar fail-closed

## Canlı durum

- Vercel production deploy başarılı.
- `/api/health` veritabanını doğrulayarak `200 / ok` dönüyor.
- Eski `/yonetim/danisanlar/yeni` yolu `/yonetim/danisan-olustur` sayfasına yönleniyor.
- Public `/randevu` sayfası erişilebilir; form feature flag ve yapılandırma kapıları kapalıyken kişisel veri kabul etmiyor.
- Son kalite turunda lint, typecheck, unit, format, build ve PostgreSQL integration işleri geçti.
- Public koruma için Vercel WAF Rate Limiting ve ücretsiz BotID Basic seçildi; ücretli BotID Deep Analysis açılmayacak.

## Tamamlanan son kapsam

- Production migration guard yalnızca Vercel production ortamında çalışıyor.
- CI format kontrolü bloklayıcıdır.
- Randevu durum geçişleri Serializable transaction ve sınırlı retry kullanıyor.
- WEB randevuları onaylanmadan önce güncel consent belgeleri ve çocuk danışanda doğrulanmış veli yetkisi yeniden kontrol ediliyor.
- Danışan, veli, consent, finans ve operasyonel ayar değişiklikleri audit/hareket kaydı bırakıyor.
- Public booking SSR seviyesinde fail-closed davranıyor.
- Temel CSP, Permissions-Policy, Referrer-Policy, nosniff ve clickjacking başlıkları aktif.
- Yinelenen danışan sayfaları kaldırıldı; yalnızca uyumluluk yönlendirmeleri bırakıldı.
- BotID Basic yalnızca public hold ve randevu talebi POST rotalarına bağlandı; salt okunur bootstrap/slot rotaları BotID çağrısı yapmıyor.
- Bot doğrulaması otomasyonu `403` ile reddediyor; doğrulama servisi kullanılamazsa yazma rotaları veritabanına ulaşmadan `503` ile fail-closed kalıyor.
- Mükerrer inceleme politikası konservatif seçildi: yalnızca normalize edilmiş kesin telefon/e-posta eşleşmeleri aday üretir ve otomatik birleştirme yapılmaz.

## Sıradaki güvenli çalışma sırası

1. Hobby planın tek rate-limit kuralını public randevu API’leri için Vercel Firewall panelinde önce Log, sonra Rate Limit olarak yayınla; bu işlem bağlı panel/API yetkisi gerektiriyor ve kod deploy’u üretmiyor.
2. Aktif mükerrer danışan inceleme PR’ını Preview üzerinde doğrula ve tek production merge/deploy ile teslim et.
3. E-posta/Calendar outbox provider worker, retry/backoff ve alıcı matrisini devreye al.
4. Backup restore, MFA ve canlı rol matrisi tatbikatlarını tamamla.
5. KVKK, saklama süresi ve veri aktarımı metinlerini uzman kontrolünden geçir.
6. Yalnızca tüm yayın kapıları doğrulandıktan sonra public booking flag’lerini kontrollü aç.

## Açık kararlar ve engeller

- Ücretli BotID Deep Analysis etkinleştirilmeyecek; Basic seviye dışında ücretli bot analizi kullanıcı onayı olmadan açılmayacak.
- Vercel Firewall paneline bağlı yönetim yetkisi bu çalışma oturumunda bulunmuyor; rate-limit kuralı panelde henüz yayınlanmadı.
- E-posta/Calendar sağlayıcısı, şablonlar, alıcı matrisi ve worker hosting seçilmedi.
- Backup restore kanıtı, Google MFA ve canlı rol/yetki tatbikatı tamamlanmadı.
- Nihai aydınlatma/açık rıza metinleri ve veli yetkisi prosedürü hukukçu onayı bekliyor.
- Public booking feature flag’leri bu maddeler tamamlanmadan açılmayacak.

## Aktif BotID doğrulaması

- Paket: `botid@^1.5.11`
- Kapsam: `POST /api/public/appointments/holds` ve `POST /api/public/appointments/requests`
- Hedefli doğrulama: 3 dosyada 26 unit test başarılı.
- TypeScript kontrolü ve değişen dosyaların format kontrolü başarılı.
- Migration, yeni secret veya kişisel veri alanı yoktur.

## Aktif mükerrer kayıt doğrulaması

- Yetişkin adayları normalize edilmiş kesin telefon veya e-posta eşleşmesiyle bulunur.
- Çocuk adaylarında ad ve soyad eşleşmesine ek olarak normalize edilmiş kesin veli telefonu veya e-postası gerekir.
- Yönetici talebi önce incelemeye alır; eşleşme varsa “yeni kayıt olarak tut” veya “mevcut danışana bağla” kararını açıkça verir.
- Mükerrer inceleme çözülmeden WEB randevusu onaylanamaz; sunucu tarafı da bu kapıyı zorunlu tutar.
- Bağlama kararı randevuyu ve consent kanıtını mevcut danışana taşır, kaynak prospective kaydı pasife alır ve iki audit kaydı bırakır.
- Migration mevcut iletişim verisini geriye dönük normalize eder; yeni secret veya dış sağlayıcı eklenmez.
- Hedefli doğrulama: 9 dosyada 63 test, TypeScript, ESLint ve format kontrolleri başarılı.
- Migration SQL’i PostgreSQL uyumlu motor üzerinde trigger, backfill ve varsayılan durumla birlikte çalıştırıldı.

## Çalışma kuralı

- `main` dalına doğrudan commit atılmaz.
- Birbiriyle ilişkili değişiklikler tek branch, tek review edilebilir PR ve mümkün olan en az Preview/Production deploy ile teslim edilir.
- Her teslimde Prisma validate, lint, typecheck, unit, format, build ve gerekiyorsa PostgreSQL integration kapıları doğrulanır.
- CI sonucunu veya doküman durumunu kaydetmek için ayrı deploy üreten commit atılmaz.
