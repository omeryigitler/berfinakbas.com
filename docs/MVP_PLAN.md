# MVP ve Geliştirme Planı

Durum: Taslak v0.1

## Faz 0 — kapsam ve kurallar ✅

Çıktılar:

- README ve AGENTS.md
- Proje kapsamı
- Mimari ve veri modeli taslağı
- Randevu ve ödeme kuralları
- Admin panel modülleri
- Güvenlik/KVKK gereksinimleri
- Public içerik kuralları
- Test kontrol listesi
- Mimari karar kaydı

Tamamlanma ölçütü: Açık kararlar ürün sahibiyle gözden geçirilir ve ilk kodlama kapsamı dondurulur.

## Faz 1 — teknik temel ✅

- Next.js + TypeScript kurulumu
- Paket yöneticisi ve sürüm politikası
- Lint, format, typecheck ve test komutları
- CI pipeline
- Ortam değişkeni şeması ve doğrulaması
- PostgreSQL bağlantısı ve Prisma
- Hata sınırları ve güvenli loglama
- Temel tasarım tokenları

Tamamlanma ölçütü: Temiz ortamda tek komutla kurulum, test ve build başarılıdır.

Mevcut durum:

- Next.js, TypeScript, Tailwind ve App Router kuruldu.
- Prisma 7/PostgreSQL yapılandırması ve ilk foundation migration’ı oluşturuldu.
- Ortam değişkeni doğrulaması, lint, format, typecheck ve test komutları eklendi.
- İlk randevu süre/buffer ve durum geçiş testleri eklendi.
- Production build doğrulandı.
- CI workflow gerçek GitHub deposunda çalışmakta ve `main` kalite kapısı geçmektedir.
- Gerçek PostgreSQL 17 üzerinde migration ve integration test paketi çalışmaktadır.
- PostgreSQL 17 servis konteyneri kullanan ayrı CI işi, altı migration ve on sekiz gerçek veritabanı testini her pull request ve `main` push’unda çalıştırır.

## Faz 2 — kimlik, yetki ve veri çekirdeği

- Kullanıcı ve rol modeli
- MFA uyumlu admin kimlik doğrulama
- Hizmetler ve hizmet snapshot modeli
- Danışan/veli minimum veri modeli
- Consent ve audit log
- Ayar/değişiklik geçmişi
- İlk migration ve sentetik seed

Tamamlanma ölçütü: Yetkili/izinsiz erişim integration testleri ve migration testi geçer.

Mevcut durum:

- Auth.js + Prisma ile Google OAuth’a hazır, yalnızca davetli hesaplara açık giriş iskeleti eklendi.
- Allowlist ile ilk kez oluşturulan yönetici hesabının `SUPER_ADMIN` rolü ve audit kaydı aynı transaction içinde atanır; suspended ve allowlist dışı hesaplar fail-closed reddedilir.
- Sunucu tarafı rol/izin kataloğu ve izin testleri eklendi.
- Kullanıcı/rol, Auth.js oturumu, danışan/veli ve consent modelleri ile SQL migration hazırlandı.
- Consent subject ile çocuk adına beyan veren guardian grantor ayrı alanlara taşındı; additive migration ve PostgreSQL constraint testi eklendi.
- Aydınlatma acknowledgement, randevu koşulları, yapılandırılmış açık rıza ve veli yetkisi kapıları ADR-017 ile ayrıştırıldı.
- Hizmet ayarı doğrulaması, değişmez snapshot üretimi ve audit kayıtlı admin API temeli eklendi.
- Sentetik rol ve taslak hizmet seed’i hazırlandı.
- ChatGPT proje klasöründeki tasarım yönü incelendi ve public ana sayfaya uygulandı.
- Yetkili/izinsiz route testleri, lint, typecheck, format kontrolü ve production build başarılıdır.
- Altı migration gerçek PostgreSQL 17 CI kapısında uygulanır; eşzamanlılık, transaction ve consent bütünlüğü integration testleriyle doğrulanır.
- Gerçek Google OAuth istemcisi, MFA politikası ve ilk canlı yönetici rolü doğrulaması yayın kapısı olarak beklenmektedir.

