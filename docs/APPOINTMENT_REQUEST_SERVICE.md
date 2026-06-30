# Hold’dan Randevu Talebi Üretme Servisi

Durum: Uygulama sözleşmesi — kodlama için hazır

## Amaç

Aktif ve kullanıcı token’ıyla doğrulanmış bir appointment hold’u, ADR-017 consent/veli kapılarını uygulayarak tek transaction içinde `REQUESTED` randevuya dönüştürmek.

Public API ve form bu servis tamamlanıp test edilmeden açılmaz.

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

## Gerekli additive veri modeli

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
