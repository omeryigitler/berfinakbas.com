# Aktif Çalışma Devir Teslimi

Son güncelleme: 17 Temmuz 2026 · Europe/Malta

## Aktif çalışma

- Ana dal: `main`
- Son production commit: `e1d2674659a0d8efc6c7e16fa08bf710d992ed65`
- Aktif dal: `design/unified-admin-panel`
- Aktif Draft PR: #107
- Production’a henüz merge veya deploy yapılmadı.

## Bağlayıcı ürün kararı

- `/yonetim` altında yalnızca tek Hub yönetim deneyimi vardır.
- Sol navigasyon izin bazlı akordeondur.
- Liste ekranları liste → kayıt → çalışma alanı biçiminde ilerler.
- Ana ekranlarda `Tam sayfa çalış / Panelleri geri aç`, `F` kısayolu ve URL state kullanılır.
- Eski panel, ikinci sidebar veya ayrı Hub görünümü yoktur.
- Kullanıcı Preview alanını görüntüleyemediği için final görsel onay yalnızca Production üzerinde yapılır.

## Tamamlanan kapsam

- Bütün yönetim rotaları ortak Hub kabuğunu kullanıyor.
- Eski standalone Hub, ikinci rail, klasik panel bağlantısı ve A/B/C hazırlık skoru kaldırıldı.
- Eski mercan/serif tema kaynağı Hub tokenlarıyla değiştirildi.
- URL modal, dropdown ve takvim klavye/odak yönetimini destekliyor.
- Uzun dropdown listeleri aranabilir.
- Danışan listesi sunucu taraflı filtre ve 50 kayıtlık sayfalama kullanıyor.
- Kayıt Merkezi sunucu taraflı arama ve 30 kayıtlık sayfalama kullanıyor.
- Talep kuyruğu yalnızca açık statüleri gösteriyor.
- En yakın gelecek randevu artan tarih ve `take: 1` ile seçiliyor.
- Kayıt grubu son durum hareketine göre hesaplanıyor.
- Randevu oluşturma seçili terapistin IANA saat dilimini kullanıyor; geçersiz DST saatleri reddediliyor.
- Dashboard gün/hafta/ay sınırlarını işletme saat diliminde hesaplıyor.
- Müsaitlik formu inline hata/başarı sonucu gösteriyor ve geçersiz saat aralığını engelliyor.
- Danışan oluşturma idempotent ve audit kayıtlıdır.
- Finans toplamları para birimine göre ayrıdır; TRY ve EUR birbirine eklenmez.
- Danışan profilinde yetki yok ile kayıt yok ayrıdır.
- Yönetim/ödeme notları profil operasyon akışında görünür.
- Kullanıcı yüzeyindeki teknik/İngilizce admin etiketleri temizlendi.

## Otomatik doğrulama

Final Quality #452 tamamen yeşildir:

- Prisma validation
- ESLint
- TypeScript
- Test paketi
- Production build
- Production smoke
- PostgreSQL integration

Bir Vercel Preview başarıyla tamamlandı. Sonraki denemeler platform `build-rate-limit` sınırına takıldı; uygulama build hatası yoktur.

Migration, yeni secret veya yeni kişisel veri alanı eklenmedi.

## Kalan yayın kapısı

1. Kullanıcı tek Production yayınına açık onay vermeli.
2. Tek squash merge ve tek Production deploy yapılmalı.
3. Kullanıcı Production üzerinde masaüstü, tablet ve mobil turu yapmalı.
4. Regresyon bulunursa tek toplu hotfix hazırlanmalı.

## Güvenlik sınırı

- Randevu durum makinesi, consent kontrolleri, rol/yetki sistemi ve append-only finans ledger korunur.
- Klinik not veya sağlık öyküsü alanı eklenmedi.
- Gerçek danışan/veli fotoğrafı kullanılmaz; monogram avatar gösterilir.
- `main` dalına doğrudan commit atılmaz.
- Kullanıcı onayı olmadan merge veya Production deploy yapılmaz.
