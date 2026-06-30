# Public Appointment Hold API

Durum: Uygulandı — sunucu bayrağıyla varsayılan kapalı, public form yok

## Amaç

Kullanıcının seçtiği yapılandırılmış slotu, danışan veya sağlık verisi toplamadan kısa süreli ve atomik olarak ayırmak. Endpoint yalnızca mevcut availability ve booking-policy kapılarından geçen transaction-safe hold servisini çağırır.

## Endpoint

`POST /api/public/appointments/holds`

Özellik yalnızca `PUBLIC_APPOINTMENT_HOLDS_ENABLED=true` olduğunda istek kabul eder. Varsayılan `false` değerinde gövde okunmaz, hold servisi veya veritabanı çağrılmaz ve `404 BOOKING_HOLDS_DISABLED` döner.

## İstek sözleşmesi

Yalnızca şu strict JSON alanları kabul edilir:

- `practitionerId`: UUID
- `serviceId`: UUID
- `startsAt`: UTC offset içeren ISO tarih-saat

İstemci şunları belirleyemez:

- Hold süresi
- Correlation ID gövde değeri
- Bitiş veya buffer aralığı
- Günlük kapasite ya da availability kuralı
- Danışan, iletişim, klinik not veya serbest ek alan

Hold süresi yalnızca doğrulanmış `BOOKING_HOLD_DURATION_MINUTES` sunucu ayarından gelir. Ayar tanımsızsa servis veritabanına erişmeden fail-closed durur.

## Güvenlik sınırı

- `Origin`, `APP_URL` ile aynı origin olmalıdır.
- Yalnızca `application/json` kabul edilir.
- Gövde en fazla 4 KiB olabilir.
- Strict Zod şeması bilinmeyen alanları reddeder.
- Güvenli header correlation ID kullanılır; güvensiz veya eksik değer sunucuda yenilenir.
- Tüm yanıtlar `Cache-Control: no-store` ve güvenli correlation ID taşır.
- Hata yanıtları girdi değerlerini, token’ı veya iç veritabanı ayrıntılarını yansıtmaz.

## Başarılı yanıt

`201` yanıtı şunları döner:

- `holdId`
- Tek kullanımlık ham `holderToken`
- `startsAt`
- `endsAt`
- `expiresAt`

Ham token veritabanında saklanmaz; yalnızca SHA-256 özeti tutulur. İlerideki istemci akışı token’ı URL, analytics, log veya kalıcı tarayıcı depolamasına yazmadan randevu talebi adımına taşımalıdır.

## Güvenli hatalar

- Kapalı özellik: `404 BOOKING_HOLDS_DISABLED`
- Güvenilmeyen origin: `403 UNTRUSTED_ORIGIN`
- Geçersiz content type: `415 UNSUPPORTED_MEDIA_TYPE`
- Büyük gövde: `413 BODY_TOO_LARGE`
- Geçersiz JSON/alanlar: `400 INVALID_JSON` veya `INVALID_REQUEST`
- Slot/kaynak çakışması: `409 SLOT_CONFLICT` veya `BOOKING_RESOURCE_UNAVAILABLE`

## Yayın kapıları

Endpoint’in kodda bulunması production açılış onayı değildir. Şunlar tamamlanmadan `PUBLIC_APPOINTMENT_HOLDS_ENABLED` production ortamında `false` kalır:

- Onaylı production hold süresi
- Dağıtık rate-limit/abuse kontrolü
- Public slot okuma ve form akışının uçtan uca güvenlik testi
- Nihai hukuki metinler ve operasyonel veli prosedürü

## Doğrulama

- Kapalı bayrakta servis çağrısı yapılmaması
- Same-origin, content type, gövde boyutu ve strict şema
- ISO zamanın `Date` girdisine kontrollü dönüşümü
- Güvenli correlation ID
- `no-store` token yanıtı
- Slot ve kaynak hatalarının kişisel veri içermeyen güvenli eşlemesi
