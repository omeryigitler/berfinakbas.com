# Consent ve Çocuk/Veli Politikası

Durum: Kabul edildi — teknik ürün kararı v1
Kabul tarihi: 30 Haziran 2026
Not: Bu belge hukuki görüş veya nihai hukuki metin değildir. Belge içerikleri, işleme şartları ve veli yetkisi doğrulama prosedürü canlıya çıkıştan önce hukukçu tarafından onaylanmalıdır.

## 1. Temel ayrım

Aydınlatma, açık rıza ve randevu koşulları tek bir checkbox veya tek bir belge olarak birleştirilmez.

- `PRIVACY_NOTICE`: Kişisel veri işlemeye başlamadan önce gösterilen aydınlatma metnidir. Kullanıcıdan yalnızca metni gördüğüne/bilgi edindiğine ilişkin ayrı bir acknowledgement alınır; bu kayıt açık rıza değildir.
- `BOOKING_TERMS`: Randevunun talep olduğu, admin onayıyla kesinleştiği ve temel operasyon kurallarının görüldüğüne ilişkin ayrı acknowledgement kaydıdır.
- `EXPLICIT_CONSENT`: Yalnızca onaylı veri envanterinde ilgili işleme faaliyeti gerçekten açık rıza şartına dayanıyorsa, belirli konu için ayrı ve özgür iradeli beyan olarak istenir.
- Pazarlama/tanıtım rızası MVP randevu akışına eklenmez ve sağlık/randevu hizmetinin ön koşulu yapılmaz.

## 2. Belge sürümü seçimi

- Her belge türünde `captured_at` anında yürürlükte olan, `effective_from <= captured_at` ve `retired_at` değeri boş veya gelecekte olan tek sürüm seçilir.
- Kayıt belge ID’si, türü, sürümü ve içerik hash’iyle değişmez biçimde ilişkilendirilir.
- Yeni belge sürümü geçmiş kaydı değiştirmez. Yeni talepler güncel sürümü kullanır.
- Aynı tür için aynı anda birden fazla yürürlükte sürüm bulunması yapılandırma hatasıdır ve talep akışı fail-closed durur.

## 3. Yetişkin danışan

- Danışan `ADULT` olarak seçildiyse veli/temsilci alanı kabul edilmez.
- Tam doğum tarihi veya kimlik numarası randevu formunda toplanmaz.
- `PRIVACY_NOTICE` ve `BOOKING_TERMS` acknowledgement kayıtları yetişkin danışan adına oluşturulur.
- Yapılandırılmış bir `EXPLICIT_CONSENT` gerekiyorsa danışan kendi adına verir.

## 4. Çocuk danışan ve veli

- Danışan `CHILD` olarak seçildiyse ad, güvenli iletişim bilgisi ve ilişki türü bulunan bir veli/yasal temsilci zorunludur.
- Public talep aşamasında temsil ilişkisi `declared` kabul edilir; kimlik belgesi, velayet belgesi, kimlik numarası, belge fotoğrafı veya tam doğum tarihi yüklenmez.
- Talep yalnızca `REQUESTED`/`PENDING_REVIEW` durumuna ilerleyebilir. Bu aşama kesin randevu veya doğrulanmış temsil yetkisi anlamına gelmez.
- Admin `CONFIRMED` geçişinden önce aynı çocuk–veli ilişkisinde `authority_verified_at` bulunmalıdır.
- Doğrulama kanalı ve sağlık verisi içermeyen sınırlı reason code/açıklama kaydedilir; ham belge kopyası saklanmaz.
- Birden fazla veli desteklenir. Yetki/velayet uyuşmazlığı işaretlenirse erişim ve onay dondurulur, otomatik karar verilmez.

## 5. Consent öznesi ve beyan veren kişi

Her kayıt iki ayrı kavramı taşır:

