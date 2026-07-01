# Public Appointment Slots API

Durum: Uygulandı — sunucu bayrağıyla varsayılan kapalı, public form yok

## Amaç

Kullanıcıya seçilebilir aday zamanları kişisel veri toplamadan göstermek. Slot listesi rezervasyon değildir; gerçek uygunluk ve çakışma kararı hold transaction’ında yeniden verilir.

## Endpoint

`GET /api/public/appointments/slots`

Query alanları:

- `practitionerId`: UUID
- `serviceId`: UUID
- `localDate`: Uzmanın saat diliminde `YYYY-MM-DD`

Özellik yalnızca `PUBLIC_APPOINTMENT_SLOTS_ENABLED=true` olduğunda çalışır. Varsayılan `false` değerinde sorgu doğrulanmaz, servis/veritabanı çağrılmaz ve `404 BOOKING_SLOTS_DISABLED` döner.

## Slot üretimi

Servis şu kaynakları birlikte uygular:

- Aktif ve public hizmet ile yürürlükteki hizmet politikası
- Aktif uzman ve IANA saat dilimi
- Yerel gün için yürürlükteki haftalık availability kuralları
- Kapalı gün, custom-hours veya blocked istisnaları
- Hizmet süresi ve önce/sonra buffer
- Minimum bildirim ve maksimum ileri rezervasyon
- Günlük kapasite
- Süresi dolmamış aktif hold ve aktif randevu tahsisleri

Farklı aktif slot artışları veya çelişen istisna tiplerinde servis otomatik öncelik uydurmaz; güvenli kaynak-yapılandırma hatasıyla fail-closed durur.

## Yanıt sözleşmesi

`200` yanıtı yalnızca aşağıdaki alanları içeren sıralı aday listesi döner:

- `startsAt`: UTC ISO tarih-saat
- `endsAt`: UTC ISO tarih-saat

Yanıtta şu bilgiler bulunmaz:

- Availability rule aralıkları veya slot increment
- Exception reason code veya private note
- Buffer aralıkları
- Günlük kapasite sayıları
- Danışan, veli, iletişim veya sağlık verisi

Tüm yanıtlar `Cache-Control: no-store` ve güvenli correlation ID taşır.

## Yarış ve doğruluk sınırı

Slot okuma ile hold oluşturma arasında başka bir kullanıcı aynı saati ayırabilir veya admin çalışma kuralını değiştirebilir. Bu nedenle istemci slot yanıtını kesin rezervasyon olarak sunmaz. `POST /api/public/appointments/holds` aynı günü transaction içinde yeniden hesaplar; uygunluk kaybolmuşsa güvenli conflict döner. PostgreSQL aktif aralık exclusion constraint’i son bütünlük kapısıdır.

## Güvenli hatalar

- Kapalı özellik: `404 BOOKING_SLOTS_DISABLED`
- Eksik, duplicate, bilinmeyen veya geçersiz query: `400 INVALID_REQUEST`
- Devre dışı hizmet/uzman veya belirsiz yapılandırma: `409 BOOKING_RESOURCE_UNAVAILABLE`

## Yayın kapıları

Endpoint’in kodda bulunması production açılış onayı değildir. Şunlar tamamlanmadan slot ve hold bayrakları production ortamında `false` kalır:

- Dağıtık rate-limit/abuse kontrolü
- Onaylı production hold süresi
- Client/guardian/consent edinim akışı
- Public formun uçtan uca güvenlik ve erişilebilirlik testi
- Nihai hukuki metinler ve operasyonel veli prosedürü

## Doğrulama

- Kapalı bayrakta sorgu ve servis çağrısı yapılmaması
- Strict UUID ve gerçek takvim tarihi doğrulaması
- Duplicate/bilinmeyen query alanlarının reddi
- Saat dilimi, min notice, max advance ve günlük kapasite
- Closed day, farklı slot increment ve aktif allocation senaryoları
- Yanıtta yalnızca UTC başlangıç/bitiş alanları
