# Test Kontrol Listesi

Durum: Taslak v0.1

## 1. Kalite kapıları

Her pull request için:

- Typecheck
- Lint/format kontrolü
- Unit test
- İlgili integration test
- Migration doğrulaması
- Güvenlik/KVKK etkisi
- Erişilebilirlik etkisi

## 2. Randevu domain unit testleri

- Çalışma aralığında slot üretimi
- Kapalı günde slot üretmeme
- Tarih istisnası
- Süre + önce/sonra buffer
- 52 dakika gibi custom süre
- Minimum ön bildirim
- Maksimum ileri rezervasyon
- Günlük kapasite
- Sınırda bitiş/bitişe dokunma
- Saat dilimi dönüşümü
- Yaz/kış saati geçişi
- Snapshot’ın ayar değişiminden etkilenmemesi
- Geçersiz durum geçişi

## 3. Randevu integration testleri

> **CANLIYA ÇIKIŞ ENGELİ:** `20260629030000_booking_hold_core` migration’ı gerçek PostgreSQL üzerinde uygulanıp aşağıdaki hold/appointment eşzamanlılık senaryoları geçmeden public randevu gönderimi veya admin onayı açılmaz. Bu engel, randevu çekirdeğiyle ilgili her teslimde yeniden belirtilir.

Yerel durum (29 Haziran 2026): PostgreSQL 17.10 üzerinde dört migration ve sekiz gerçek veritabanı integration testi geçti. `pnpm test:integration` hold–hold, deadlock/serialization retry içeren uygulama servisi hold yarışı, hold–randevu, randevu–randevu, farklı uzman, atomik randevu durum geçmişi/audit/allocation serbest bırakma ve aynı durumdan eşzamanlı geçiş senaryolarını doğrular. Son retry düzeltmesinden sonra paket üç ardışık turda geçmiştir. Canlıya çıkıştan önce seçilecek yönetilen PostgreSQL/CI ortamında aynı paket yeniden çalıştırılmalıdır.

Sürekli doğrulama: GitHub Actions, PostgreSQL 17 servis konteynerinde dört migration ve sekiz integration testini her pull request ve `main` push’unda ayrı `postgres-integration` işi olarak çalıştırır. Bu iş production veya geliştirici veritabanına bağlanmaz.

- Aynı slota iki eşzamanlı istekten yalnızca birinin başarılı olması
- Aktif hold ile randevu çakışması
- Aynı terapistte çakışan iki aktif hold’dan yalnızca birinin oluşması
- Aynı terapistte hold ve appointment allocation yarışından yalnızca birinin aktif kalması
- Aynı terapistte çakışan iki appointment allocation’dan yalnızca birinin oluşması
- Farklı terapistlerde aynı saat aralığının birbirini engellememesi
- Hold süresi dolarken gönderim
- Admin ve public isteğin eşzamanlı çakışması
- Onay transaction’ında status log + audit + outbox atomikliği
- Başarısız Calendar/e-posta çağrısında randevunun korunması
- Retry’nin duplicate event üretmemesi
- Yeniden planlamada eski randevunun izlenebilir kalması

## 4. Danışan/veli ve consent

- Çocuk danışanda gerekli veli olmadan ilerleyememe
- Yetkisiz velinin veri görememesi
- Aynı danışana birden fazla veli
- Consent document sürümü ve hash
- Aydınlatma ile açık rızanın ayrı kaydı
- Geri çekme audit’i
- Eksik/expired consent uyarısı

## 5. Seans hakkı

- Plan oluşturulunca doğru hak grant’i
- Randevu tamamlanınca bir kez consume
- Duplicate event’in ikinci kez hak düşürmemesi
- Terapist iptalinde hak düşmemesi
- Geç iptal/no-show politika seçenekleri
- Restore ve correction
- Plan süresi dolumu
- Negatif hak engeli/override

## 6. Ödeme ve ledger

