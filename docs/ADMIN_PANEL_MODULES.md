# Admin Panel Modülleri

Durum: Taslak v0.1

## 1. Tasarım prensipleri

- Kritik durumlar tek tıkla ve geri dönüşsüz değiştirilmez.
- Kullanıcı yalnızca yetkili olduğu veriyi görür.
- Listelerde gereksiz sağlık veya çocuk verisi gösterilmez.
- Her kritik eylemde sonuç, etkilenen kayıt ve geri alma yöntemi açıkça gösterilir.
- Filtreler URL veya güvenli kullanıcı tercihiyle korunabilir; kişisel veri URL’ye yazılmaz.

## 2. Dashboard

- Bugünkü onaylı randevular
- Bekleyen talepler
- İptal/no-show uyarıları
- Entegrasyon hataları
- Bugün/hafta beklenen ödemeler (yetkiye bağlı)
- Geciken ödeme sayısı (yetkiye bağlı)
- Son audit olayları (role göre)

Dashboard özetleri drill-down yapılabilir olmalı; sayıların hesaplanma zamanı görünmelidir.

## 3. Takvim

- Gün/hafta görünümü
- Randevu durum renkleri + metin/ikon desteği
- Buffer görünürlüğü
- Hold’lar yalnızca yetkili kullanıcıya ve ayrı stilde
- Kapalı zaman/istisna görünümü
- Çakışma uyarısı
- Randevu detayına kontrollü erişim

Sadece renk ile anlam verilmez.

## 4. Bekleyen talepler

- Talep zamanı
- İstenen hizmet ve slot
- Minimum danışan/veli özeti
- Consent kontrol durumu
- Çakışma/uygunluk sonucu
- Onayla, reddet, alternatif öner

Onay eylemi son bir transaction kontrolü yapar.
Liste API’si serbest talep notu, iletişim bilgisi ve consent ayrıntısını varsayılan response’a eklemez; ayrıntı erişimi ayrı yetki ve kontrollü görünüm gerektirir.
İlk admin ekranı bu minimum listeyi işletme saat diliminde gösterir; onay/ret eylemleri ayrı kontrollü akışta açılacaktır.

## 5. Hizmet yönetimi

- Ad ve public açıklama
- Aktif/pasif/public görünürlük
- Preset + custom süre
- Buffer
- Onay modu
- Minimum ön bildirim ve ileri rezervasyon sınırı
- İptal/yeniden planlama politikası
- Konum tipi
- Değişiklik önizlemesi ve nedeni

Geçmiş randevuların snapshot’ı değişmez.

## 6. Çalışma saatleri

- Haftalık kurallar
- Tarih istisnaları
- Tatil/kapalı gün
- Özel çalışma aralığı
- Günlük kapasite
- Değişikliğin üretilecek slotlara etkisi

Toplu değişiklikte tarih aralığı ve etkilenen gelecek talepler gösterilir.

## 7. Danışan/veli

- Genel ve iletişim bilgileri
- Veli ilişkileri
- Randevu geçmişi
- Aktif plan ve kalan hak özeti
- Ödeme özeti (yetkiye bağlı)
- Consent kayıtları
- Audit geçmişi

Klinik not alanı MVP’de bulunmaz.

## 8. Plan ve seans hakkı

- Hazır/özel plan oluşturma
- Plan aktif/pasif/tamamlandı/iptal
- Hak hareketleri
- Appointment ile hak hareketi ilişkisi
- Manuel düzeltme ve zorunlu gerekçe

Kalan hak doğrudan düzenlenmez; hareket eklenir.

## 9. Ödeme paneli

Filtreler:

- Bugün / bu hafta / bu ay / özel tarih
- Beklenen / kısmi / ödendi / gecikmiş
- Danışan/veli
- Plan/hizmet
- Ödeme yöntemi
- Fatura/makbuz durumu

Eylemler:

- Ödeme ekle
- Taksit planı oluştur
- Kısmi ödeme bağla
- Ters kayıt/iade
- Fatura durumunu güncelle
- CSV export

## 10. Consent ve yasal metinler

- Doküman türü ve sürümü
- Yürürlük tarihi
- Kim/ne adına onay verdi?
- Verilme ve geri çekilme zamanı
- Kanal ve minimum kanıt
- Eksik/geçersiz consent uyarısı

Yasal metin düzenlemek özel yetki ve yayın önizlemesi gerektirir.

## 11. Bildirimler ve entegrasyonlar

- E-posta/Calendar outbox durumu
- Retry sayısı
- Son hata kodu
- Manuel tekrar deneme
- Dead-letter inceleme
- Entegrasyonu geçici kapatma

Kullanıcıya teknik hata detayında kişisel veri gösterilmez.

## 12. Audit log

Filtreler:

- Kullanıcı
- Eylem
- Varlık türü
- Tarih aralığı
- Korelasyon ID

Audit export’u özel izin gerektirir. Audit kaydı UI üzerinden düzenlenemez/silinemez.

## 13. Roller ve başlangıç matrisi

| Alan                     | Super admin | Terapist           | Asistan                | Finance   | Developer        |
| ------------------------ | ----------- | ------------------ | ---------------------- | --------- | ---------------- |
| Randevu görme/yönetme    | Tam         | Tam                | Yapılandırılabilir     | Yok       | Yok              |
| Danışan/veli temel bilgi | Tam         | Tam                | Yapılandırılabilir     | Sınırlı   | Yok              |
| Consent kayıtları        | Tam         | Görüntüle          | Sınırlı                | Yok       | Yok              |
| Plan/seans hakkı         | Tam         | Tam                | Sınırlı                | Görüntüle | Yok              |
| Ödeme/rapor              | Tam         | Yapılandırılabilir | Kayıt ekleme opsiyonel | Tam       | Yok              |
| Ayarlar/hizmetler        | Tam         | Yapılandırılabilir | Yok                    | Yok       | Yok              |
| Kullanıcı/rol            | Tam         | Yok                | Yok                    | Yok       | Yok              |
| Teknik sağlık            | Tam         | Görüntüle          | Yok                    | Yok       | Sınırlı, verisiz |

Bu tablo varsayımdır; canlı roller kullanıcı bazında onaylanacaktır.

## 14. Kritik UX korumaları

- Reddetme, iptal, ters kayıt ve toplu ayar değişiminde onay diyaloğu
- Eylem sonrası kalıcı başarı/başarısızlık durumu
- Çift gönderime karşı buton kilidi + sunucu idempotency
- Kaydedilmemiş değişiklik uyarısı
- Tarih/saat/para birimi açık gösterim
- Hassas alanları kopyalama/export için ayrı yetki
