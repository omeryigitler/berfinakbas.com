# Birleşik Yönetim Paneli Tasarım Planı

Son güncelleme: 17 Temmuz 2026 · Europe/Malta

Aktif dal: `design/unified-admin-panel`  
Aktif Draft PR: #107

## Amaç

`/yonetim` altındaki klasik operasyon sayfaları ile `/yonetim/hub` kayıt merkezini iki ayrı ürün gibi göstermeden tek yönetim sistemi altında birleştirmek.

Bu çalışma veri modeli veya iş kurallarını yeniden yazmaz. Mevcut danışan, veli, consent, randevu, müsaitlik, finans ve sağlık işlemlerini aynı görsel sistem ve aynı navigasyon altında toplar.

## Neden gerekliydi?

- Klasik `AdminShell` mercan/serif/kart ağırlıklı bir dil kullanırken Hub sıcak gri, lime, teal ve Inter kullanıyordu.
- Aynı kullanıcı bir işlem boyunca iki ayrı sidebar, iki ayrı üst bar ve farklı kart/form davranışları görüyordu.
- Eski dashboard tasarımı zaman içinde birden fazla CSS override dosyasıyla yamalanmıştı.
- “Hub görünümü” ayrı bir deneyim gibi adlandırıldığı için panelin hedef mimarisi anlaşılmıyordu.
- AGENTS, HANDOFF ve roadmap belgeleri PR #106 sonrası güncel değildi.

## Hedef bilgi mimarisi

| Rota | Rolü |
| --- | --- |
| `/yonetim` | Operasyon özeti, hızlı işlemler ve deploy gerektirmeyen ayarlar |
| `/yonetim/hub` | Talep/danışan kayıt seçimi, inceleme ve durum geçişleri |
| `/yonetim/danisanlar` | Arama, filtreleme ve danışan listesi |
| `/yonetim/danisan-profili?clientId=...` | Danışan, veli, consent, randevu ve finans bağlamı |
| `/yonetim/randevular` | Randevu operasyonu ve ağır düzenleme akışları |
| `/yonetim/musaitlik` | Haftalık kurallar ve istisnalar |
| `/yonetim/odemeler` | Plan, taksit, ödeme ve ledger hareketleri |
| `/yonetim/saglik` | Read-only entegrasyon ve sistem sağlığı |

## Tasarım sistemi

### Renkler

- Çalışma zemini: `#e9e7e2`
- Ana panel: `#fbfaf8`
- Yumuşak panel: `#f4f2ec`
- Kenar: `#e3ded7`
- Mürekkep: `#201c19`
- Seçili kayıt / görev: `#dfec83`
- Ana işlem / olumlu durum: `#12897b`
- Başlık vurgusu: `#fbe3d2 → #f6d0c0`

### Tipografi

- Admin yüzeyinde self-host `Inter Variable`.
- Public sitenin serif başlık kimliği admin veri tablolarına ve operasyon kartlarına taşınmaz.
- Başlık hiyerarşisi sıkı; dekoratif dev başlık yerine görev ve veri önceliği kullanılır.

### Bileşen davranışı

- Sidebar, topbar, profil pili, durum çipi, kart, liste satırı, empty state ve form alanları ortak görünür.
- Kritik eylemler browser `alert/confirm` yerine inline confirmation veya erişilebilir modal kullanır.
- Tarih alanları ortak custom takvim; seçenek alanları ortak custom dropdown kullanır.
- Filtreler, seçili kayıtlar ve modallar gerektiğinde URL query ile korunur.
- Gerçek danışan/veli fotoğrafı yoktur; monogram avatar kullanılır.
- Sahte KPI, tahmini trend veya doğrulanmamış başarı oranı gösterilmez.
- Hub’daki puan klinik veya öncelik skoru değildir; yalnızca açık alan kontrolü olarak “Kayıt tamlığı” şeklinde ele alınabilir.

## Uygulama fazları

### Faz A — ortak kabuk ve görsel sistem

Durum: **Bu PR kapsamında uygulandı.**

- `AdminShell` terminolojisi “Çalışma alanı / Kayıt merkezi” olarak güncellendi.
- Danışan, randevu, müsaitlik, ödeme ve sağlık menüsü sadeleştirildi.
- Sidebar, topbar, arama, profil alanı ve public site bağlantısı tek sistemde toplandı.
- Klasik sayfalara Hub tokenları uygulandı.
- Kart, panel, liste, form, hızlı işlem ve responsive görünüm birleştirildi.

### Faz B — preview regresyon turu

Durum: **CI ve Preview bekleniyor.**

Kontrol edilecek rotalar:

1. `/yonetim`
2. `/yonetim/hub`
3. `/yonetim/danisanlar`
4. `/yonetim/danisan-olustur`
5. `/yonetim/danisan-profili?clientId=...`
6. `/yonetim/randevular`
7. `/yonetim/musaitlik`
8. `/yonetim/odemeler`
9. `/yonetim/saglik`

Her rotada:

- masaüstü / tablet / mobil taşma,
- sticky topbar,
- sidebar aktif durumları,
- URL modalları,
- custom dropdown ve takvim,
- klavye odağı,
- salt-okunur rol davranışı,
- uzun ad/e-posta/tutar metinleri,
- boş ve hata durumları

kontrol edilir.

### Faz C — teknik temizlik

Bu PR’ın preview turunda zorunlu bir regresyon görülmezse ayrı deploy üretmemek için sonraki milestone’a bırakılır:

- Eski `*-polish.module.css` ve lokal override dosyalarının ortak bileşenlere kademeli taşınması.
- Unicode navigasyon ikonlarının ortak SVG ikon setine geçirilmesi.
- Gerçek çoklu-entity arama API’si ve komut menüsü.
- Hub listesinin server-side arama/sayfalama ile genişletilmesi.
- “Kayıt tamlığı” ağırlıklarının kaldırılması veya açık ürün kararına bağlanması.

## Veri ve güvenlik etkisi

- Migration yok.
- Yeni kişisel veri alanı yok.
- Yetki kataloğu değişmiyor.
- API ve durum makinesi değişmiyor.
- Finans/randevu/consent yazma davranışı değişmiyor.
- Tasarım yüzeyleri liste görünümünde minimum veri ilkesini korur.

## Teslim kapıları

- `pnpm quality`
- `pnpm build`
- GitHub Quality workflow
- Vercel Preview
- Randevu çekirdeğine dokunulursa PostgreSQL integration; bu PR’ın mevcut kapsamı randevu çekirdeğini değiştirmiyor.
- Yetkili hesapla yönetim rotalarının manuel smoke kontrolü
- Tek squash merge ve tek production deploy
