# PostgreSQL Integration Testleri

Bu paket, randevu tahsislerinin gerçek PostgreSQL exclusion constraint davranışını doğrular. PGlite, SQLite veya mock veritabanı bu testlerin yerine geçmez.

## Yerel kurulum

1. PostgreSQL 17 veya uyumlu gerçek PostgreSQL servisini başlat.
2. Yalnızca sentetik test verisi için ayrı bir veritabanı oluştur: `createdb berfinakbas_integration`
3. `.env.integration` dosyasına bağlantıyı yaz:

   ```dotenv
   TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/berfinakbas_integration?schema=public"
   ```

4. Migration ve integration paketini birlikte çalıştır: `pnpm test:integration`

Komut, migration’ları `prisma migrate deploy` ile uygular ve ardından yalnızca `*.integration.test.ts` dosyalarını çalıştırır. Normal `pnpm test`, veritabanı gerektirmeyen hızlı test paketidir.

## Güvenlik korkulukları

- Veritabanı adı `test` veya `integration` içermiyorsa komut çalışmaz.
- Uzak veritabanı varsayılan olarak reddedilir.
- Uzak, izole bir CI veritabanı bilinçli kullanılacaksa `ALLOW_REMOTE_INTEGRATION_DATABASE=true` ayrıca tanımlanmalıdır.
- Test fixture’ları tamamen sentetiktir; üretim dump’ı kullanılmaz.

## Zorunlu senaryolar

- Aynı uzmanda hold–hold çakışması
- Gerçek `createAppointmentHold` servisiyle iki eşzamanlı isteğin bir güvenli slot conflict üretmesi
- Aynı uzmanda hold–randevu çakışması
- Aynı uzmanda randevu–randevu çakışması
- Farklı uzmanlarda aynı saat aralığının birbirini engellememesi
- `btree_gist` ve `booking_allocations_no_active_overlap` constraint varlığı

## Doğrulanan yerel durum

29 Haziran 2026 tarihinde PostgreSQL 17.10 üzerinde dört migration başarıyla uygulandı ve altı integration testi geçti. Test sonrasında sentetik kullanıcı, hizmet, hold, randevu, audit ve allocation kayıtlarının temizlendiği doğrulandı.

Bu sonuç yerel gerçek PostgreSQL kapısını karşılar. Canlıya çıkıştan önce seçilecek yönetilen PostgreSQL sürümü/bölgesi üzerinde aynı komutun CI ortamında yeniden çalıştırılması gerekir.
