# Hub Tabanlı Tek Yönetim Paneli — Final Kontrol Planı

Son güncelleme: 17 Temmuz 2026 · Europe/Malta

Aktif dal: `design/unified-admin-panel`  
Aktif Draft PR: #107

## Nihai mimari

`/yonetim` altında tek yönetim kabuğu vardır. `AdminShell` teknik import uyumluluğu için korunur; eski panel değildir. `/yonetim/hub` ortak kabuk içindeki kayıt merkezidir ve ayrı sidebar/topbar üretmez.

## Tamamlanan kullanıcı deneyimi

- İzin bazlı akordeon navigasyon
- Aktif rota veya URL bölümünün otomatik açılması
- Liste → seçili kayıt → çalışma alanı akışı
- Uzun sayfalarda çalışma sekmeleri
- `Tam sayfa çalış / Panelleri geri aç`, `F` kısayolu ve `?gorunum=tam`
- URL tabanlı modal sistemi
- Klavye ve odak yönetimli custom dropdown/takvim
- Uzun seçim listelerinde arama
- Monogram avatarlar ve minimum veri listeleri
- Tek Hub renk/typografi sistemi

## Tamamlanan veri doğruluğu

- Randevu saatleri seçili terapistin IANA saat diliminden UTC’ye çevrilir.
- DST’de olmayan veya iki farklı ana denk gelen saatler reddedilir.
- Dashboard gün/hafta/ay sınırları `BUSINESS_TIME_ZONE` ile hesaplanır.
- Talep kuyruğu yalnızca açık statüleri gösterir.
- Danışanın en yakın randevusu artan sıra ve `take: 1` ile seçilir.
- Kayıt Merkezi son durum hareketine göre sıralanır ve gruplanır.
- Müsaitlik istisnası inline hata/başarı sonucu verir.
- Danışan oluşturma idempotent ve audit kayıtlıdır.
- Finans toplamları para birimine göre ayrıdır.
- Danışan profilinde yetki yok ile kayıt yok ayrıdır.
- Yönetim/ödeme notları operasyon akışında görünür.

## Arama ve yüksek veri hacmi

- Danışan listesi sunucu taraflı arama/filtre ve 50 kayıtlık sayfalama kullanır.
- Kayıt Merkezi danışan/talep listeleri sunucu taraflı arama ve 30 kayıtlık sayfalama kullanır.
- Randevu ve veli seçimleri uzun listelerde aranabilir.

## Eski sistemden kaldırılanlar

- Standalone `DashboardHub`
- İkinci Hub rail/sidebar
- “Klasik panele dön” bağlantısı
- Yerel ikinci tam ekran state’i
- Kullanıcı yüzeyi ve kod içindeki A/B/C hazırlık skoru
- Eski mercan/serif admin tema kaynağı
- Görünür `Dashboard`, `FINANCE`, `CLIENT`, `Public`, `BO`, `Close` etiketleri

## Rota durumu

| Rota | Durum |
| --- | --- |
| `/yonetim` | Tamamlandı |
| `/yonetim/hub` | Tamamlandı |
| `/yonetim/danisanlar` | Tamamlandı |
| `/yonetim/danisan-olustur` | Tamamlandı |
| `/yonetim/danisan-profili` | Tamamlandı |
| `/yonetim/randevular` | Tamamlandı |
| `/yonetim/musaitlik` | Tamamlandı |
| `/yonetim/odemeler` | Tamamlandı |
| `/yonetim/saglik` | Tamamlandı |

## Otomatik kalite durumu

Final Quality #452:

- Prisma validate: başarılı
- ESLint: başarılı
- TypeScript: başarılı
- Test paketi: başarılı
- Production build: başarılı
- Production smoke: başarılı
- PostgreSQL integration: başarılı

Bir Vercel Preview başarıyla tamamlandı. Sonraki Preview denemeleri platform `build-rate-limit` sınırına takıldı; uygulama build hatası değildir.

## Veri ve güvenlik etkisi

- Migration yok.
- Yeni secret yok.
- Yeni kişisel veri alanı yok.
- Randevu durum makinesi korunur.
- Consent ve rol/yetki kapıları korunur.
- Finans ledger append-only kalır.
- Klinik not veya sağlık öyküsü eklenmedi.

## Production yayın kapısı

- [x] Kod migrasyonu ve otomatik kalite kontrolleri
- [x] Veri doğruluğu regresyon testleri
- [x] Arama, filtre ve sayfalama
- [x] Tek Hub görsel kaynağı
- [ ] Kullanıcının tek Production yayınına açık onayı
- [ ] Tek squash merge ve tek Production deploy
- [ ] Production’da masaüstü/tablet/mobil görsel turu
- [ ] Read-only ve yazma akışlarının Production kontrolü
- [ ] Gerekirse tek toplu hotfix

Kullanıcı Preview ortamını görüntüleyemediği için görsel final onayı Preview’da değil, Production üzerinde yapılacaktır. PR #107 açık onay gelene kadar Draft kalır.
