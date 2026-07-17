# Hub Tabanlı Tek Yönetim Paneli Dönüşüm Planı

Son güncelleme: 17 Temmuz 2026 · Europe/Malta

Aktif dal: `design/unified-admin-panel`  
Aktif Draft PR: #107

## Nihai hedef

`/yonetim` altında yalnızca **tek bir yönetim deneyimi** bulunacaktır. Mevcut `/yonetim/hub` prototipi ayrı bir “görünüm” olmaktan çıkarılıp bütün yönetim sisteminin kalıcı kabuğu olacaktır.

Kullanıcı hiçbir işlem sırasında başka bir sidebar, başka bir üst bar, farklı renk sistemi veya “klasik panel” görmeyecektir.

Eski tasarım, bütün işlevler yeni Hub kabuğunda çalışıp doğrulanmadan kaldırılmayacaktır. Fonksiyon eşitliği sağlandıktan sonra eski kabuk, eski navigasyon, uyumluluk dışındaki gereksiz bağlantılar ve eski tasarım override dosyaları aynı final temizlik aşamasında silinecektir.

## Zorunlu kullanıcı deneyimi

### 1. Akordeon sol navigasyon

Sol ray sabit kalır. Menü grupları akordeon olarak açılır:

- **Çalışma Alanım**
  - Genel bakış
  - Bekleyen işler
  - Hızlı işlemler
- **Randevular**
  - Talep kuyruğu
  - Randevu operasyonu
  - Takvim
  - Müsaitlik
- **Danışanlar**
  - Danışan kayıtları
  - Yeni danışan
  - Veli bağlantıları
- **Finans**
  - Ödeme özeti
  - Planlar ve seans hakları
  - Taksitler / beklenen ödemeler
  - Finans hareketleri
- **Site Yönetimi**
  - Hizmetler
  - Terapist ve çalışma kuralları
  - Görüşme süreleri
  - Public iletişim ayarları
- **Sistem**
  - Entegrasyon ve outbox sağlığı
  - Teknik sağlık

Aktif rotanın grubu otomatik açılır. Masaüstünde aynı anda tek ana grup açık tutulur; kullanıcı isterse grubu kapatabilir. Mobil/tablette gruplar dikey akordeon veya yatay açılır panel davranışıyla çalışır.

### 2. Kademeli çalışma alanı

İşin yapısına göre Hub şu seviyeleri kullanır:

1. Sol akordeon navigasyon.
2. Liste gerektiren bölümlerde kayıt listesi paneli.
3. Seçili kayıt özeti / detay başlığı.
4. Form, zaman çizelgesi, finans veya operasyon işlerinin yapıldığı ana çalışma alanı.

Danışan, randevu ve finans gibi kayıt merkezlerinde liste → detay → işlem akışı korunur. Ayarlar ve sağlık gibi liste gerektirmeyen alanlar doğrudan geniş çalışma panelinde açılır.

### 3. Tam sayfa çalışma modu

Her çalışma alanının üst eylem şeridinde **“Tam sayfa çalış”** düğmesi bulunur.

Açıldığında:

- sol ray ikon seviyesine daralır,
- varsa kayıt listesi kapanır,
- ana çalışma alanı mevcut ekranın tamamını kullanır,
- üstte “Panelleri geri aç” düğmesi görünür,
- klavyede `F` kısayolu aynı davranışı sağlar,
- mümkün olduğunda görünüm `?gorunum=tam` URL parametresiyle korunur.

Bu mod yalnızca Hub ana ekranında değil; danışan profili, randevu operasyonu, müsaitlik, ödeme-plan ve site ayarlarında da çalışacaktır.

## Rota dönüşüm matrisi

