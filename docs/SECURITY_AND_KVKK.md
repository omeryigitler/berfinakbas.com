# Güvenlik ve KVKK Gereksinimleri

Durum: Teknik taslak v0.1  
Bu belge hukuki görüş değildir.

## 1. Risk bağlamı

Uygulama kimlik, iletişim, randevu, çocuk/veli ilişkisi, finans ve olası sağlık bağlamı verileri işleyebilir. Sağlık verisi özel nitelikli kişisel veridir ve daha sıkı koruma gerektirir.

MVP’nin temel savunması, klinik veri yönetim sistemi olmamaktır: tanı, test sonucu, klinik not, rapor veya ayrıntılı sağlık öyküsü tutulmaz.

## 2. Hukuki işleme şartı

- Her veri alanı için amaç ve hukuki sebep veri envanterinde ayrı tanımlanmalıdır.
- “Her şey için açık rıza” varsayımı yapılmamalıdır; uygulanabilir hukuki sebep uzman tarafından belirlenmelidir.
- Aydınlatma yükümlülüğü ile açık rıza ayrı süreçlerdir.
- Sağlık verisi işlendiğinde KVKK madde 6’nın güncel işleme şartları ve Kurulun yeterli önlemleri değerlendirilmelidir.
- Veli/vasinin çocuk adına işlem yapma yetkisi ve gerekli kayıt kanıtı hukukçu tarafından belirlenmelidir.

## 3. Veri minimizasyonu

Randevu öncesinde varsayılan olarak yalnızca:

- Hizmet seçimi
- İsim
- İletişim
- Yetişkin/çocuk ayrımı
- Çocuksa veli/temsilci bilgisi
- Slot
- Gerekli onay kanıtı

toplanır.

Şu veriler public formda istenmez:

- Tanı ve ayrıntılı sağlık öyküsü
- Rapor/dosya yükleme
- Kimlik belgesi fotoğrafı
- Çocuğun fotoğraf/video kaydı
- Gereksiz tam doğum tarihi veya kimlik numarası

İş gereksinimi oluşursa veri alanı eklenmeden önce veri koruma etki değerlendirmesi yapılır.

## 4. Consent yönetimi

Her consent kaydı:

- Metin türü ve sürümü
- İçerik hash’i
- Kim adına verildiği
- Veren kişi ve temsil ilişkisi
- Verilme zamanı/kanalı
- Geri çekilme zamanı
- Minimum teknik kanıt

taşır.

Geri çekme, geçmişte hukuka uygun yapılmış işlemleri otomatik silme olarak yorumlanmaz. Sonuç ve saklama gereksinimi hukuk/iş kurallarıyla belirlenir.

## 5. Çocuk verisi

- Çocuk ve veli kayıtları ayrı varlıklardır.
- Yetkili veli/temsilci doğrulanmadan hassas bilgi paylaşılmaz.
- Birden fazla veli ve iletişim yetkisi desteklenebilir.
- Velayet/erişim anlaşmazlığı için manuel inceleme ve erişim dondurma prosedürü gerekir.
- Public görsel içerikte çocuk/hasta görüntüsü MVP’de kullanılmaz.

## 6. Erişim kontrolü

- En az yetki
- Sunucu tarafında RBAC kontrolü
- Admin MFA
- Kısa ve güvenli oturum politikası
- Başarısız giriş ve olağandışı erişim alarmı
- Ayrılan kullanıcı erişimini aynı gün kapatma
- Periyodik erişim gözden geçirmesi
- Developer/support için varsayılan “gerçek veriye erişim yok”

Finans, consent, export ve kullanıcı yönetimi ayrı izinlerdir.

## 7. Şifreleme ve secret yönetimi

- TLS zorunlu
- Yönetilen veritabanı ve yedeklerde at-rest şifreleme
- Secret’lar yalnızca secret manager/hosting secret alanında
- Anahtar rotasyon planı
- Hassas alanlar için gerektiğinde uygulama seviyesinde ek şifreleme değerlendirmesi
- Üretim credential’ları preview ortamına verilmez

## 8. Log ve analitik

Loglarda bulunmaz:

- Sağlık açıklaması
- Formun ham içeriği
- Tam telefon/e-posta
- Consent metninin tamamı
- Secret/token
- Finans notunun ham metni

Korelasyon ID ve iç kayıt ID’leri kullanılır. Analitik public ürün davranışıyla sınırlı tutulur; hassas form alanları hiçbir analitik sisteme gönderilmez.

## 9. Dış hizmetler ve aktarım

Her sağlayıcı için canlıya çıkış öncesi:

- İşlenen veri kategorileri
- Amaç
- Veri konumu
- Alt işleyenler
- Saklama süresi
- Silme/çıkarma yeteneği
- Şifreleme ve erişim
- İhlal bildirimi
- Sözleşme/DPA
- Yurt dışına aktarım mekanizması

değerlendirilir.

Google Calendar event’lerine sağlık ayrıntısı yazılmaz. WhatsApp/e-posta üzerinden gereksiz özel nitelikli veri gönderilmez.

## 10. Saklama ve imha

Süreler bu belgede tahmin edilmeyecektir. Onaylı veri envanterinde her kategori için süre ve gerekçe tanımlanır.

Sistem:

