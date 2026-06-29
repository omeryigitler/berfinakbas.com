# Danışan Planları ve Ödeme Operasyonları

Durum: Taslak v0.1

## 1. Amaç

Bu modül resmi muhasebe programı değildir. Amaç, terapist ve yetkili ekibin şu sorulara güvenilir cevap vermesidir:

- Danışanın hangi planı aktif?
- Kaç seans hakkı kaldı?
- Ne kadar tahakkuk etti?
- Ne kadar ödeme alındı?
- Hangi ödeme ne zaman bekleniyor?
- Geciken veya kısmi ödeme var mı?
- Fatura/makbuz durumu nedir?

## 2. MVP sınırı

MVP’de:

- Hazır ve özel plan
- Seans hakkı hareketleri
- Manuel ödeme
- Taksit/vade
- Kısmi ödeme
- Geciken ödeme filtresi
- Fatura/makbuz durum takibi
- CSV export
- Ters kayıt/düzeltme

bulunur.

MVP dışında:

- Online kart tahsilatı
- Ödeme linki üretimi
- Otomatik banka mutabakatı
- e-Fatura/e-Arşiv oluşturma
- Resmi muhasebe fişi
- Vergi hesaplama motoru

## 3. Plan modeli

Plan iki şekilde oluşturulur:

### Hazır plan

Şablondan seçilir; danışana atanırken değerler snapshot olarak kopyalanır.

### Özel plan

Yetkili kullanıcı aşağıdakileri belirler:

- Plan adı
- Seans sayısı
- Seans süresi
- Toplam tutar ve para birimi
- Geçerlilik başlangıç/bitiş
- Ödeme/taksit planı
- Kullanılabileceği hizmetler

Public sitede görünürlük varsayılan olarak kapalıdır.

## 4. Seans hakkı

Kalan hak mutable sayaçtan değil, hareket toplamından hesaplanır.

Hareketler:

- `grant`: planla hak tanımlama
- `consume`: tamamlanan/no-show randevusunda hak kullanma
- `restore`: iptal/düzeltme nedeniyle hakkı geri verme
- `expire`: geçerlilik sonunda hakkı kapatma
- `correction`: yetkili düzeltme

Her hareket:

- Planı
- Varsa randevuyu
- Miktarı
- Sebep kodunu
- İşlemi yapanı
- Zamanı
- Varsa ters çevirdiği hareketi

taşır.

Aynı appointment olayı aynı plan için iki kez `consume` üretemez.

## 5. Tahakkuk ve ödeme

Finans hareketleri append-only ledger’da tutulur:

- Plan oluşturma/ücret tahakkuku: pozitif borç hareketi
- Ödeme: borcu azaltan hareket
- İade: ödeme etkisini tersine çeviren hareket
- İndirim/özel düzeltme: yalnızca iç operasyon, yetki ve gerekçeyle
- Hatalı kayıt: önceki hareketi referanslayan ters kayıt

Bakiye:

```text
Toplam tahakkuk - geçerli ödemeler - geçerli mahsuplar + iadeler
```

mantığından üretilir. Formül ve işaret yönü kodda tek bir domain fonksiyonunda tutulur.

## 6. Ödeme kaydı

Zorunlu alanlar:

- Danışan
- Tutar
- Para birimi
- Ödeme tarihi
- Ödeme yöntemi
- Kaydı alan kullanıcı

Opsiyonel ilişki:

- Danışan planı
- Taksit
- Randevu
- Harici referans
- Kısa açıklama

Ödeme yöntemi enum/katalog olarak yönetilir. Serbest metin raporlamanın kaynağı olmaz.

## 7. Taksit ve vade

- Taksitlerin toplamı plan toplamına eşit olmalıdır; açıkça kaydedilmiş tolerans dışında fark kabul edilmez.
- Kısmi ödeme taksidin `paid_amount` özetini etkiler; gerçek kaynak payment/ledger kayıtlarıdır.
- Vade durumu zaman kontrollü job ile `overdue` olarak işaretlenebilir veya sorguda hesaplanabilir.
- Sistem “bugün”, “bu hafta”, tarih aralığı ve geciken filtrelerini destekler.

## 8. Düzeltme ve iade

Yanlış ödeme düzenlenmez veya silinmez:

1. Orijinal hareket seçilir.
2. Düzeltme/iade tipi seçilir.
3. Gerekçe zorunlu girilir.
4. Yetki kontrol edilir.
5. Ters hareket ve audit aynı transaction’da oluşturulur.

Ters çevrilmiş hareket tekrar ters çevrilmeye çalışılırsa sistem durumu açıkça göstermeli ve duplicate işlemi engellemelidir.

## 9. Fatura/makbuz durumu

MVP yalnızca şu durumu izler:

- Gerekli değil
- Bekliyor
- Kesildi
- Muhasebeye gönderildi
- İptal edildi

Belge numarası ve linki saklanabilir; dosya yükleme ilk sürümde kapalı tutulabilir. Resmi belgenin doğruluğu sistem tarafından garanti edilmez.

## 10. Yetki

- Super admin: tüm finans operasyonları
- Terapist: yapılandırmaya göre özet veya tam erişim
- Asistan: ödeme kaydı ekleme yetkisi ayrı verilir; ters kayıt varsayılan kapalıdır
- Finance: ödeme/rapor/fatura durumu; klinik veri erişimi yoktur
- Developer: üretim finans ve danışan verisine varsayılan erişim yoktur

Tutar export’u ayrı izin gerektirir ve audit edilir.

## 11. Public içerik sınırı

Danışana özel ücret/plan bilgileri yalnızca yetkili admin operasyonunda tutulur. Yurt içi public sitede ücret, indirim, kampanya veya promosyon yayımlanmaz. Güncel düzenleme ve hukuk onayı olmadan bu kural gevşetilemez.

## 12. Raporlar

MVP:

- Bugün/hafta/ay beklenen ödeme
- Geciken ödeme
- Tarih aralığında alınan ödeme
- Danışan ve plan bazlı bakiye
- Ödeme yöntemine göre toplam
- Kalan seans hakkı
- CSV export

Raporlar silinmiş gibi görünen ters kayıtları doğru netleştirmeli ve zaman dilimi/para birimi açık olmalıdır.

## 13. Test açısından kritik durumlar

- Aynı payment request’in tekrar gönderilmesi
- Kısmi ödemenin iki takside dağıtılması
- Fazla ödeme
- Taksit toplamının plan toplamıyla uyuşmaması
- Ödeme ve iadenin aynı anda işlenmesi
- Tamamlanan randevunun iki kez hak düşürmesi
- No-show kuralının sonradan değişmesi
- Plan iptalinde kullanılmamış haklar
- Süresi dolan plan
- Kuruş yuvarlaması

## 14. Açık kararlar

- MVP’de desteklenecek ödeme yöntemleri
- Özel plan/ücret oluşturma yetkileri
- Fazla ödeme politikası
- Kısmi iade
- Plan geçerlilik/uzatma politikası
- Fatura dosyası saklanacak mı?
- Muhasebeci export formatı