## Faz 3 — randevu motoru

- Çalışma kuralları ve istisnalar
- Slot üretimi
- Buffer ve custom süre
- Slot hold
- Transaction içinde çakışma önleme
- Talep/onay/ret/iptal/yeniden planlama
- Randevu referans kodu
- Durum geçmişi

Tamamlanma ölçütü: Eşzamanlı istek, saat dilimi, snapshot ve status-transition testleri geçer.

Mevcut durum:

- UTC/IANA saat dilimi kullanan saf slot üretimi; custom süre, buffer, minimum bildirim, kapasite ve yaz/kış saati testleri hazırdır.
- Practitioner, hold, appointment, durum geçmişi ve ortak booking allocation şeması için additive migration hazırlanmıştır.
- Hold oluşturma; süresi dolan hold temizliği, token hash, durum geçmişi, ortak allocation ve audit kaydını serializable transaction içinde yazar.
- Hold yarışı PostgreSQL deadlock/serialization hatalarında üç denemeyle sınırlı retry uygular; retry sonrası overlap güvenli slot conflict’e çevrilir.
- Hold başlangıcı uzmanın saat diliminde aktif availability rule/exception, hizmet süresi-buffer, minimum/maksimum rezervasyon sınırı ve günlük kapasiteyle transaction içinde yeniden doğrulanır; yapılandırma belirsizliği fail-closed kalır.
- Hold süresi çağıran girdisinden çıkarılmıştır; yalnızca doğrulanmış sunucu ayarı kullanılır ve ayar tanımsızken veritabanı yazımı başlamaz. Production dakika değeri açık ürün kararıdır.
- Public hold API sınırı varsayılan kapalı bayrak, same-origin, strict/limited JSON, güvenli correlation ID ve `no-store` holder-token yanıtıyla uygulanmıştır; form ve production özelliği açılmamıştır.
- PostgreSQL exclusion constraint hold-hold, hold-randevu ve randevu-randevu çakışmasını tek noktada engeller.
- Haftalık yerel çalışma kuralları ile kapalı gün, özel saat ve blok istisnaları için additive şema/migration ve çift katmanlı doğrulama hazırdır.
- Randevu durum geçişleri iyimser eşzamanlılık kontrolüyle appointment, status log ve audit kaydını aynı transaction içinde yazar; onay aktör/zamanını kaydeder ve ret/iptalde allocation’ı serbest bırakır.
- Admin durum API’si aktif oturum, `appointments:manage`, güvenilir origin ve terapistin kendi practitioner kaydı sınırlarını uygular; geçersiz veya yarışta kaybeden geçişleri güvenli yanıtlara dönüştürür.
- Admin liste API’si varsayılan olarak bekleyen talepleri döndürür; rol/practitioner kapsamı, sınırlandırılmış cursor sayfalama ve serbest not/iletişim ayrıntısını dışarıda bırakan minimum veri seçimi uygular.
- Admin bekleyen talepler ekranı minimum liste alanlarını işletme saat diliminde gösterir; yükleme, boş, hata, yenileme ve cursor ile daha fazla kayıt durumları erişilebilir biçimde hazırlanmıştır. Onay/ret eylemleri sonuç ve geri dönüş bilgisini işlem öncesinde gösterir, başarılı kaydı kuyruktan çıkarır ve sunucu yetkisini yeniden doğrular.
- Altı migration ve on sekiz gerçek PostgreSQL integration testi; hold/randevu allocation yarışları, availability dışı hold reddi, günlük kapasitedeki son yer için farklı-slot hold yarışı, atomik hold→request dönüşümü, rollback, consent IDOR, aynı durumdan iki eşzamanlı geçiş ve consent subject/grantor bütünlüğünü doğrular.
- Hold süresinin production değeri ve dağıtık abuse kontrolü `OPEN` durumundadır; sunucu ayarı/bayrağı kapalıyken hold yazımı fail-closed kalır ve public randevu formu açılmamıştır.
- Zorunlu acknowledgement/consent türleri ve çocuk/veli doğrulama aşamaları ADR-017 ile kapatılmıştır. Hold’dan `REQUESTED` randevu üreten application service atomik consent kanıt bağlarıyla uygulanmıştır; public API/form ve nihai hukuki metin onayı tamamlanmadığı için canlı gönderim kapalıdır.

