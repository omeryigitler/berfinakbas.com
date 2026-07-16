# Transactional Outbox

Durum: Provider-neutral çekirdek uygulanmıştır; dış gönderim adapter’ları kapalıdır.

## Amaç

Randevu kaydı kesin kaynaktır. E-posta veya Calendar hatası randevuyu geri alamaz; randevu transaction’ı başarılıysa işlenecek olay aynı transaction’da kalıcılaşır.

## Olay sözleşmesi

`APPOINTMENT_STATUS_CHANGED` payload’ı yalnızca şunları taşır:

- `appointmentId`
- `statusLogId`
- `fromStatus`
- `toStatus`
- `occurredAt`

Idempotency key `appointment-status-log:<statusLogId>` biçimindedir. Danışan adı/iletişimi, serbest not, consent metni, holder token, sağlık ayrıntısı ve provider credential’ı event’e yazılmaz.

## Worker yaşam döngüsü

1. Due `PENDING`/`FAILED` veya lease’i dolmuş `PROCESSING` olayları okunur.
2. Koşullu update ile yalnızca bir worker olayı claim eder ve attempt sayısını artırır.
3. Başarılı handler olayı `SENT` yapar.
4. Geçici hata, çağıranın belirlediği gelecekteki zamana `FAILED` olarak planlanır.
5. Çağıranın onaylı deneme sınırına gelinmişse olay `DEAD` olur.

`SENT` ve `DEAD` kayıtları silinmez. Worker lease süresi, retry/backoff ve maksimum deneme politikası entegrasyon çalıştırıcısında açıkça yapılandırılmalıdır.
Tamamlama ve hata kayıtları claim’in attempt sayısını taşır; lease’i dolduktan sonra gelen eski worker sonucu yeni claim’i değiştiremez.

## Sonraki sınır

- Onaylı e-posta şablonları ve alıcı/durum matrisi
- E-posta sağlayıcısı ve veri aktarımı değerlendirmesi
- Google Calendar tek yönlü, idempotent adapter ve external-event kaydı
- Worker scheduler/hosting ve secret yönetimi
- Retry/dead-letter yönetim görünürlüğü ve audit

Bu kararlar tamamlanana kadar outbox olayları dış sisteme gönderilmez.
