# Public Randevu Talebi Akışı

Durum: PR #21 kapsamında uygulandı; production özelliği varsayılan kapalıdır.

## Kullanıcı akışı

`/randevu` sayfası tek bir kontrollü akış sunar:

1. Sunucunun açıkça public olarak yapılandırdığı uzman ve aktif hizmet seçilir.
2. Yerel tarih için güncel slot adayları alınır.
3. Seçilen saat sunucu ayarlı kısa süreli hold ile yeniden doğrulanır ve ayrılır.
4. Yetişkin için ad, soyad, telefon ve isteğe bağlı e-posta alınır. Çocuk için yalnızca ad/soyad; veli için ad, soyad, telefon, isteğe bağlı e-posta ve beyan edilen ilişki alınır.
5. Yürürlükteki `PRIVACY_NOTICE`, `BOOKING_TERMS` ve yapılandırılmış diğer gerekli belgeler ayrı ayrı gösterilir ve onaylanır.
6. Kimlik, veli ilişkisi, consent kanıtı, hold tüketimi, randevu, tahsis devri, durum geçmişi ve minimum audit kayıtları tek serializable transaction içinde yazılır.
7. Kullanıcıya iç UUID yerine tahmin edilmesi zor public talep numarası döner. Talep `REQUESTED` durumundadır; kesin randevu değildir.

## Veri minimizasyonu

- Klinik öykü, tanı, serbest sağlık notu, kimlik numarası, tam doğum tarihi ve belge yükleme alanı yoktur.
- Çocuk–veli yetkisi public aşamada yalnızca beyan edilir. `authority_verified_at` admin doğrulaması olmadan dolmaz ve randevu kesinleştirilemez.
- Ham holder token yalnızca React belleğinde tutulur; URL, localStorage, sessionStorage, audit veya veritabanına ham biçimde yazılmaz.
- Hata yanıtları ad, iletişim bilgisi, belge içeriği veya token yansıtmaz.
- Audit özetleri kayıt türü/durumu ve değişmez kimliklerle sınırlıdır; ad ve iletişim bilgileri kopyalanmaz.

## Consent yayın modeli

`consent_documents` tablosunda `public_title` ve `public_content` nullable sunum alanları bulunur. İkisi birlikte ve boş olmayan değerlerle yayınlanmalıdır. Mevcut kayıtları bozmayan additive migration ile eklenmiştir.

Public bootstrap, capture anında her zorunlu belge türü için tek yürürlükte sürüm, public başlık/içerik ve değişmez version/content hash bulamazsa fail-closed durur. Aynı türde birden fazla yürürlükte sürüm de yapılandırma hatasıdır. Uygulama hukuki metin uydurmaz; production açılışı için onaylı içerik veritabanına ayrıca yüklenmelidir. Metin React tarafından düz metin olarak render edilir; ham HTML çalıştırılmaz.

## API sınırları

- `GET /api/public/appointments/bootstrap`: public uzman, hizmetler ve yürürlükteki belge sunumlarını döner.
- `GET /api/public/appointments/slots`: seçilen hizmet ve gün için aday UTC saatleri döner.
- `POST /api/public/appointments/holds`: saati transaction içinde yeniden doğrular ve süreli hold üretir.
- `POST /api/public/appointments/requests`: minimum intake ile consent kanıtını üretir ve hold’u atomik olarak `REQUESTED` randevuya çevirir.

POST endpoint’leri same-origin ve strict/sınırlı JSON uygular. Bütün yanıtlar `Cache-Control: no-store` taşır. Bootstrap tarafından açıklanmayan bir practitioner ID’si slot, hold veya request akışında kabul edilmez.

## Yapılandırma ve yayın kapıları

Akış ancak aşağıdaki ayarların tamamı geçerliyse açılır:

- `PUBLIC_BOOKING_FLOW_ENABLED=true`
- `PUBLIC_APPOINTMENT_SLOTS_ENABLED=true`
- `PUBLIC_APPOINTMENT_HOLDS_ENABLED=true`
- `PUBLIC_APPOINTMENT_REQUESTS_ENABLED=true`
- `BOOKING_PUBLIC_PRACTITIONER_ID=<aktif practitioner UUID>`
- `BOOKING_HOLD_DURATION_MINUTES=<onaylı tam sayı>`
- yürürlükte ve onaylı public içeriği bulunan zorunlu consent belgeleri

Production’da ayrıca nihai hukuki metinler, veli doğrulama prosedürü ve dağıtık rate-limit/abuse kontrolü onaylanmadan bu bayraklar açılmaz.

## Atomiklik kanıtı

PostgreSQL integration paketi yetişkin ve çocuk/veli intake’ını gerçek transaction ile doğrular. Appointment oluşturma son adımında kasıtlı hata üretildiğinde client, guardian, client-guardian, consent ve audit kayıtlarının hiçbirinin kalmadığı; hold ve allocation’ın aktif kaldığı ayrıca test edilir.