- `subject`: Verisi hakkında kayıt oluşturulan danışan veya veli.
- `granted_by_guardian`: Çocuk danışan adına acknowledgement veya açık rıza beyanını veren doğrulanabilir veli/temsilci.

Çocuk adına verilen kayıtta subject çocuk danışandır; veli ayrı grantor alanında tutulur. Veli, aynı zamanda kendi verileri için ayrı bir subject olabilir. Bu iki rol tek `guardian_id` alanında birleştirilmez.

## 6. Minimum teknik kanıt

Kayıt en az şunları içerir:

- Belge ID’si, türü, sürümü ve içerik hash’i
- Subject danışan/veli ID’si
- Çocuk adına beyan varsa grantor veli ID’si
- UTC zaman damgası ve capture channel
- Correlation ID veya geri izlenebilir minimum işlem kanıtı
- Acknowledgement veya explicit-consent ayrımı

Ham form payload’ı, tam belge metni, kimlik belgesi, gereksiz IP adresi veya sağlık açıklaması kanıta kopyalanmaz.

## 7. Geri çekme ve belge değişikliği

- Açık rıza geri çekilebilir; geri çekme geçmiş kaydı silmez ve gelecekte o rızaya dayalı yeni işlemi durdurur.
- Aydınlatma acknowledgement kaydı “geri çekilmez”; hangi sürümün ne zaman gösterildiğinin kanıtıdır.
- Rıza geri çekilmesi mevcut randevuyu sessizce silmez veya iptal etmez; hukuki/operasyonel etki manuel incelemeye alınır.
- Yeni sürüm, yalnızca ürün/hukuk kuralı açıkça gerektiriyorsa mevcut kullanıcı için yeniden acknowledgement/consent ister.

## 8. Randevu kapıları

Talep oluşturma kapısı:

- Yürürlükte `PRIVACY_NOTICE` acknowledgement
- Yürürlükte `BOOKING_TERMS` acknowledgement
- Yapılandırılmışsa gerekli ayrı `EXPLICIT_CONSENT`
- Çocukta beyan veren veli kaydı ve çocuk–veli ilişkisi

Admin onay kapısı bunlara ek olarak:

- Çocukta aynı ilişkinin `authority_verified_at` alanı
- Yetki uyuşmazlığı/dondurma bulunmaması
- Consent/acknowledgement kayıtlarının subject ve grantor tutarlılığı

Eksik veya çelişkili durumda sistem fail-closed davranır; randevu onaylanmaz.

## 9. Hukuki yayın kapıları

- Veri sorumlusu ve veri envanteri
- Her işleme faaliyeti için hukuki sebep
- Nihai aydınlatma ve gerekiyorsa açık rıza metinleri
- Veli/yasal temsilci yetkisi doğrulama prosedürü
- Saklama ve imha süreleri
- Sağlayıcı/yurt dışı aktarım değerlendirmesi

Bu başlıklar hukukçu tarafından onaylanmadan public randevu gönderimi canlıya açılmaz.

## 10. Resmî dayanaklar

- [KVKK — Aydınlatma ve açık rıza metinlerinin ayrı düzenlenmesine ilişkin 18.02.2026 tarihli İlke Kararı](https://www.kvkk.gov.tr/Icerik/8710/veri-sorumlulari-tarafindan-acik-riza-ve-aydinlatma-metinlerinin-ayri-ayri-duzenlenmesi-gerektigi-hakkinda-kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-ilke-kararina-iliskin-kamuoyu-duyurusu)
- [KVKK — Aydınlatma Yükümlülüğü](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-)
- [KVKK — Açık Rıza Alırken Dikkat Edilecek Hususlar](https://www.kvkk.gov.tr/Icerik/2037/Acik-Riza-Alirken-Dikkat-Edilecek-Hususlar)
- [KVKK — Sağlık hizmetinin tanıtım rızası şartına bağlanmasına ilişkin 2023/692 sayılı Karar Özeti](https://www.kvkk.gov.tr/Icerik/7691/2023-692)
