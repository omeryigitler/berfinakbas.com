# Aktif Çalışma Devir Teslimi

Son güncelleme: 17 Temmuz 2026, Europe/Malta

## Aktif çalışma

- Ana dal: `main`
- Son production teslimi: PR #106 — ana sayfa cilası + Yönetim Hub
- Son production commit: `e1d2674659a0d8efc6c7e16fa08bf710d992ed65`
- Aktif dal: `design/unified-admin-panel`
- Aktif Draft PR: #107 — Yönetim panelini tek yeni tasarım sisteminde birleştir
- Public randevu: operasyonel yayın kapıları tamamlanana kadar fail-closed

## Kullanıcının gördüğü kırmızı deploy

- Hatalı satır production değildir.
- Commit `9676b2984a96afe163edbafc9961bf93f7f755b5`, Dependabot’un ayrı development-dependencies preview’udur.
- Bu deneme TypeScript `6.0.3 → 7.0.2` ve ESLint `9.39.4 → 10.7.0` gibi major güncellemeleri aynı pakette yükselttiği için Vercel Preview başarısız olmuştur.
- `main` production satırı PR #106 commitinde Ready durumundadır.
- Dependabot değişiklikleri bu tasarım PR’ına alınmayacak; major sürümler ayrı uyumluluk turunda ele alınmalıdır.

## Canlı durum

- Vercel production deploy başarılı.
- `/api/health` veritabanını doğrulayarak `200 / ok` dönüyor.
- `/yonetim/hub` gerçek randevu, danışan, müsaitlik ve finans özetleriyle çalışıyor.
- Public `/randevu` sayfası erişilebilir; form feature flag ve yayın kapıları kapalıyken kişisel veri kabul etmiyor.
- BotID Basic public hold ve request POST rotalarında aktif; Deep Analysis kapalıdır.
- Mükerrer danışan inceleme akışı admin kararı olmadan otomatik birleştirme yapmaz.

## PR #107 kapsamında tamamlananlar

- Ortak admin menüsü “Çalışma alanı / Kayıt merkezi / Danışanlar / Randevular / Müsaitlik / Ödeme ve planlar / Sistem sağlığı” olarak düzenlendi.
- Klasik admin sayfalarının sidebar, topbar, arama, profil, başlık, kart, liste, form ve responsive görünümü Hub’ın tasarım tokenlarıyla birleştirildi.
- Sıcak gri zemin, krem panel, lime seçili durum, teal ana işlem ve şeftali başlık sistemi tüm yönetim yüzeylerine taşındı.
- Public siteye dönüş bağlantısı ve kayıt merkezine hızlı geçiş ortak kabuğa eklendi.
- `AGENTS.md` tek-panel kararı, route matrisi, bileşen standardı, veri/gizlilik ve sahte metrik yasağıyla güncellendi.
- `docs/ADMIN_REDESIGN_PLAN.md` aktif tasarım ve regresyon planı olarak tamamlandı.
- Veri modeli, migration, API, finans ledger’ı, consent ve randevu durum makinesi değiştirilmedi.

## Doğrulama durumu

- Draft PR: #107
- Vercel Preview: son commit için sonuç bekleniyor.
- GitHub Quality: son commit için sonuç bekleniyor.
- Randevu çekirdeğine dokunulmadığı için yeni migration/eşzamanlılık kapsamı eklenmedi.
- Yetkili hesapla manuel rota smoke turu henüz tamamlanmadı.

## Sıradaki güvenli çalışma sırası

1. PR #107 son head için GitHub Quality ve Vercel Preview sonucunu kontrol et.
2. Yetkili hesapla `/yonetim`, `/yonetim/hub`, danışan, profil, randevu, müsaitlik, ödeme ve sağlık rotalarını tek turda dolaş.
3. Masaüstü/tablet/mobil taşma, sticky topbar, URL modalları, custom dropdown/takvim, odak ve uzun metin regresyonlarını kaydet.
4. Yalnızca gerçek regresyon varsa aynı PR’da tek düzeltme turu yap; kozmetik mikro commit/deploy üretme.
5. `pnpm quality` ve `pnpm build` yeşil olduğunda PR’ı review’a hazırla.
6. Kullanıcı onayından sonra tek squash merge ve tek production deploy yap.
7. Tasarım tesliminden sonra Vercel Firewall rate-limit kuralı, provider worker, backup/MFA ve hukuk yayın kapılarına dön.

## Açık kararlar ve engeller

- Gerçek çoklu-entity global arama API’si henüz yoktur; üst arama yalnızca danışan adı/telefon/e-postaya gider.
- Hub listesi son kayıtlarla sınırlıdır; server-side arama/sayfalama sonraki milestone’dur.
- “Kayıt tamlığı” puan ağırlıkları ürün kararı değildir; klinik veya öncelik skoru olarak sunulmamalıdır.
- Eski lokal polish/override CSS dosyalarının tamamen kaldırılması, preview regresyonu yaratmamak için ayrı teknik temizlik milestone’una bırakılmıştır.
- Vercel Firewall panelinde rate-limit kuralı henüz yayınlanmadı.
- E-posta/Calendar sağlayıcısı, şablonlar, alıcı matrisi ve worker hosting seçilmedi.
- Backup restore kanıtı, Google MFA ve canlı rol/yetki tatbikatı tamamlanmadı.
- Nihai aydınlatma/açık rıza metinleri ve veli yetkisi prosedürü hukukçu onayı bekliyor.

## Çalışma kuralı

- `main` dalına doğrudan commit atılmaz.
- Bu görev boyunca yalnızca `design/unified-admin-panel` ve Draft PR #107 kullanılır.
- Birbiriyle ilişkili değişiklikler tek review edilebilir PR ve mümkün olan en az Preview/Production deploy ile teslim edilir.
- CI sonucu veya doküman durumu için ayrı commit üretilmez; PR açıklaması güncellenir.
