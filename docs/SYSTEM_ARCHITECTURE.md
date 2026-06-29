# Sistem Mimarisi

Durum: Taslak v0.1

## 1. Mimari hedefler

- Çift randevuyu transaction seviyesinde önlemek
- Dış entegrasyon arızalarında çekirdek işlemleri korumak
- Sağlık ve çocuk verisini minimumda tutmak
- Her kritik değişikliği izlenebilir yapmak
- İş kurallarını kod yayınından bağımsız yönetebilmek
- Küçük bir ekiple işletilebilir, modüler monolit olarak başlamak

## 2. Önerilen üst seviye yapı

```text
Public Web / Admin Web
          |
     Next.js uygulaması
          |
  Domain servisleri + yetki
          |
 PostgreSQL + transactional outbox
          |
 Email / Google Calendar / WhatsApp linki
```

İlk sürüm mikroservis olmayacaktır. Domain sınırları kod içinde ayrılmış modüler monolit olarak uygulanır. Gerçek operasyon ihtiyacı oluşmadan servis ayrıştırması yapılmaz.

## 3. Teknoloji yönü

- Web ve sunucu: Next.js + TypeScript
- Veritabanı: PostgreSQL
- ORM/migration: Prisma; gerekli gelişmiş constraint’lerde kontrollü SQL migration
- Validation: Zod
- Form: React Hook Form
- UI: Tailwind CSS + shadcn/ui
- Test: Vitest/Jest eşdeğeri + integration test veritabanı + Playwright
- Job/outbox: İlk aşamada veritabanı tabanlı worker; ölçek oluşursa kuyruk servisi
- Gözlemlenebilirlik: Yapılandırılmış log, hata izleme, metrik ve alarm

Sürümler proje iskeleti oluşturulurken güncel LTS/kararlı sürümler üzerinden sabitlenecektir.

## 4. Domain modülleri

### Identity & Access

- Admin kimlik doğrulama
- Roller ve izinler
- MFA politikası
- Oturum ve erişim audit kayıtları

### Services & Settings

- Hizmetler
- Preset/custom süre ve buffer
- Form alanı konfigürasyonu
- Politika ve mesaj şablonları
- Ayar değişiklik geçmişi

### Availability

- Haftalık çalışma kuralları
- Tarih bazlı istisnalar
- Tatil, kapalı zaman ve özel çalışma aralıkları
- Slot üretimi

### Booking

- Slot hold
- Randevu talebi
- Onay, ret, yeniden planlama
- Çakışma önleme
- Durum geçmişi ve snapshot

### Client & Guardian

- Minimum danışan kimlik/iletişim bilgisi
- Çocuk danışan–veli ilişkisi
- İletişim tercihleri
- Consent kayıtları

### Plans & Session Credits

- Hazır/özel danışan planı
- Seans hakkı hareketleri
- Tamamlanma, no-show, iptal ve manuel düzeltme

### Finance Operations

- Ödeme planı ve taksit
- Manuel ödeme
- Append-only finans hareketleri
- Fatura/makbuz durum takibi
- Filtre ve export

### Notifications & Integrations

- E-posta outbox
- Google Calendar senkronizasyonu
- Kullanıcının başlattığı WhatsApp bağlantısı
- Retry, hata ve dead-letter görünürlüğü

### Audit & Compliance

- Kim, neyi, ne zaman, hangi gerekçeyle değiştirdi?
- Consent metin sürümü ve kanıtı
- Veri talebi ve olay müdahale kayıtları

## 5. Güven sınırları

- Public kullanıcı yalnızca public API yüzeyine erişir.
- Admin route’ları sunucu tarafında kimlik ve izin kontrolü yapar; yalnızca UI gizlemesi yeterli değildir.
- Veritabanı doğrudan tarayıcıya açılmaz.
- Dış entegrasyon credential’ları yalnızca sunucu/worker katmanında bulunur.
- Geliştirici rolünün üretim danışan verisine varsayılan erişimi yoktur.

## 6. Randevu yazma transaction’ı

1. Girdi doğrulanır.
2. Hizmet ve ilgili ayar snapshot’ı hazırlanır.
3. Hold/slot hâlâ geçerli mi kontrol edilir.
4. Aynı terapist ve zaman aralığında aktif çakışma veritabanı seviyesinde engellenir.
5. Appointment ve ilk status log aynı transaction’da yazılır.
6. Audit ve notification/calendar outbox kayıtları aynı transaction’a eklenir.
7. Transaction commit edilir.
8. Worker dış sistemleri idempotency key ile günceller.

E-posta veya Calendar hatası randevu transaction’ını geri almaz.

## 7. Entegrasyon politikası

### Google Calendar

- Kaynak değil, görünüm ve operasyon kolaylığıdır.
- Event başlığında minimum bilgi bulunur; sağlık ayrıntısı yazılmaz.
- Uygulama appointment ID’sinden türetilen idempotency key kullanılır.
- Dış event kimliği ve son sync durumu saklanır.
- Silme yerine iptal/güncelleme senkronu tercih edilir.
- İki yönlü senkron MVP’de varsayılan değildir; açık karar gerektirir.

### E-posta

- Konu satırında sağlık ayrıntısı bulunmaz.
- Mesajlar template ve sürüm ile üretilir.
- Gönderim sonucu outbox kaydına işlenir.

### WhatsApp

- MVP’de kullanıcı `wa.me` bağlantısıyla konuşmayı kendisi başlatır.
- Önceden doldurulan mesaj minimum bilgi içerir.
- WhatsApp konuşması randevu veya consent kaydının yerine geçmez.

## 8. Zaman yönetimi

- Veritabanı timestamp’leri UTC saklar.
- İşletme saat dilimi IANA kimliği olarak ayarda tutulur.
- Slot üretimi yerel işletme saatinde hesaplanır, UTC olarak kalıcılaştırılır.
- Yaz/kış saati geçişleri ve bulunmayan/çift görünen saatler test edilir.
- Kullanıcıya gösterimde açık saat dilimi kullanılır.

## 9. Para yönetimi

- Tutarlar `amount_minor` tam sayısı ve ISO para birimiyle saklanır.
- TL için kuruş kullanılır.
- Bakiye append-only ledger’dan hesaplanır; denormalize özet varsa yeniden üretilebilir olmalıdır.
- Her düzeltme önceki hareketi referanslayan ters kayıtla yapılır.

## 10. Gözlemlenebilirlik

Takip edilmesi gereken teknik sinyaller:

- Slot çakışması denemeleri
- Hold süresi aşımı
- Başarısız durum geçişi
- Outbox gecikmesi ve retry sayısı
- Calendar/email senkron hatası
- Yetkisiz erişim denemesi
- Admin MFA/oturum anormallikleri
- Yedekleme ve geri yükleme sonucu

Loglar kişisel veya sağlık verisi taşımamalı; kayıt kimlikleri ve teknik korelasyon ID’leri kullanılmalıdır.

## 11. Dağıtım ortamları

- Local: yalnızca sentetik veri
- Test/Preview: sentetik veya anonim test verisi
- Production: gerçek veri, en sıkı erişim ve MFA

Ortamların veritabanı, secret ve dosya depoları ayrıdır. Üretim verisi alt ortamlara kopyalanmaz.

## 12. Açık teknik kararlar

- Auth sağlayıcısı
- Hosting ve veritabanı sağlayıcısı/bölgesi
- Worker çalıştırma modeli
- E-posta sağlayıcısı
- Google Calendar senkron yönü
- Backup RPO/RTO hedefleri
- İzin matrisi ve admin kullanıcı sayısı
- Analitik ihtiyacı ve çerez modeli
