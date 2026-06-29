import Link from "next/link";

import { isGoogleAuthConfigured, signIn } from "@/auth";

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/yonetim" });
}

export default function AdminSignInPage() {
  return (
    <main className="admin-auth-shell">
      <section className="admin-auth-card" aria-labelledby="giris-basligi">
        <Link className="admin-back-link" href="/">
          ← Ana sayfaya dön
        </Link>
        <p className="section-kicker">Güvenli yönetim alanı</p>
        <h1 id="giris-basligi">Yönetim paneline giriş</h1>
        <p>
          Erişim yalnızca önceden davet edilmiş hesaplara açıktır. Çok faktörlü doğrulama, bağlı
          Google hesabının güvenlik politikasıyla uygulanır.
        </p>

        {isGoogleAuthConfigured ? (
          <form action={signInWithGoogle}>
            <button className="primary-button admin-login-button" type="submit">
              Google ile güvenli giriş
            </button>
          </form>
        ) : (
          <div className="admin-config-note" role="status">
            Google giriş bilgileri henüz yapılandırılmadı. Yerel kurulumda
            <code> AUTH_GOOGLE_ID </code> ve <code> AUTH_GOOGLE_SECRET </code> tanımlanmalıdır.
          </div>
        )}
      </section>
    </main>
  );
}
