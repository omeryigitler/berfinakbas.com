# Proje Kapsamı

Durum: Taslak v0.1  
Son güncelleme: 2026-06-27

## 1. Vizyon

berfinakbas.com; Dil ve Konuşma Terapisti için güven veren, bilgilendirici bir portfolyo sitesi ile kontrollü randevu ve temel operasyon yönetimini aynı üründe birleştirir.

Ürün, “hemen kesin randevu satın alma” deneyimi yerine uygun slot için randevu talebi oluşturma ve gerektiğinde terapist/asistan onayı alma yaklaşımını kullanır.

## 2. Hedef kullanıcılar

- Çocuğu için destek arayan veli veya yasal temsilci
- Kendisi için hizmet arayan yetişkin danışan
- Dil ve Konuşma Terapisti
- Yetkilendirilmiş asistan
- Finans kayıtlarını görme yetkisi bulunan kullanıcı
- Sistemin teknik bakımını yapan ancak sağlık verisine varsayılan erişimi olmayan geliştirici

## 3. Ürün ilkeleri

1. Randevu doğruluğu, görsel hızdan daha önemlidir.
2. Sağlık ve çocuk verisi yalnızca gerekli olduğu ölçüde toplanır.
3. Backend randevuların tek gerçek kaynağıdır.
4. Kullanıcıya kesinleşmemiş slot “onaylandı” gibi gösterilmez.
5. Değişebilir iş kuralları admin panelinden yönetilir.
6. Ayar değişiklikleri geçmiş kayıtları değiştirmez.
7. Kritik finans ve randevu kayıtları silinmez; iz bırakacak şekilde düzeltilir.
8. Public içerik bilgilendirici olur; sağlık hizmeti reklamına dönüşmez.

## 4. MVP kapsamı

MVP iki teslim katmanından oluşur. İki katman da gerçek operasyon başlamadan önce tamamlanabilir; ayrım geliştirme ve risk yönetimi içindir.

### 4.1 MVP Çekirdek — public site ve randevu

- Ana sayfa
- Hakkında / özgeçmiş
- Hizmet alanları
- Süreç nasıl işler?
- Sık sorulan sorular
- İletişim ve çalışma bilgileri
- KVKK aydınlatma, çerez ve gerekli onay yüzeyleri
- Hizmet seçimi
- Uygun slot görüntüleme
- Kısa süreli slot hold
- Randevu talebi oluşturma
- Admin onayı/reddi/yeniden planlama
- Danışan ve gerekiyorsa veli kaydı
- Açık rıza/onay kayıtlarının sürümlü saklanması
- E-posta bildirimi
- WhatsApp için kullanıcı tarafından başlatılan `wa.me` yönlendirmesi
- Hizmet, takvim kuralı ve istisna yönetimi
- Rol bazlı admin erişimi
- Randevu durum geçmişi ve audit log

### 4.2 MVP Operasyon — seans ve temel ödeme

- Danışana hazır veya özel plan atama
- Toplam ve kalan seans hakkı
- Tamamlanan/no-show/iptal durumuna göre kontrollü hak hareketi
- Manuel ödeme kaydı
- Taksit/vade planı
- Kısmi ödeme
- Beklenen, geciken ve alınan ödeme filtreleri
- Fatura/makbuz durumunun manuel takibi
- CSV dışa aktarma
- Ters kayıt ve düzeltme hareketleri

## 5. MVP dışında

- Online kart tahsilatı ve sanal POS
- e-Fatura/e-Arşiv API entegrasyonu
- WhatsApp Business/Cloud API ile otomatik mesaj
- Klinik not, tanı, rapor, terapi dosyası veya medikal belge yönetimi
- Video görüşme/tele-sağlık
- Çok şubeli veya çok markalı yapı
- Halka açık fiyat, indirim, kampanya ve promosyon
- Hasta yorumları veya başarı hikâyeleri
- Yapay zekâ ile klinik karar veya değerlendirme
- Mobil uygulama
- Gelişmiş muhasebe ve resmi defter fonksiyonları

## 6. Ana kullanıcı akışları

### Ziyaretçi

1. Hizmet ve terapist hakkında bilgi alır.
2. Randevu talebini başlatır.
3. Hizmeti ve uygun zamanı seçer.
4. Minimum kimlik/iletişim bilgisini verir.
5. Aydınlatma metnini görür ve gereken onayları verir.
6. Talebinin alındığına dair referans kodu alır.
7. Onay, ret veya yeniden planlama bilgisini güvenli kanaldan alır.

### Terapist/asistan

1. Bekleyen talepleri görür.
2. Çakışma ve çalışma kuralı kontrolünü görür.
3. Talebi onaylar, reddeder veya alternatif önerir.
4. Randevu durumunu yönetir.
5. Yetkisi varsa danışan planı, hak ve ödeme özetini görür.

## 7. Başarı ölçütleri

- Aktif randevular arasında doğrulanmamış çakışma: 0
- Durum değişikliği ve finans hareketlerinde audit kapsaması: %100
- Entegrasyon hatası nedeniyle kaybolan çekirdek randevu: 0
- Gereksiz sağlık ayrıntısı içeren public form alanı: 0
- Randevu oluşturma akışında erişilebilirlik açısından kritik hata: 0
- Yedekten geri yükleme denemesi başarı oranı: %100

## 8. Canlıya çıkış kapıları

- Hukukçu/KVKK uzmanı içerik ve veri akışı onayı
- Terapistin yetki/ruhsat ve gösterilecek unvan bilgilerinin doğrulanması
- Randevu ve çakışma testlerinin tamamlanması
- Yetki matrisi ve MFA’nın doğrulanması
- Yedekleme ve geri yükleme tatbikatı
- Olay müdahale sorumlularının atanması
- Saklama/imha takviminin onaylanması
- Kullanılan sağlayıcılar için veri işleyen ve aktarım değerlendirmesi

## 9. Açık ürün kararları

- İşletme adı, resmi unvan ve ruhsat bilgileri
- Fiziksel konum ve online hizmet kapsamı
- Tek terapist mi, ileride çok terapist mi?
- İşletme saat dilimi
- Randevu onayı her hizmette manuel mi, bazı hizmetlerde otomatik mi?
- İptal/no-show politikasının kesin kuralları
- Randevu öncesi toplanacak minimum alanlar
- MVP’de Google Calendar senkron yönü ve kapsamı
- Saklama süreleri
- Admin kullanıcı rolleri ve gerçek kullanıcı sayısı
