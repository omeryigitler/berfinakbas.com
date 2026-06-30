# Veri Modeli Taslağı

Durum: Kavramsal v0.1  
Not: Bu dosya Prisma şeması değildir. Faz 1 öncesi alanlar ve constraint’ler gözden geçirilecektir.

## 1. Ortak kurallar

- Birincil kimlikler tahmin edilemeyen UUID/ULID olmalıdır.
- Tüm kritik tablolarda `created_at`, `updated_at` ve gerekiyorsa `created_by` bulunur.
- Tarihler UTC tutulur.
- Para `amount_minor` + `currency` olarak tutulur.
- Kritik kayıtlar hard delete edilmez.
- Public referans kodu iç ID’den farklı ve tahmin edilmesi zor olmalıdır.
- Serbest metin alanları sınırlıdır; gereksiz sağlık ayrıntısı toplanmaz.

## 2. Kimlik ve yetki

### users

- id
- email
- display_name
- status: invited | active | suspended
- mfa_enforced_at
- last_login_at
- created_at / updated_at

### roles

- id
- key: super_admin | therapist | assistant | finance | developer
- name

### user_roles

- user_id
- role_id
- assigned_by
- assigned_at

Gerekirse izinler `permissions` ve `role_permissions` tablolarına ayrılır. İlk sürümde sabit izin kataloğu kodda, rol atamaları veritabanında tutulabilir.

## 3. Danışan ve veli

### clients

- id
- type: adult | child
- first_name
- last_name
- preferred_name (nullable)
- phone (nullable)
- email (nullable)
- birth_year veya date_of_birth: hukuk/iş gereksinimine göre karar verilecek
- status: prospective | active | inactive
- communication_preference
- created_at / updated_at

Klinik tanı, serbest sağlık öyküsü ve terapi notu bu tabloda bulunmaz.

### guardians

- id
- first_name
- last_name
- phone
- email (nullable)
- created_at / updated_at

### client_guardians

- client_id
- guardian_id
- relationship
- is_primary
- authority_verified_at (nullable)
- verification_note sınırlı ve sağlık verisi içermeyen kısa açıklama

Bir çocuk danışan için gerçek randevu onayından önce en az bir yetkili veli/temsilci kuralı uygulanır.

## 4. Consent ve bilgilendirme

### consent_documents

- id
- type
- version
- content_hash
- effective_from
- retired_at (nullable)

### consents

- id
- client_id (nullable)
- guardian_id (nullable)
- granted_by_guardian_id (nullable; çocuk danışan adına beyan veren veli/temsilci)
- document_id
- status: granted | withdrawn | expired
- captured_at
- withdrawn_at (nullable)
- capture_channel
- evidence_metadata: minimum teknik kanıt
- actor_user_id (nullable)

Aydınlatma metninin gösterilmesi ile açık rıza aynı kayıt/checkbox olarak modellenmez.
`client_id`/`guardian_id` kaydın subject alanlarıdır; `granted_by_guardian_id` subject değildir. Çocuk danışan adına veli beyanında `client_id` ve `granted_by_guardian_id` birlikte bulunur.

## 5. Hizmet ve ayarlar

### services

- id
- slug
- name
- public_description
- status: draft | active | inactive
- public_visible
- approval_mode: manual | automatic
- default_duration_minutes
- default_buffer_before_minutes
- default_buffer_after_minutes
- location_type: in_person | online | hybrid
- sort_order
- created_at / updated_at

### service_policies

- id
- service_id
- effective_from
- booking_min_notice_minutes
- booking_max_advance_days
- cancellation_window_minutes
- reschedule_window_minutes
- max_daily_appointments (nullable)
- custom_form_schema (nullable, kontrollü JSON)
- created_by

### system_settings

- key
- value (typed JSON)
- version
- updated_by
- updated_at

### setting_change_logs

- id
- setting_key veya entity reference
- old_value
- new_value
- reason
- changed_by
- changed_at

