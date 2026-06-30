# Randevu Kuralları

Durum: Taslak v0.1

## 1. Temel kavramlar

- **Slot:** Kurallardan hesaplanan aday zaman aralığıdır; tek başına kayıt değildir.
- **Hold:** Kullanıcının akışı tamamlarken slotu kısa süreli tutan geçici kayıttır.
- **Talep:** Kullanıcının seçtiği slot için gönderdiği randevu isteğidir.
- **Onaylı randevu:** Yetkili onayı veya açıkça izin verilmiş otomatik kural sonrası kesinleşen kayıttır.
- **Buffer:** Randevudan önce/sonra ayrılan ve başka slot verilemeyen süredir.
- **Snapshot:** Randevu anındaki hizmet ve politika değerlerinin değişmez kopyasıdır.

## 2. Tek gerçek kaynak

Randevu durumu yalnızca uygulama backend’inde kesinleştirilir. Google Calendar, e-posta veya WhatsApp içeriği backend kaydını değiştiren bağımsız kaynak değildir.

## 3. Slot üretimi

Slotlar şu girdilerden üretilir:

- Terapist saat dilimi
- Haftalık çalışma kuralları
- Tarih bazlı istisnalar
- Hizmet süresi
- Önce/sonra buffer
- Slot increment
- Minimum ön bildirim süresi
- En ileri rezervasyon günü
- Günlük kapasite
- Mevcut aktif hold ve randevular

Public slot okuma sonucu kesin rezervasyon değildir. Yanıt yalnızca aday UTC başlangıç/bitiş saatlerini taşır, cache edilmez ve hold oluşturma transaction’ında aynı kurallarla yeniden doğrulanır.

Bir slot, randevu süresinin yanında buffer aralıklarıyla da çakışmamalıdır.

## 4. Preset ve özel değer

Admin arayüzü hazır seçenekler gösterebilir; örneğin 15, 30, 45, 60 dakika. “Özel” seçeneği ile 52 dakika gibi bir değer girilebilir.

Her alan için:

- Birim açıkça gösterilir.
- Minimum/maksimum sınır vardır.
- Toplam blok önizlenir.
- Etkilenecek gelecek slot sayısı gösterilir.
- Değişiklik nedeni alınır.
- Geçmiş değer audit edilir.

## 5. Hold kuralı

- Hold süresi ayarlanabilir, güvenli varsayılan önerisi 5–10 dakikadır.
- Hold süresi public istemci veya route girdisinden alınmaz; yalnızca doğrulanmış sunucu ayarı kullanılır. Onaylı değer tanımlı değilse hold yazımı veritabanına erişmeden fail-closed durur.
- Hold tek kullanımlık token/hash ile ilişkilidir.
- Süresi dolan hold otomatik `expired` olur.
- Hold yalnızca uzmanın IANA saat diliminde aktif haftalık kural ve gün istisnalarından yeniden üretilen bir slot başlangıcı için oluşturulur; istemcinin gönderdiği UTC değer doğrudan kabul edilmez.
- Hizmet süresi/buffer, minimum bildirim, maksimum ileri rezervasyon ve günlük kapasite hold transaction’ında tekrar uygulanır; kapasite süresi geçmemiş aktif hold ve randevu tahsislerini birlikte sayar.
- Aynı gün için farklı slot artışları veya çelişen istisna tipleri otomatik çözümlenmez; yapılandırma düzeltilene kadar fail-closed reddedilir.
- Aynı slotta iki aktif hold veya aktif randevu oluşmaması veritabanı/locking ile garanti edilir.
- Public hold API sunucu bayrağıyla varsayılan kapalıdır; açıldığında yalnızca uzman, hizmet ve UTC slot başlangıcını kabul eder. Hold süresi, audit correlation ID veya ek kişisel/klinik alan istemciden alınmaz.
- Ham holder token yalnızca `no-store` oluşturma yanıtında döner; URL, log veya audit özetine yazılmaz.
- Kullanıcı formu geç gönderirse slot yeniden kontrol edilir; otomatik olarak başka saat verilmez.

## 6. Talep oluşturma

Gerekli minimum alanlar:

- Hizmet
- Seçilen slot
- Danışan yetişkin/çocuk ayrımı
- İsim
- Güvenli iletişim kanalı
- Çocuksa veli/yasal temsilci bilgisi
- Gerekli bilgilendirme/onay kayıtları

