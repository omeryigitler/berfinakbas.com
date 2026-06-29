import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="admin-auth-shell">
      <section className="admin-auth-card">
        <p className="section-kicker">Erişim sınırı</p>
        <h1>Bu alan için yetkiniz yok</h1>
        <p>Hesabınız açık ancak bu modül için gerekli rol atanmamış.</p>
        <Link className="secondary-button" href="/">
          Ana sayfaya dön
        </Link>
      </section>
    </main>
  );
}