## 6. Uygunluk ve takvim

### practitioners

- id
- user_id
- display_name
- timezone
- status

İlk sürüm tek terapist olsa bile appointment kaydında practitioner alanı bulunur; çok terapist özelliği açılmadan UI ve yetkiler genişletilmez.

### availability_rules

- id
- practitioner_id
- weekday
- local_start_time
- local_end_time
- valid_from / valid_until (nullable)
- slot_increment_minutes
- status

Saatler terapistin yapılandırılmış IANA saat dilimindeki `HH:mm` yerel duvar saati olarak saklanır; UTC’ye dönüşüm slot üretimi sırasında yapılır. Haftanın günü `0-6` aralığındadır ve bitiş başlangıçtan sonra olmalıdır.

### availability_exceptions

- id
- practitioner_id
- local_date
- type: closed | custom_hours | blocked
- start_time / end_time (nullable)
- reason_code
- private_note (nullable, sağlık verisi içermez)
- status: active | inactive

`closed` istisnasında saat alanları boş; `custom_hours` ve `blocked` istisnalarında iki saat de dolu ve sıralı olmalıdır. Bir günde farklı istisna tiplerinin öncelik sırası ürün kararı netleşmeden uygulama katmanında varsayılmaz.

### appointment_holds

- id
- practitioner_id
- service_id
- starts_at
- ends_at
- expires_at
- holder_token_hash
- status: active | consumed | expired | released
- created_at

Süresi dolan hold rezervasyon sayılmaz. Temizlik işi tekrar çalıştırılabilir olmalıdır.

### booking_allocations

- id
- practitioner_id
- hold_id veya appointment_id (yalnızca biri)
- busy_starts_at / busy_ends_at
- status: active | released
- released_at (nullable)
- created_at

Hold ve randevuların zaman blokları bu ortak tabloda tutulur. Aynı terapiste ait iki aktif aralığın çakışması PostgreSQL `EXCLUDE USING gist` kısıtıyla engellenir. Böylece hold-hold, hold-randevu ve randevu-randevu çakışmaları aynı veritabanı garantisine tabidir. Süresi dolan hold, yeni yazma transaction’ında durum geçmişi ve audit kaydıyla birlikte serbest bırakılır.

## 7. Randevu

### appointments

- id
- public_reference
- client_id
- guardian_id (nullable)
- practitioner_id
- service_id
- status
- starts_at
- ends_at
- service_name_snapshot
- duration_minutes_snapshot
- buffer_before_minutes_snapshot
- buffer_after_minutes_snapshot
- location_type_snapshot
- policy_snapshot (kontrollü JSON)
- request_note: kısa, opsiyonel ve sağlık ayrıntısı istemeyen alan
- source: web | admin | phone
- approved_by / approved_at (nullable)
- cancellation_reason_code (nullable)
- cancelled_at (nullable)
- created_at / updated_at

Önerilen durumlar:

- requested
- pending_review
- confirmed
- rejected
- reschedule_proposed
- cancelled_by_client
- cancelled_by_practitioner
- completed
- no_show

Durum geçişleri serbest string güncellemesiyle değil domain state machine ile yapılır.

### appointment_consents

- appointment_id
- consent_id
- created_at

Randevu talebinde kullanılan immutable consent kayıtlarını composite primary key ve `ON DELETE RESTRICT` foreign key’lerle appointment’a bağlar. Belge metni, form payload’ı veya iletişim verisi kopyalanmaz.

### appointment_status_logs

- id
- appointment_id
- from_status (nullable)
- to_status
- reason_code
- note (sınırlı)
- actor_type: user | system | client
- actor_user_id (nullable)
- created_at

### Çakışma constraint’i

Aktif randevular için aynı practitioner üzerinde `[starts_at - buffer_before, ends_at + buffer_after)` aralıkları çakışmamalıdır.