- Plan tahakkuku
- Tam ve kısmi ödeme
- Bir ödemeyi takside bağlama
- Gecikmiş taksit hesaplama
- Ters ödeme/iade
- Aynı isteğin idempotent işlenmesi
- Kuruş yuvarlaması
- Para birimi uyuşmazlığının engellenmesi
- Ledger toplamı ile özet bakiyenin tutarlılığı
- Ters çevrilmiş hareketin tekrar ters çevrilmesi
- Export toplamlarının ekran toplamıyla uyumu

## 7. Yetki ve güvenlik

- Her rol için izin verilen erişim
- Her rol için reddedilen erişim
- UI’da gizli olsa bile API’nin reddetmesi
- Admin onay/ret eyleminde işlem öncesi sonuç ve geri dönüş uyarısı
- Başarılı onay/ret sonrası kaydın bekleyen kuyruktan çıkması; API hatasında görünür güvenli hata
- IDOR: başka danışan/randevu kimliğiyle erişememe
- Session fixation/expiration
- MFA zorunluluğu
- CSRF
- XSS ve güvenli çıktı encode
- Rate limit
- Secret ve hassas verinin loglara düşmemesi
- Export ve audit export yetkisi
- Suspended kullanıcının oturumunun sonlandırılması

## 8. Public form

- Klavye ile tamamlanabilme
- Screen reader etiketleri
- Hata özetleri ve alanla ilişki
- Çift gönderim
- Ağ kesintisi
- Slot başka kullanıcı tarafından alınmışsa güvenli hata
- Mobil ve masaüstü
- Uzun isim/karakter seti
- Telefon/e-posta doğrulaması
- Sağlık ayrıntısı istemeyen kısa not uyarısı

## 9. İçerik ve SEO

- Title/description/canonical
- Sitemap/robots
- Yapılandırılmış veri doğruluğu
- Kırık bağlantı
- Görsel alt metin
- Fiyat/kampanya/hasta yorumu gibi yasaklı public bileşenlerin bulunmaması
- CTA’nın kesin randevu izlenimi vermemesi

## 10. Entegrasyon

- E-posta provider timeout/retry
- Calendar 429/5xx
- Aynı event’in tekrar gönderilmesi
- Dış event silinmesi/değişmesi
- Entegrasyon kapalıyken çekirdek akış
- Dead-letter görünürlüğü
- Mesajlarda gereksiz kişisel/sağlık verisi olmaması

## 11. Migration

- Boş veritabanına uygulama
- Bir önceki sürümden yükseltme
- Veri kaybı kontrolü
- İndeks/constraint oluşturma
- Uzun süren lock değerlendirmesi
- Geri dönüş veya ileri-düzeltme planı
- Sentetik seed

## 12. Yedekleme ve olay müdahalesi

- Otomatik yedek oluşuyor mu?
- Temiz ortama restore edilebiliyor mu?
- Restore sonrası veri bütünlüğü
- RPO/RTO ölçümü
- Yetkisiz yedek erişimi engeli
- İhlal tespit/alarm akışı
- İletişim ve 72 saatlik değerlendirme zaman çizelgesi provası

## 13. Canlıya çıkış regresyon paketi

- Yeni randevu talebi
- Admin onayı
- Yeniden planlama
- İptal/no-show
- Ayar değişikliği + eski snapshot
- Çocuk/veli consent
- Plan ve hak düşümü
- Ödeme/kısmi ödeme/ters kayıt
- E-posta ve Calendar retry
- Rol matrisi
- Audit log
- Yedekten geri yükleme doğrulaması

## 14. Test veri politikası

- Gerçek isim, telefon, e-posta veya sağlık verisi kullanılmaz.
- Test fixture’ları açıkça sentetiktir.
- Screenshot/video artefact’larında hassas veri bulunmaz.
- Üretim dump’ı local veya CI ortamına alınmaz.