| Mevcut rota | Yeni Hub içindeki rolü | Taşıma sonrası durum |
| --- | --- | --- |
| `/yonetim` | Çalışma Alanım / Genel bakış | Hub ana girişi olacak |
| `/yonetim/hub` | Eski önizleme yolu | `/yonetim` ile birleştirilecek veya uyumluluk yönlendirmesi olacak |
| `/yonetim/danisanlar` | Danışanlar / kayıt listesi | Hub liste paneline taşınacak |
| `/yonetim/danisan-olustur` | Danışanlar / yeni danışan | Hub çalışma alanında form |
| `/yonetim/danisan-profili?clientId=...` | Danışan detay çalışma alanı | Hub detay ve tam sayfa modu |
| `/yonetim/randevular` | Randevular / operasyon | Hub liste-detay akışı |
| `/yonetim/musaitlik` | Randevular / müsaitlik | Hub çalışma alanında tam düzenleme |
| `/yonetim/odemeler` | Finans / ödeme ve planlar | Hub liste-detay ve tam sayfa işlem |
| `/yonetim/saglik` | Sistem / sağlık | Hub read-only çalışma alanı |

Eski URL’ler kırılmayacaktır. Gerekli rotalar aynı URL’de yeni Hub kabuğunu kullanacak; yinelenen rotalar yalnızca uyumluluk yönlendirmesi olarak bırakılacaktır.

## Uygulama sırası

### Aşama 1 — Ortak Hub kabuğu

Durum: **Uygulama başladı.**

- `AdminShell` geçici uyumluluk katmanı olarak akordeon navigasyon ve URL tabanlı tam sayfa çalışma moduna geçirildi.
- Aktif grup otomatik açılıyor.
- `F` kısayolu ve `?gorunum=tam` görünüm durumu eklendi.
- Yeni kabuk kontrol stilleri `admin-hub-shell-controls.module.css` altında izole edildi.
- Bu aşama tamamlandığında kod `AdminHubShell` adı altında tek kalıcı kabuğa taşınacak.

**Kabul:** Bütün yönetim rotaları aynı kabuğun içinde açılabilir; henüz eski içerik bileşenleri kullanılsa bile farklı panel görünmez.

### Aşama 2 — Danışan akışının eksiksiz taşınması

- Danışan arama ve filtreleme.
- Yeni yetişkin / çocuk danışan formu.
- Çocukta zorunlu veli; mevcut veli seçimi veya yeni veli oluşturma.
- Danışan profilinde genel bilgi, veli, consent, randevu, ödeme-plan ve operasyon zaman çizelgesi.
- URL tabanlı modal ve custom dropdown/takvim davranışları.

**Kabul:** Danışan işlemleri için eski kabuğa veya ayrı tasarıma geçiş yoktur.

### Aşama 3 — Randevu ve müsaitlik

- Talep kuyruğu, takvim/liste ve seçili randevu detayları.
- Domain durum makinesinin izin verdiği onay, saat önerisi, iptal, gelmedi ve tamamlandı işlemleri.
- Haftalık müsaitlik kuralları ve istisnaların Hub içinde tam düzenlenmesi.
- Süre, buffer ve hizmet snapshot kuralları korunur.

**Kabul:** Salt-okunur Hub özeti yerine bütün ağır randevu ve müsaitlik işlemleri aynı çalışma alanında yapılır.

### Aşama 4 — Finans

- Ödeme özeti, danışan planları, seans hakları, taksitler ve beklenen ödemeler.
- Ödeme alma, plan oluşturma, düzeltme/ters kayıt ve hareket geçmişi.
- Filtreler ve danışan bağlantısı.
- Finans izinleri ve append-only ledger davranışı korunur.

**Kabul:** Finans özeti başka sayfaya göndermeden Hub içinde tam işlem yüzeyine dönüşür.

### Aşama 5 — Site yönetimi ve sistem

- Public iletişim ayarları.
- Hizmet, terapist, görüşme süresi, konum, buffer ve onay modu ayarları.
- Entegrasyon/outbox ve teknik sağlık panelleri.
- Read-only roller için güvenli özet davranışı.

**Kabul:** `/yonetim` altında uzun ve karışık ayar formu kalmaz; ilgili akordeon grubundan seçilerek geniş çalışma alanında açılır.

### Aşama 6 — Eski tasarımın tamamen kaldırılması

Bu aşama yalnızca önceki beş aşamanın fonksiyon eşitliği doğrulandıktan sonra uygulanır.

