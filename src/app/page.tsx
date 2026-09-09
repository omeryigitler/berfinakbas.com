import Image from "next/image";
import Link from "next/link";

import ManagedContactFab from "@/components/managed-contact-fab";
import { BrandMark, SiteFooter } from "@/components/public-shell";

import styles from "./handwritten-home.module.css";

type ServiceIcon = "fluency" | "plan" | "speech" | "voice" | "adult";

type ServiceCard = {
  annotation: string;
  icon: ServiceIcon;
  note: string;
  rotation: "left" | "leftSoft" | "right" | "rightSoft" | "straight";
  title: string;
  tone: "blue" | "charcoal" | "cream" | "peach" | "sage";
};

const serviceCards: ServiceCard[] = [
  {
    annotation: "erken fark etme",
    icon: "speech",
    note: "Gelişimsel ihtiyaçları anlamaya yönelik değerlendirme ve aile ile iş birliği.",
    rotation: "left",
    title: "Gecikmiş Konuşma",
    tone: "peach",
  },
  {
    annotation: "akıcılık gelişimi",
    icon: "fluency",
    note: "Konuşma akıcılığını kişinin günlük iletişim ihtiyaçlarıyla birlikte ele alan süreç.",
    rotation: "leftSoft",
    title: "Akıcı Konuşma",
    tone: "sage",
  },
  {
    annotation: "değerlendir · planla",
    icon: "plan",
    note: "İlk görüşmeden sonra ihtiyaca göre şekillenen açık ve takip edilebilir yol haritası.",
    rotation: "straight",
    title: "Konuşma Sesi",
    tone: "cream",
  },
  {
    annotation: "iletişim hedefleri",
    icon: "adult",
    note: "Yetişkinlerin iletişim hedefleri ve yaşam düzeni dikkate alınarak planlanan görüşmeler.",
    rotation: "rightSoft",
    title: "Yetişkin Terapisi",
    tone: "blue",
  },
  {
    annotation: "ses sağlığı",
    icon: "voice",
    note: "Ses kullanımını ve iletişim gereksinimlerini anlamaya odaklanan profesyonel görüşme alanı.",
    rotation: "right",
    title: "Ses Terapisi",
    tone: "charcoal",
  },
];

const principles = [
  {
    number: "01",
    title: "Önce dinlemek",
    text: "İlk temasın aceleye gelmediği, ihtiyacın sakin ve anlaşılır biçimde ele alındığı bir görüşme alanı.",
  },
  {
    number: "02",
    title: "Sonra planlamak",
    text: "Değerlendirme sonrasında hedeflerin, görüşme biçiminin ve sonraki adımların açıkça konuşulması.",
  },
  {
    number: "03",
    title: "Birlikte takip etmek",
    text: "Çocuk, ergen ve yetişkin süreçlerinde kişiye ve gerektiğinde aileye alan açan iş birliği yaklaşımı.",
  },
];