PostgreSQL exclusion constraint ortak `booking_allocations` tablosunda uygulanır. Yalnızca “önce sorgula sonra ekle” yaklaşımı kullanılmaz.

## 8. Danışan planları ve seans hakları

### plan_templates

- id
- name
- default_session_count
- default_session_duration_minutes
- public_visible: varsayılan false
- status

### client_plans

- id
- client_id
- plan_template_id (nullable)
- name_snapshot
- total_sessions
- session_duration_minutes
- total_amount_minor
- currency
- valid_from / valid_until (nullable)
- status: draft | active | completed | cancelled
- created_by
- created_at

### session_credit_ledger

- id
- client_plan_id
- appointment_id (nullable)
- entry_type: grant | consume | restore | expire | correction
- quantity
- reverses_entry_id (nullable)
- reason_code
- created_by
- created_at

Kalan hak, ledger toplamından hesaplanır. Negatif bakiye yalnızca açık iş kuralı ve yetkili override ile mümkündür.

## 9. Ödeme ve finans

### payment_schedules

- id
- client_id
- client_plan_id
- total_amount_minor
- currency
- status
- created_at

### payment_installments

- id
- payment_schedule_id
- installment_no
- due_date
- amount_minor
- status: pending | partial | paid | overdue | cancelled

### payments

- id
- client_id
- client_plan_id (nullable)
- installment_id (nullable)
- appointment_id (nullable)
- amount_minor
- currency
- payment_method
- paid_at
- status: recorded | reversed | refunded
- received_by
- external_reference (nullable)
- note (sınırlı)
- created_at

### financial_ledger

- id
- client_id
- entry_type: charge | payment | refund | write_off | correction
- amount_minor_signed
- currency
- reference_type
- reference_id
- reverses_entry_id (nullable)
- description_code
- created_by
- created_at

### invoices

- id
- client_id
- payment_id (nullable)
- status: not_required | pending | issued | sent_to_accountant | cancelled
- invoice_number (nullable)
- invoice_date (nullable)
- amount_minor (nullable)
- external_link (nullable)
- created_at / updated_at

Bu tablo resmi e-Belge üretmez; durum takibi yapar.

## 10. Bildirim ve entegrasyon

### outbox_events

- id
- aggregate_type
- aggregate_id
- event_type
- payload: minimum gerekli veri
- idempotency_key (unique)
- status: pending | processing | sent | failed | dead
- attempt_count
- next_attempt_at
- last_error_code (nullable)
- created_at / processed_at

### calendar_sync_records

- id
- appointment_id
- provider
- external_event_id
- last_synced_version
- status
- last_error_code (nullable)
- updated_at

## 11. Audit

### audit_logs

- id
- actor_type
- actor_user_id (nullable)
- action
- entity_type
- entity_id
- before_summary (minimum/redacted)
- after_summary (minimum/redacted)
- reason (nullable)
- correlation_id
- ip_hash veya güvenlik politikasıyla onaylı ağ kanıtı
- created_at

Audit log içine secret, tam form payload’ı veya gereksiz sağlık verisi yazılmaz.

## 12. İndeksler

En az:

- appointments(practitioner_id, starts_at)
- appointments(client_id, starts_at desc)
- appointments(status, starts_at)
- appointment_holds(practitioner_id, starts_at, expires_at)
- payment_installments(status, due_date)
- financial_ledger(client_id, created_at)
- session_credit_ledger(client_plan_id, created_at)
- outbox_events(status, next_attempt_at)
- audit_logs(entity_type, entity_id, created_at)

## 13. Saklama ve imha

Süreler hukuk/iş gereksinimiyle onaylanmadan şemaya sabitlenmez. Her tablo için:

- Veri sahibi
- İşleme amacı
- Hukuki sebep
- Saklama süresi
- İmha/anonimleştirme yöntemi
- Legal hold istisnası

ayrı envanterde tanımlanacaktır.
