# berfinakbas.com

Türkiye pazarı için tamamen Türkçe çalışan bir Dil ve Konuşma Terapisti portfolyo, randevu ve operasyon uygulaması.

## Durum

Faz 0 kapsamı ve Faz 1 teknik temel tamamlandı. Proje **Faz 2 — kimlik, yetki ve veri çekirdeği** aşamasındadır. Kapalı Google OAuth iskeleti, sunucu tarafı rol/izin matrisi, hizmet doğrulaması, danışan/veli ve consent modelleri ile tasarım yönüne uyarlanmış public ana sayfa hazırdır. Gerçek OAuth bilgileri ve PostgreSQL migration uygulaması henüz yapılmamıştır.

## Ürün özeti

Uygulama üç yüzeyden oluşur:

1. Bilgilendirici public site ve terapist portfolyosu
2. Randevu talebi ve onaylı takvim akışı
3. Danışan, veli, seans hakkı ve temel ödeme operasyonlarını yöneten admin paneli

Backend randevular için tek gerçek kaynaktır. Google Calendar yalnızca senkronize görünüm; WhatsApp ise iletişim/yönlendirme kanalıdır.

## Doküman haritası

- [Proje kapsamı](docs/PROJECT_SCOPE.md)
- [MVP ve geliştirme planı](docs/MVP_PLAN.md)
- [Sistem mimarisi](docs/SYSTEM_ARCHITECTURE.md)
- [Veri modeli taslağı](docs/DATABASE_SCHEMA_DRAFT.md)
- [Randevu kuralları](docs/BOOKING_RULES.md)
- [Danışan planları ve ödeme](docs/PAYMENT_AND_CLIENT_PLANS.md)
- [Admin panel modülleri](docs/ADMIN_PANEL_MODULES.md)
- [Public site ve içerik kuralları](docs/PUBLIC_SITE_CONTENT.md)
- [Tasarım yönü](docs/DESIGN_DIRECTION.md)
- [Güvenlik ve KVKK](docs/SECURITY_AND_KVKK.md)
- [Test kontrol listesi](docs/TESTING_CHECKLIST.md)
- [Mimari karar kaydı](docs/DECISIONS.md)

## Başlangıç ilkeleri

- Public arayüz Türkçe olacaktır.
- Sağlık ve çocuk verisi minimum düzeyde toplanacaktır.
- Randevu, ödeme ve seans hakkı kayıtları fiziksel olarak silinmeyecek; iptal veya ters kayıt oluşturulacaktır.
- Değişebilir iş kuralları hardcoded olmayacaktır.
- Ayar değişiklikleri geçmiş randevuları değiştirmeyecektir; snapshot kullanılacaktır.
- Her kritik değişiklik migration, test ve audit log değerlendirmesi gerektirir.
- Online ödeme, e-Belge ve WhatsApp Business API ilk sürümün dışında tutulur.

## Önerilen teknik temel

- Next.js + TypeScript
- PostgreSQL + Prisma
- Zod + React Hook Form
- Tailwind CSS + shadcn/ui
- Auth.js veya eşdeğer, MFA destekleyen kimlik katmanı
- Vercel veya eşdeğer uygulama barındırma
- Yönetilen PostgreSQL ve şifreli yedekleme

Sağlayıcı ve bölge seçimi, kişisel veri aktarımı ve veri işleyen sözleşmeleri değerlendirilmeden kesinleştirilmeyecektir.

## Yerel geliştirme

Gereksinimler: desteklenen bir Node.js sürümü, pnpm ve PostgreSQL.

1. Bağımlılıkları kur: `pnpm install`
2. `.env.example` dosyasını `.env` olarak kopyala ve yerel değerleri düzenle.
3. Admin girişi için Google OAuth bilgilerini, izinli e-postaları ve ilk yönetici e-postasını tanımla.
4. PostgreSQL hazır olduğunda migration’ı uygula: `pnpm db:migrate`
5. Yalnızca sentetik rol/hizmet başlangıç verisini oluştur: `pnpm db:seed`
6. Uygulamayı başlat: `pnpm dev`

Kalite komutları:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm format:check`
- `pnpm build`
- `pnpm quality` — build dışındaki kalite kontrollerini birlikte çalıştırır

## Sonraki iş

Faz 2’yi tamamlamak için gerçek PostgreSQL üzerinde migration/integration testleri çalıştırılacak, Google OAuth uygulaması tanımlanacak ve ilk yönetici rolü doğrulanacaktır. Kullanıcının sağladığı beyaz kıyafetli görsel geçici portre olarak kullanılır; orijinal yüksek çözünürlüklü dosya geldiğinde aynı alanda değiştirilecektir.

## Hukuki not

Bu depodaki uyum maddeleri teknik tasarım girdisidir; hukuki görüş değildir. Canlıya çıkıştan önce KVKK, sağlık hizmeti tanıtımı, ruhsat/yetki, saklama süreleri ve yurt dışına veri aktarımı alanlarında uzman doğrulaması zorunludur.