## Faz 4 — public site 🟡

Bu faz randevu motoruyla paralel ilerleyebilir; gerçek randevu gönderimi Faz 3 tamamlanmadan açılmaz.

- Ana sayfa
- Hakkında
- Hizmetler
- Süreç ve SSS
- İletişim
- Yasal metin yüzeyleri
- Erişilebilirlik ve performans
- Bilgilendirici SEO

Tamamlanma ölçütü: İçerik hukuk/meslek doğrulamasından, arayüz erişilebilirlik ve performans kontrolünden geçer.

Mevcut durum: Ana sayfa ile Hakkımda, Hizmetler, Süreç, İletişim ve Randevu yüzeyleri uygulanmıştır. Kullanıcının seçtiği beyaz kıyafetli görsel geçici portre olarak yerleştirilmiştir. Yüksek çözünürlüklü orijinal portre, doğrulanmış mesleki bilgiler, gerçek hizmet içerikleri ve hukuk/erişilebilirlik son kontrolü beklenmektedir.

## Faz 5 — admin ve operasyon

- Dashboard
- Takvim ve bekleyen talepler
- Hizmet/takvim ayarları
- Danışan/veli özeti
- Consent kayıtları
- Audit görüntüleme
- Danışan planları ve seans hakkı hareketleri
- Temel ödeme, vade ve gecikme takibi

Tamamlanma ölçütü: Kritik işlemlerde onay, yetki, audit ve düzeltme akışları test edilir.

## Faz 6 — kontrollü entegrasyonlar

- E-posta outbox ve şablonlar
- Google Calendar idempotent senkronizasyonu
- Kullanıcının başlattığı WhatsApp yönlendirmesi
- Retry/dead-letter görünürlüğü
- Entegrasyon sağlık paneli

Tamamlanma ölçütü: Her entegrasyon kapalıyken çekirdek sistem çalışmaya devam eder; tekrar denemeler duplicate üretmez.

## Faz 7 — canlıya hazırlık

- Güvenlik testi ve bağımlılık taraması
- Yük/çakışma testi
- Yedekleme/geri yükleme tatbikatı
- Olay müdahale provası
- Hukuki ve içerik onayı
- Erişimlerin gözden geçirilmesi
- İzleme ve alarm kuralları
- Kademeli yayın ve geri dönüş planı

## İlk uygulama görevleri

1. Faz 0 belgelerindeki açık kararları kapat.
2. Next.js/TypeScript proje iskeletini kur.
3. CI ve kalite komutlarını ekle.
4. Ortam değişkeni doğrulamasını kur.
5. Prisma ve ilk çekirdek migration’ı hazırla.
6. Role-based auth iskeletini kur.
7. Hizmet yönetimi ve snapshot testlerini ekle.
8. Çalışma kuralları ve istisna modelini ekle.
9. Slot motorunu saf domain servisi olarak yaz ve test et.
10. Slot hold + çakışma önleme transaction’ını ekle.

## Kapsam değişikliği kuralı

Yeni özellik doğrudan aktif faza eklenmez. Önce:

1. Kullanıcı ve iş değeri
2. İşlenen veri ve KVKK etkisi
3. Randevu/finans bütünlüğü etkisi
4. Test ve operasyon maliyeti
5. MVP’ye etkisi

değerlendirilir ve karar `DECISIONS.md` dosyasına kaydedilir.