Randevu formu ayrıntılı sağlık öyküsü, tanı, rapor veya serbest klinik açıklama istemez. Kısa not alanı varsa sağlık verisi paylaşılmaması yönünde açık uyarı ve karakter sınırı bulunur.

## 7. Durum makinesi

Önerilen geçişler:

```text
requested -> pending_review
pending_review -> confirmed | rejected | reschedule_proposed
reschedule_proposed -> confirmed | rejected | cancelled_by_client
confirmed -> completed | no_show | cancelled_by_client | cancelled_by_practitioner | reschedule_proposed
```

- Terminal durumdan geriye sessiz güncelleme yapılmaz.
- Hatalı geçiş domain katmanında reddedilir.
- Her geçiş appointment_status_logs ve audit kaydı üretir.
- Manuel override yalnızca yetkili rol, gerekçe ve audit ile yapılabilir.

## 8. Onay

İlk sürümde varsayılan `manual` onaydır.

Admin onay sırasında:

- Slotun hâlâ uygun olduğunu
- Danışan/veli bilgilerinin yeterli olduğunu
- Gerekli onayların bulunduğunu
- Hizmet ve konumun doğru olduğunu

görür. Onay transaction’ı çakışmayı yeniden kontrol eder.

## 9. Yeniden planlama

- Eski randevu yeni randevu kesinleşmeden silinmez.
- Yeni slot için hold/çakışma kontrolü yapılır.
- İlişki `rescheduled_from_id` veya durum loguyla izlenir.
- Calendar ve bildirimler transaction sonrasında outbox ile güncellenir.

## 10. İptal ve no-show

Kesin süre ve hak düşme politikaları açık ürün kararıdır.

Desteklenecek seçenekler:

- Zamanında danışan iptali: hak düşmez
- Geç iptal: hak düşer | düşmez | admin kararı
- No-show: hak düşer | düşmez | admin kararı
- Terapist iptali: hak düşmez
- Yeniden planlama: hak düşmez

Hak hareketi appointment durumuyla aynı transaction’da veya idempotent domain event’iyle üretilir. Aynı durum olayının iki kez hak düşürmesi engellenir.

## 11. Ayar snapshot’ı

Randevu en az şu değerleri snapshot olarak taşır:

- Hizmet adı
- Süre
- Önce/sonra buffer
- Konum tipi
- İptal/yeniden planlama politikası sürümü
- Onay modu

Ayar değişikliği mevcut randevunun süre veya zamanını otomatik değiştirmez. Gelecek randevulara toplu uygulama ayrı, önizlemeli ve onaylı işlem olmalıdır.

## 12. Çakışma ve eşzamanlılık

Zorunlu senaryolar:

- İki kullanıcının aynı slota aynı anda gönderim yapması
- Admin onayı ile public talebin aynı anda çakışması
- Hold süresi dolarken gönderim yapılması
- Buffer değişikliğinin açık taleplere etkisi
- Yeniden planlamada eski ve yeni slotun geçici durumu

Çakışma önleme yalnızca application-level sorguya dayanamaz. PostgreSQL constraint/lock yaklaşımı test edilerek uygulanır.

## 13. Bildirimler

Her durum geçişi bildirim gerektirmez. Şablon matrisi tanımlanır:

- Talep alındı
- Randevu onaylandı
- Alternatif saat önerildi
- Randevu reddedildi
- Randevu değiştirildi
- Randevu iptal edildi
- Hatırlatma

Bildirim gönderilmemesi durum değişikliğini geri almaz; admin retry durumunu görür.

## 14. Referans kodu

- Tahmin edilmesi zor
- Telefon/e-posta desteğinde kullanılabilir
- İç veritabanı ID’sini açığa çıkarmaz
- Tek başına randevu detayına erişim sağlamaz

## 15. Açık kararlar

- Varsayılan hold süresi
- Aynı tarihte `closed`, `custom_hours` ve `blocked` istisnalarının öncelik sırası
- Hizmet bazında manual/automatic onay
- Minimum/maximum süre ve buffer
- İptal ve no-show politikaları
- Günlük kapasite
- Admin tarafından walk-in/telefon randevusu oluşturma akışı
- Çalışma saatleri ve resmi tatil yaklaşımı

Consent belge türleri, sürüm seçimi, çocuk/veli aşamaları ve yaş verisi minimizasyonu ADR-017 ile kapatılmıştır. Teknik politika `docs/CONSENT_AND_GUARDIAN_POLICY.md` dosyasındadır; nihai metinler ve yetki doğrulama prosedürü hukuki yayın kapısıdır.
