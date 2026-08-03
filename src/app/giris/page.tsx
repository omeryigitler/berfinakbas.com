import Link from "next/link";

import { isGoogleAuthConfigured, signIn } from "@/auth";

import styles from "./giris.module.css";

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/yonetim" });
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="10.5" width="14" height="9" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export default function AdminSignInPage() {
  return (
    <main className={styles.shell}>
      <aside className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={42} height={42} />
        </span>

        <div className={styles.brandLede}>
          <span className={styles.brandRole}>Dil ve konuşma terapisi</span>
          <p className={styles.wordmark}>Berfin Akbaş</p>
          <p className={styles.tagline}>
            Çocuklar, ergenler ve yetişkinler için sıcak, güven veren ve kişiye özel dil ve konuşma
            terapisi.
          </p>
        </div>

        <span className={styles.brandFoot}>Yönetim paneli · Yalnızca yetkili erişim</span>
      </aside>

      <section aria-labelledby="giris-basligi" className={styles.panel}>
        <div className={styles.signin}>
          <Link href="/" className={styles.back}>
            ← Ana sayfaya dön
          </Link>

          <span className={styles.kicker}>Güvenli yönetim alanı</span>
          <h1 id="giris-basligi" className={styles.title}>
            Yönetim paneline giriş
          </h1>
          <p className={styles.copy}>
            Erişim yalnızca önceden yetkilendirilmiş Google hesaplarına açıktır.
          </p>

          {isGoogleAuthConfigured ? (
            <form action={signInWithGoogle}>
              <button className={styles.google} type="submit">
                <span className={styles.googleMark}>
                  <GoogleLogo />
                </span>
                Google ile güvenli giriş
              </button>
            </form>
          ) : (
            <div role="status" className={styles.notice}>
              Google giriş bilgileri henüz yapılandırılmadı.
            </div>
          )}

          <p className={styles.foot}>
            <LockIcon />
            Bağlantı güvenli · Berfin Akbaş yönetim paneli
          </p>
        </div>
      </section>
    </main>
  );
}
