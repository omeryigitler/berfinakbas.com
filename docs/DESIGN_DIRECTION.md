# Tasarım Yönü

Durum: Uygulanan taslak v0.1  
Kaynak: ChatGPT projesindeki **Site Tasarımı İsteği** konuşması ve 11 görsel referans

## Ana kararlar

- Sıcak, sakin ve profesyonel bir genel hava
- Kırık beyaz zemin, mercan vurgu, koyu kahverengi metin; adaçayı ve kum yardımcı renkleri
- Başlıklarda klasik serif, arayüz ve gövde metinlerinde sade sans-serif
- “Hakkımda” bölümü ikincil değil, ana sayfanın güçlü odaklarından biri
- Sağ üst hero alanında sıcak görüşme mekânını temsil eden tutarlı görsel
- Randevu ve takip yüzeylerinde hafif dijital katman; klinik ya da soğuk dashboard estetiği yok
- Gerçek kişi olarak yalnızca Berfin’in onaylı portresi kullanılabilir
- Çocuk, danışan, aile ve diğer kişi temsilleri gerçek fotoğraf değil, illüstrasyon olmalıdır
- Randevu CTA’sı “kesin rezervasyon” izlenimi vermez; talep ve onay sürecini açıklar

## İçerik korumaları

Görsel taslaklardaki aşağıdaki unsurlar doğrulanmadan kullanılmaz:

- Danışan sayısı, başarı oranı veya benzeri metrikler
- Eğitim kurumu, sertifika, deneyim yılı ve uzmanlık iddiası
- Hasta/danışan yorumu
- Sonuç garantisi çağrıştıran grafik veya metin
- Fiyat, indirim ve promosyon

## Portre notu

Kullanıcının seçtiği beyaz kıyafetli görsel sosyal medya ekran görüntüsüdür ve geçici portre olarak kullanılır. Dosyanın kendisi değiştirilmez; CSS çerçevesi yalnızca Berfin’in bulunduğu bölgeyi gösterir. Orijinal, yüksek çözünürlüklü ve yayın izni doğrulanmış portre geldiğinde aynı alanın yapısı korunarak değiştirilir.

## Tasarım tokenları

| Token      | Değer     | Kullanım                  |
| ---------- | --------- | ------------------------- |
| Paper      | `#fffaf4` | Ana zemin                 |
| Ink        | `#45352f` | Başlık ve ana metin       |
| Coral      | `#d96f4d` | CTA ve vurgu              |
| Coral dark | `#b95336` | Hover ve koyu vurgu       |
| Peach      | `#f3c3a6` | Sıcak illüstrasyon yüzeyi |
| Sage       | `#b9c5ae` | Sakin ikincil vurgu       |
| Sand       | `#dfc8aa` | Mekân ve kart yüzeyi      |

Hedef erişilebilirlik seviyesi WCAG 2.2 AA’dır. Renk tek başına durum iletmez; odak görünürdür ve hareket azaltma tercihi desteklenir.
