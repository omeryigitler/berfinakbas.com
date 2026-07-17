# Aktif Çalışma Devir Teslimi

Son güncelleme: 17 Temmuz 2026, Europe/Malta

## Aktif çalışma

- Ana dal: `main`
- Son production teslimi: PR #106 — ana sayfa cilası + Yönetim Hub
- Son production commit: `e1d2674659a0d8efc6c7e16fa08bf710d992ed65`
- Aktif dal: `design/unified-admin-panel`
- Aktif Draft PR: #107 — Hub tabanlı tek yönetim paneline tam geçiş
- Public randevu: operasyonel yayın kapıları tamamlanana kadar fail-closed

## Bağlayıcı kullanıcı kararı

- Amaç yalnızca eski sayfaları Hub renklerine boyamak değildir.
- Bütün yönetim işlemleri gerçek Hub kabuğunda çalışacaktır.
- Sol navigasyon akordeon gruplar halinde açılacaktır.
- Her ana çalışma ekranında “Tam sayfa çalış / Panelleri geri aç” modu bulunacaktır.
- Danışan, randevu, müsaitlik, finans, site ayarları ve sağlık ekranları yeni kabuğa eksiksiz taşınmadan eski tasarım silinmeyecektir.
- Fonksiyon eşitliği tamamlandıktan sonra klasik panel, eski sidebar/topbar ve eski polish/override CSS dosyaları kaldırılacaktır.

Ayrıntılı rota, aşama, kabul ve silme kontrol listesi `docs/ADMIN_REDESIGN_PLAN.md` içindedir.

## Kullanıcının gördüğü kırmızı deploy

- Hatalı satır production değildir.
- Commit `9676b2984a96afe163edbafc9961bf93f7f755b5`, Dependabot’un ayrı development-dependencies preview’udur.
- TypeScript `6.0.3 → 7.0.2` ve ESLint `9.39.4 → 10.7.0` gibi major güncellemeleri aynı pakette yükselttiği için dependency kurulumu başarısız olmuştur.
- `main` production satırı PR #106 commitinde Ready durumundadır.
- Dependabot değişiklikleri tasarım PR’ına alınmayacaktır.

## Mevcut durum

- `/yonetim/hub` gerçek randevu, danışan, müsaitlik ve finans özetleriyle çalışıyor.
- Hub içinde akordeon rail ve kayıt görünümünde genişletme modu bulunuyor.
- Klasik `AdminShell` kullanan tam işlem sayfaları yalnızca görsel token seviyesinde Hub’a yaklaştırılmış durumda; bu yeterli kabul edilmiyor.
- Danışan, randevu, müsaitlik, ödeme ve ayarların ağır işlem yüzeyleri ortak Hub kabuğuna henüz tamamen taşınmadı.
- PR #107 merge edilmeyecek; tam migrasyon ve eski tasarım temizliği bitene kadar Draft kalacak.

## Uygulama sırası

1. Ortak `AdminHubShell`: akordeon navigasyon, izinli menü, üst eylem şeridi, URL destekli tam sayfa çalışma modu.
2. Danışan liste/oluşturma/profil/veli/consent/randevu/finans akışlarının taşınması.
3. Randevu talep/list/takvim/durum işlemleri ve müsaitlik düzenlemesinin taşınması.
4. Ödeme-plan-taksit-seans hakkı-ledger işlemlerinin taşınması.
5. Hizmet, terapist, süre, buffer, public iletişim ve sistem sağlığı ekranlarının taşınması.
6. Fonksiyon eşitliği testi.
7. Eski `AdminShell`, eski Hub/klasik geçiş bağlantıları ve eski CSS override dosyalarının kaldırılması.
8. Final CI, PostgreSQL, Preview ve manuel rota smoke turu.
9. Kullanıcı onayından sonra tek squash merge ve production deploy.

## Deploy disiplini

- Yalnızca `design/unified-admin-panel` ve Draft PR #107 kullanılacaktır.
- Bu noktadan itibaren kod değişiklikleri üç toplu push hedefiyle gruplanır: ortak kabuk, tüm ekran migrasyonu, eski tasarım temizliği/final düzeltme.
- Doküman veya CI sonucu için ayrı mikro commit yapılmaz.
- Production’a yalnızca bir kez çıkılır.

## Açık ürün/yayın konuları

- Vercel Firewall rate-limit kuralı henüz yayınlanmadı.
- E-posta/Calendar sağlayıcısı, şablonlar, alıcı matrisi ve worker hosting seçilmedi.
- Backup restore kanıtı, Google MFA ve canlı rol/yetki tatbikatı tamamlanmadı.
- Nihai aydınlatma/açık rıza metinleri ve veli yetkisi prosedürü hukukçu onayı bekliyor.

## Veri ve güvenlik sınırı

- Migration veya iş kuralı değişikliği yalnızca ekran migrasyonu için uydurulmaz.
- Randevu durum makinesi, consent kapıları, append-only finans ledger’ı ve yetki kontrolleri korunur.
- Klinik not/sağlık öyküsü alanı eklenmez.
- Gerçek danışan/veli fotoğrafı gösterilmez.
- Liste ekranlarında minimum veri ilkesi korunur.