function DoodleIcon({ type }: { type: ServiceIcon }) {
  if (type === "speech") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 72">
        <path d="M18 18c0-7 7-12 16-12h23c10 0 17 6 17 14v13c0 8-7 14-17 14H42L26 59l4-13c-7-2-12-7-12-13V18Z" />
        <path d="M36 25h21M36 33h14" />
        <circle cx="30" cy="26" r="2" />
        <path d="m62 56 7-6 8 8M68 50l5-7 7 7" />
      </svg>
    );
  }

  if (type === "fluency") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 72">
        <path d="M8 52c10-28 18 22 29-10S54 64 65 30s16 10 23-6" />
        <path d="M12 17h16l5-8 8 17 7-12 8 10h26" />
        <path d="M13 62c15-5 27-4 39-1 12 4 23 4 34-2" />
      </svg>
    );
  }

  if (type === "plan") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 72">
        <rect x="20" y="14" width="55" height="45" rx="3" />
        <path d="M20 27h55M33 8v12M62 8v12M31 37h8M46 37h8M61 37h7M31 47h8M46 47h8M61 47h7" />
        <path d="m8 22 8 5-7 5M80 52l7 5-8 5" />
      </svg>
    );
  }

  if (type === "adult") {
    return (
      <svg aria-hidden="true" viewBox="0 0 96 72">
        <circle cx="34" cy="23" r="10" />
        <path d="M16 58c2-15 9-23 18-23s16 8 18 23" />
        <circle cx="68" cy="29" r="8" />
        <path d="M56 58c1-12 6-19 13-19 6 0 11 7 12 19" />
        <path d="M43 21c8-6 13-6 18-3M47 27c5 0 9 1 13 5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 96 72">
      <rect x="40" y="10" width="17" height="35" rx="8" />
      <path d="M32 33c0 11 7 18 17 18s17-7 17-18M49 51v13M38 64h22" />
      <path d="M11 43c8-18 12 18 20-2M69 41c7-16 10 15 17-4" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className={styles.page} id="ana-icerik">
      <section className={styles.hero} aria-labelledby="home-title">
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="Berfin Akbaş ana sayfa">
            <BrandMark />
          </Link>

          <nav className={styles.nav} aria-label="Ana menü">
            <Link href="/hizmetler">Hizmetler</Link>
            <span aria-hidden="true">·</span>
            <Link href="/hakkimda">Hakkımda</Link>
            <span aria-hidden="true">·</span>
            <Link href="/surec">Terapi yaklaşımı</Link>
            <span aria-hidden="true">·</span>
            <Link href="/iletisim">İletişim</Link>
          </nav>

          <div className={styles.headerActions}>
            <span className={styles.onlineNote}>online &amp; yüz yüze</span>
            <Link className={styles.bookingPill} href="/randevu">
              <span aria-hidden="true">◌</span>
              Randevu talebi
            </Link>
          </div>
        </header>

        <div className={styles.heroCopy}>
          <p className={styles.handKicker}>Dil ve Konuşma Terapisi</p>
          <h1 id="home-title">İletişimi anlamak, doğru yerden başlar.</h1>
          <p>
            Çocuklar, ergenler ve yetişkinler için sakin, güven veren ve kişiye göre şekillenen
            profesyonel görüşme süreci.
          </p>
          <Link href="/surec">
            Süreç nasıl ilerliyor?
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className={styles.editorialWords} aria-hidden="true">
          <span>DİL VE KONUŞMA</span>
          <span>TERAPİSİ</span>
        </div>

        <div className={styles.cardStage} aria-label="Destek alanları">
          {serviceCards.map((service) => (
            <article
              className={`${styles.notebook} ${styles[service.tone]} ${styles[service.rotation]}`}
              key={service.title}
            >
              <span className={styles.spiral} aria-hidden="true" />
              <div className={styles.notebookTopline}>
                <span>{service.annotation}</span>
                <i aria-hidden="true">↗</i>
              </div>
              <DoodleIcon type={service.icon} />
              <h2>{service.title}</h2>
              <p>{service.note}</p>
              <Link href="/hizmetler" aria-label={`${service.title} hakkında bilgi`}>
                ayrıntı
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>

        <div className={styles.heroFootnote}>
          <span aria-hidden="true">⌁⌁⌁</span>
          <p>
            Başlıklar genel bilgilendirme amaçlıdır. Kişiye özel plan, ilk görüşme ve uygunluk
            değerlendirmesi sonrasında şekillenir.
          </p>
        </div>
      </section>

      <section className={styles.principles} aria-labelledby="principles-title">
        <div className={styles.sectionIntro}>
          <p className={styles.handKicker}>çalışma yaklaşımı</p>
          <h2 id="principles-title">Klinik netlik, insani bir dil.</h2>
          <p>
            Süreç; anlaşılır bilgi, mahremiyet ve birlikte karar verme ilkeleriyle ilerler. Görsel
            dil sıcak olabilir; profesyonel çerçeve her zaman nettir.
          </p>
        </div>

        <div className={styles.principleGrid}>
          {principles.map((principle) => (
            <article key={principle.number}>
              <span>{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>

        <div className={styles.scribbleArrow} aria-hidden="true">
          <span>önce dinle</span>
          <i>→</i>
          <span>sonra planla</span>
        </div>
      </section>

      <section className={styles.about} id="hakkimda" aria-labelledby="about-title">
        <div className={styles.aboutVisual}>
          <div className={styles.graphPaper} aria-hidden="true" />
          <Image
            className={styles.portrait}
            src="/berfin-hero-standing.png"
            alt="Berfin Akbaş portresi"
            draggable={false}
            height={1353}
            sizes="(max-width: 760px) 74vw, 390px"
            width={413}
          />
          <div className={styles.aboutLabel}>
            <span>Tanışın</span>
            <strong>Berfin Akbaş</strong>
            <small>Dil ve Konuşma Terapisti</small>
          </div>
          <span className={styles.portraitNote}>sakin · anlaşılır · güven veren</span>
        </div>

        <div className={styles.aboutCopy}>
          <p className={styles.handKicker}>hakkımda</p>
          <h2 id="about-title">Sizi dinleyen, süreci anlaşılır kılan bir görüşme alanı.</h2>
          <p className={styles.aboutLead}>
            Her bireyin iletişim süreci kendine özgüdür. İlk görüşmede ihtiyaçları anlamaya,
            süreci sadeleştirmeye ve size uygun yol haritasını oluşturmaya odaklanıyorum.
          </p>
          <p>
            Çocuklar, ergenler ve yetişkinler için değerlendirme ve terapi planlama süreci;
            mahremiyete duyarlı, iş birliğine açık ve anlaşılır bir çerçevede ilerler.
          </p>
          <div className={styles.aboutActions}>
            <Link className={styles.inkButton} href="/hakkimda">
              Hakkımda daha fazla
            </Link>
            <Link className={styles.textLink} href="/surec">
              Terapi yaklaşımını incele <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.faq} id="sss" aria-labelledby="faq-title">
        <div className={styles.faqHeading}>
          <p className={styles.handKicker}>küçük notlar / net cevaplar</p>
          <h2 id="faq-title">Merak ettikleriniz</h2>
          <p>Randevu ve ilk görüşme hakkında en sık karşılaşılan sorular.</p>
        </div>

        <div className={styles.faqList}>
          <details>
            <summary>
              <span>01</span>
              Seçtiğim saat hemen kesinleşir mi?
            </summary>
            <p>Hayır. Saat seçimi bir taleptir; uygunluk kontrolü ve onay sonrasında kesinleşir.</p>
          </details>
          <details>
            <summary>
              <span>02</span>
              İlk talepte hangi bilgiler istenir?
            </summary>
            <p>İlk adımda yalnızca iletişim ve planlama için gerekli minimum bilgiler alınır.</p>
          </details>
          <details>
            <summary>
              <span>03</span>
              İlk görüşme nasıl planlanır?
            </summary>
            <p>
              Görüşme biçimi ve sonraki adım, ilk temas ve uygunluk değerlendirmesiyle netleşir.
            </p>
          </details>
        </div>
      </section>

      <section className={styles.booking} id="randevu" aria-labelledby="booking-title">
        <div>
          <p className={styles.bookingHand}>birlikte planlayalım ↘</p>
          <h2 id="booking-title">İlk adımı sakin ve kontrollü biçimde oluşturun.</h2>
          <p>
            Tercih ettiğiniz zamanı iletin. Saatiniz, uygunluk kontrolü ve onay sonrasında
            kesinleşsin.
          </p>
        </div>
        <div className={styles.bookingActions}>
          <Link href="/randevu">Randevu talebi oluştur</Link>
          <Link href="/iletisim">Önce iletişime geç</Link>
        </div>
        <span className={styles.bookingWave} aria-hidden="true">
          ∿∿∿∿∿∿∿∿∿
        </span>
      </section>

      <SiteFooter />
      <ManagedContactFab />
    </main>
  );
}
