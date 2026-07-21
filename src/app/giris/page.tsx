import Link from "next/link";

import { isGoogleAuthConfigured, signIn } from "@/auth";

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/yonetim" });
}

export default function AdminSignInPage() {
  return (
    <main style={styles.shell}>
      <section aria-labelledby="giris-basligi" style={styles.card}>
        <Link href="/" style={styles.backLink}>
          ← Ana sayfaya dön
        </Link>
        <span style={styles.kicker}>GÜVENLİ YÖNETİM ALANI</span>
        <h1 id="giris-basligi" style={styles.title}>
          Yönetim paneline giriş
        </h1>
        <p style={styles.copy}>
          Erişim yalnızca önceden yetkilendirilmiş Google hesaplarına açıktır.
        </p>

        {isGoogleAuthConfigured ? (
          <form action={signInWithGoogle}>
            <button style={styles.button} type="submit">
              <span style={styles.googleMark}>G</span>
              Google ile güvenli giriş
            </button>
          </form>
        ) : (
          <div role="status" style={styles.notice}>
            Google giriş bilgileri henüz yapılandırılmadı.
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "#f3f2f1",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "min(100%, 460px)",
    display: "grid",
    gap: 18,
    border: "1px solid rgba(50, 49, 48, 0.14)",
    borderRadius: 28,
    background: "#ffffff",
    padding: 32,
    boxShadow: "0 18px 48px rgba(32, 28, 25, 0.08)",
  },
  backLink: {
    width: "fit-content",
    color: "#605e5c",
    fontSize: 12,
    fontWeight: 650,
    textDecoration: "none",
  },
  kicker: {
    width: "fit-content",
    borderRadius: 999,
    background: "#efffc3",
    padding: "6px 10px",
    color: "#263000",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  title: {
    margin: 0,
    color: "#151413",
    fontSize: 30,
    letterSpacing: "-0.04em",
  },
  copy: {
    margin: 0,
    color: "#77727d",
    fontSize: 14,
    lineHeight: 1.6,
  },
  button: {
    width: "100%",
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    border: 0,
    borderRadius: 999,
    background: "#050505",
    color: "#ffffff",
    font: "inherit",
    fontWeight: 750,
    cursor: "pointer",
  },
  googleMark: {
    display: "grid",
    width: 24,
    height: 24,
    placeItems: "center",
    borderRadius: "50%",
    background: "#ffffff",
    color: "#050505",
    fontSize: 12,
    fontWeight: 900,
  },
  notice: {
    borderRadius: 16,
    background: "#fff7ed",
    padding: 14,
    color: "#9a3412",
    fontSize: 12,
  },
} as const;