- “Klasik panel”, “Hub görünümü” ve iki sistem varmış izlenimi veren bütün metin/linkler kaldırılır.
- Eski `AdminShell` bileşeni silinir veya yalnızca yeni `AdminHubShell` için uyumluluk re-export’una çevrilir.
- Eski `*-polish.module.css`, symmetry/order/icon-placement ve gereksiz global override dosyaları kaldırılır.
- Mercan/serif eski admin kurallarının artık import edilmediği doğrulanır.
- Yinelenen navigasyon, topbar, profil ve dashboard kodu silinir.
- `/yonetim/hub` gerekiyorsa `/yonetim`e yönlendirilir.

**Kabul:** Kod aramasında eski panel metni, eski sidebar varyantı veya ikinci admin tasarım kaynağı kalmaz.

## Tasarım ve etkileşim standardı

- Zemin `#e9e7e2`, panel `#fbfaf8`, yumuşak panel `#f4f2ec`, çizgi `#e3ded7`.
- Seçili kayıt/görev lime `#dfec83`; ana işlem teal `#12897b`; kayıt başlığı şeftali `#fbe3d2 → #f6d0c0`.
- Admin fontu Inter Variable.
- Gerçek danışan/veli fotoğrafı yok; monogram avatar.
- Browser `alert/confirm` yok; erişilebilir modal veya inline confirmation.
- Native belirsiz dropdown/tarih davranışı yerine ortak custom dropdown ve custom takvim.
- Filtre, seçili kayıt, sekme, modal ve tam sayfa görünüm gerekli yerlerde URL’de korunur.
- Sahte KPI, tahmini trend veya klinik başarı skoru yok.
- “Hazırlık skoru” ürün kararı olmadığı için **Kayıt tamlığı** kontrol listesine dönüştürülür; keyfî A/B/C notu kaldırılır.
- Liste görünümünde minimum veri; ayrıntılar izinli detay yüzeyinde.

## Silme öncesi fonksiyon eşitliği kontrol listesi

Eski panel ancak aşağıdakilerin tamamı işaretlendikten sonra kaldırılır:

- [ ] Genel dashboard ve hızlı işlemler
- [ ] Danışan arama / filtre / oluşturma
- [ ] Çocuk danışan + veli bağlantısı
- [ ] Danışan detay ve operasyon geçmişi
- [ ] Randevu liste/takvim/detay/durum işlemleri
- [ ] Müsaitlik kuralı ve istisna düzenleme
- [ ] Ödeme alma, plan, taksit, seans hakkı ve ledger
- [ ] Hizmet, terapist, süre, buffer ve public iletişim ayarları
- [ ] Sistem ve entegrasyon sağlığı
- [ ] URL modal, custom dropdown ve custom takvim
- [ ] Tam sayfa çalışma modu bütün ana ekranlarda
- [ ] Rol/yetki ve read-only görünüm testi
- [ ] Masaüstü, tablet ve mobil smoke turu
- [ ] Boş, hata, uzun metin ve yüksek kayıt sayısı durumları
- [ ] Eski tasarım dosyalarının ve metinlerinin kaldırılması

## Deploy planı

Aynı `design/unified-admin-panel` dalı ve Draft PR #107 kullanılacaktır. Yeni branch veya paralel tasarım PR’ı açılmaz.

Kalan kod değişiklikleri mümkün olan en büyük toplu teslimlerde yapılır:

1. Ortak kabuğun doğrulanması ve gerekiyorsa tek düzeltme push’u.
2. Bütün operasyon ekranlarının migrasyonu için tek toplu push / Preview.
3. Eski tasarımın silinmesi + final regresyon düzeltmeleri için tek toplu push / Preview.
4. Kullanıcı onayından sonra tek squash merge / Production deploy.

Kozmetik mikro commit, yalnızca doküman durumu için commit veya gereksiz redeploy yapılmaz.

## Kalite kapıları

- Prisma validate
- ESLint
- TypeScript
- Unit testler
- Production build ve smoke
- PostgreSQL integration
- Yetki testleri
- Yetkili hesapla bütün yönetim rotalarının manuel smoke turu
- Eski tasarım kalıntısı için kod araması
- Tek production deploy öncesi final onay