- Saklama süresi yaklaşan kayıtları raporlayabilmeli
- Legal hold/uyuşmazlık istisnasını ayırabilmeli
- Silme, anonimleştirme veya erişim kısıtlama işlemini audit edebilmeli
- Yedeklerde imha politikasını belgelemeli

## 11. İlgili kişi talepleri

Prosedür en az:

- Kimlik/yetki doğrulama
- Talep türü
- Kapsamdaki sistem ve sağlayıcılar
- Sorumlu kişi
- Son tarih takibi
- Verilen yanıt ve kanıt
- Ret gerekçesi

içermelidir. Ürün içinde talep yönetimi ilk MVP’de manuel süreç olabilir; audit kaydı tutulur.

## 12. Veri ihlali müdahalesi

Hazır bulunması gerekenler:

- Olay sorumlusu ve yedek kişi
- Teknik containment adımları
- Etkilenen veri/kişi tespiti
- Kanıt ve zaman çizelgesi
- Sağlayıcı iletişimleri
- Hukuk/KVKK değerlendirmesi
- İlgili kişi bildirimi şablonu
- Kök neden ve düzeltme

KVKK Kurulunun güncel açıklamasına göre Kurula bildirim, ihlalin öğrenilmesinden itibaren gecikmeksizin ve en geç 72 saat içinde ele alınmalıdır. İç alarm hedefi bu süreden kısa olmalıdır.

## 13. Güvenli geliştirme

- Dependency ve secret taraması
- SAST ve güvenlik lint’i
- CSRF, XSS, SQL injection ve SSRF kontrolleri
- Rate limit ve abuse önleme
- Dosya yükleme kapalı; açılırsa ayrı threat model
- Yetki/IDOR testleri
- Güvenli hata mesajları
- Üretim verisi olmayan test ortamı
- Kod incelemesi ve migration incelemesi

## 14. Yedekleme ve süreklilik

- Şifreli otomatik yedek
- Belgelenmiş RPO/RTO
- En az periyodik restore testi
- Restore erişimi sınırlı
- Entegrasyonlar kapalıyken çekirdek operasyonu sürdürme planı
- Manuel randevu doğrulama/acil durum prosedürü

## 15. Public tanıtım uyumu

2025 Sağlık Bakanlığı SSS’si yurt içi tanıtım için ücret/indirim/kampanya/promosyon ve hasta teşekkür/memnuniyet içeriklerini yasak kapsamda açıklar; sponsorlu/öne çıkarılan tanıtım da ciddi biçimde sınırlandırılmıştır.

Teknik politika:

- Public CMS/alanlarında fiyat ve promosyon alanı bulunmaz.
- Hasta yorumu özelliği oluşturulmaz.
- Gerçek hasta/çocuk görseli varsayılan kapalıdır.
- İçerik yayını rol, önizleme ve onay akışına bağlanır.
- Hukuk onayı olmayan sağlık iddiası yayınlanmaz.

## 16. Canlıya çıkıştan önce hukuki onay listesi

- Veri sorumlusu kimliği
- Veri envanteri ve hukuki sebepler
- Aydınlatma/açık rıza metinleri
- Çocuk/veli yetki akışı
- VERBİS yükümlülüğü veya istisnası
- Saklama ve imha politikası
- Sağlayıcı sözleşmeleri ve yurt dışı aktarım
- Çerez/analitik yaklaşımı
- Tanıtım metinleri, SEO, görseller ve reklam politikası
- Ruhsat, mesleki unvan ve hizmet kapsamı
- İhlal ve ilgili kişi talep prosedürleri

## 17. Doğrulanmış resmi kaynaklar

27 Haziran 2026 tarihinde kontrol edilmiştir:

- [KVKK — Özel Nitelikli Kişisel Verilerin İşlenmesine İlişkin Rehber](https://www.kvkk.gov.tr/Icerik/8184/Ozel-Nitelikli-Kisisel-Verilerin-Islenmesine-Iliskin-Rehber)
- [KVKK — Özel Nitelikli Kişisel Veriler](https://www.kvkk.gov.tr/Icerik/2051/Ozel-Nitelikli-Kisisel-Veriler)
- [KVKK — Veri ihlali bildirimi ve 72 saat açıklaması](https://www.kvkk.gov.tr/Icerik/8595/kamuoyu-duyurusu)
- [Sağlık Bakanlığı — Kişisel Sağlık Verileri Hakkında Yönetmelik](https://saglik.gov.tr/TR-28791/kisisel-saglik-verileri-hakkinda-yonetmelik.html)
- [Sağlık Hizmetlerinde Tanıtım ve Bilgilendirme Yönetmeliği duyurusu](https://antalyaism.saglik.gov.tr/TR-367063/saglik-hizmetlerinde-tanitim-ve-bilgilendirme-faaliyetleri-hakkinda-yonetmelik-yayimlanmistir.html)
- [Sağlık Bakanlığı 2025 Tanıtım ve Bilgilendirme SSS](https://dosyamerkez.saglik.gov.tr/Eklenti/52377/0/ssspdf.pdf)
- [Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik](https://antalyaism.saglik.gov.tr/TR-343653/saglik-meslek-mensuplarinin-serbest-meslek--icrasi-hakkinda-yonetmelik.html)
