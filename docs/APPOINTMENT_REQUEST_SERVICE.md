# Hold’dan Randevu Talebi Üretme Servisi

Durum: Uygulandı ve gerçek PostgreSQL üzerinde doğrulandı — public API varsayılan kapalı

## Amaç

Aktif ve kullanıcı token’ıyla doğrulanmış bir appointment hold’u, ADR-017 consent/veli kapılarını uygulayarak tek transaction içinde `REQUESTED` randevuya dönüştürmek.

Public API sınırı uygulanmıştır; `PUBLIC_APPOINTMENT_REQUESTS_ENABLED` varsayılan olarak `false`
olduğu için servis ve veritabanı çağrısı fail-closed engellenir. Public form henüz uygulanmamıştır.

## Public API sınırı

`POST /api/public/appointments/requests` yalnızca sunucu bayrağı açıkken çalışır ve şu kapıları
uygular:

- `Origin`, `APP_URL` ile aynı origin olmalıdır; header yoksa istek reddedilir.
- Yalnızca `application/json` kabul edilir; gövde en fazla 16 KiB olabilir.
- Strict Zod şeması tanımsız alanları reddeder; klinik öykü gibi kapsam dışı veri sessizce alınmaz.
- Correlation ID güvenli header değerinden alınır veya sunucuda üretilir; istemci gövdesinden alınmaz.
- Zorunlu explicit-consent belge türleri yalnızca
  `BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES` sunucu ayarından gelir.
- Yanıtlar `Cache-Control: no-store` taşır; hata gövdeleri ham token, danışan kimliği veya form
  içeriğini geri yansıtmaz.

Bayrağın açılması tek başına canlıya çıkış onayı değildir. Nihai hukuk metinleri, operasyonel
veli prosedürü ve dağıtık rate-limit/abuse kontrolü tamamlanmadan production ortamında `false`
kalır.

## Güvenilir girdiler

Public sınırdan doğrulanan:

- Hold ID ve ham tek kullanımlık holder token
- Client ID
- Çocuksa guardian ID
- Kullanıcının sunduğu consent/acknowledgement record ID listesi
- Sağlık ayrıntısı istemeyen, en fazla 500 karakterlik opsiyonel request note
- Güvenli correlation ID

Yalnızca sunucu yapılandırmasından gelen:

- Zorunlu `PRIVACY_NOTICE` ve `BOOKING_TERMS`
- Onaylı veri envanterine göre gerekiyorsa ayrı explicit-consent belge türleri

Public istemci zorunlu belge listesini azaltamaz veya değiştiremez.

## Transaction sırası

1. Holder token SHA-256 ile hash’lenir; ham token loglanmaz veya veritabanına yazılmaz.
2. Hold `ACTIVE`, süresi dolmamış ve token hash’i eşleşmiş koşuluyla okunur.
3. Client, çocuk/veli ilişkisi ve sunulan consent kayıtları minimum alanlarla yüklenir.
4. ADR-017 `REQUEST` kapısı uygulanır: belge subject’i client, çocukta grantor aynı guardian olmalıdır. Public talepte `authority_verified_at` henüz zorunlu değildir.
5. Hold durumu koşullu update ile `CONSUMED` yapılır; yarışta kaybeden işlem güvenli conflict alır.
6. Randevu; hold zamanları ve buffer aralığı, hizmet/konum/politika snapshot’ı ve `REQUESTED` durumuyla oluşturulur.
7. Aktif `booking_allocation`, hold sahibinden appointment sahibine taşınır; aynı zaman aralığı korunur.
8. Kullanılan consent kayıtları `appointment_consents` join tablosuyla randevuya bağlanır.
9. Hold status log, appointment status log ve minimum audit kayıtları aynı transaction’da yazılır.

Herhangi bir adım başarısızsa hold tüketimi, randevu, allocation devri ve kanıt bağlantıları birlikte rollback olur.

## Uygulanan additive veri modeli

### appointment_consents

- appointment_id
- consent_id
- created_at

Kurallar:

- Composite primary key: `(appointment_id, consent_id)`
- Her iki foreign key `ON DELETE RESTRICT`
- Randevu başına aynı consent kaydı yalnızca bir kez bağlanabilir
- Join kaydı düzenlenmez veya hard delete edilmez; yanlış ilişki yeni düzeltme/audit akışı gerektirir

Bu tablo consent metnini veya form payload’ını kopyalamaz; yalnızca immutable kayıt kimliğine bağlanır.

## Snapshot kuralları

- Başlangıç/bitiş ve busy aralığı hold’dan aynen alınır.
- Duration ve buffer snapshot değerleri hold zaman aralıklarından hesaplanır; sonradan değişen hizmet varsayımları hold’u sessizce değiştirmez.
- Hizmet adı ve konum request anında snapshot’lanır.
- Yürürlükteki service policy minimum alanlarla snapshot’lanır.
- Consent belge version/hash bilgisi consent kaydının bağlı olduğu immutable document üzerinden izlenir.

## Güvenli hatalar

- Geçersiz/süresi dolmuş/tüketilmiş token: tek genel `HOLD_UNAVAILABLE`
- Consent/veli kapısı: güvenli yapılandırılmış issue code, belge metni veya kişisel veri yok
- Allocation/hold yarışı: `BOOKING_REQUEST_CONFLICT`
- Kaynak devre dışı: `BOOKING_RESOURCE_UNAVAILABLE`

Bir kaydın var olup olmadığı yetkisiz istemciye ayrıntılı açıklanmaz.

API eşlemesi:

- Kapalı özellik: `404 BOOKING_REQUESTS_DISABLED`
- Güvenilmeyen origin: `403 UNTRUSTED_ORIGIN`
- Geçersiz içerik/gövde: `400`, `413` veya `415`
- Consent/veli kapısı: `422 BOOKING_CONSENT_GATE_FAILED`
- Hold/kaynak/yarış çakışması: güvenli kodla `409`

## Test kapıları

- Geçersiz token veritabanı yazması üretmez
- Süresi dolmuş veya tüketilmiş hold reddedilir
- Yetişkin/çocuk ve guardian grantor kuralları
- Eksik/withdrawn/expired belge reddi
- Configured explicit-consent eksikliği
- Hold, appointment, allocation, consent join, status log ve audit atomikliği
- Aynı hold’u iki eşzamanlı tüketme denemesinde yalnızca bir randevu
- Transaction rollback’inde hold ve allocation’ın aktif kalması
- Audit/log içinde ham token, iletişim veya sağlık notu bulunmaması

## Güncel doğrulama

- Altı migration gerçek PostgreSQL 17 üzerinde uygulanır.
- Atomik hold tüketimi, appointment/allocation/consent link/status/audit yazımı geçer.
- Aynı hold’u iki eşzamanlı tüketmede yalnızca bir `REQUESTED` randevu oluşur.
- Appointment create hatasında hold ve allocation aktif kalır.
- Yetişkin ve declared guardian kullanan çocuk talebi gerçek veritabanında geçer.
- Eksik consent fail-closed davranır; ham token ve danışan adı audit özetine girmez.
- Başka danışana ait veya aynı belge türünü çoğaltan consent kanıtı fail-closed reddedilir.
- Public route; kapalı özellik, origin, content type, boyut, strict alan doğrulaması, correlation ID,
  sunucu-owned consent policy ve güvenli hata eşlemeleriyle unit test edilir.
