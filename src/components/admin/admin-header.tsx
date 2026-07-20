'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const actions = [
  { href: '/yonetim/baslangic', icon: '⌂', label: 'Genel bakış' },
  { href: '/yonetim/danisanlar', icon: '◉', label: 'Danışanlar' },
  { href: '/yonetim/randevular', icon: '◷', label: 'Randevular' },
  { href: '/yonetim/odemeler', icon: '₺', label: 'Ödemeler' },
] as const;

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header style={styles.header}>
      <div style={styles.pageTitle}>
        <span style={styles.pageKicker}>YÖNETİM</span>
        <strong>{actions.find((action) => pathname.startsWith(action.href))?.label ?? 'Yönetim paneli'}</strong>
      </div>

      <div style={styles.icons}>
        {actions.map((action) => {
          const active = pathname === action.href || pathname.startsWith(`${action.href}/`);
          return (
            <Link
              aria-label={action.label}
              href={action.href as Route}
              key={action.href}
              style={{ ...styles.iconBtn, ...(active ? styles.iconBtnActive : {}) }}
              title={action.label}
            >
              {action.icon}
            </Link>
          );
        })}
        <button
          aria-label="Sayfayı yenile"
          onClick={() => router.refresh()}
          style={styles.iconBtn}
          title="Yenile"
          type="button"
        >
          ↻
        </button>
        <Link aria-label="Siteyi aç" href="/" style={styles.iconBtn} title="Siteyi aç">↗</Link>
        <div style={styles.profileContainer} title="Berfin Akbaş yönetim">
          <div style={styles.avatar}>BA</div>
          <div style={styles.onlineIndicator} />
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: 64,
    paddingLeft: 24,
    paddingRight: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f2f1',
    borderBottom: '1px solid rgba(226, 225, 223, 0.6)',
    flex: '0 0 auto',
  },
  pageTitle: {
    display: 'grid',
    gap: 2,
    color: '#323130',
    fontSize: 12,
  },
  pageKicker: {
    color: '#9692a0',
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: '0.08em',
  },
  icons: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: '1px solid rgba(104, 100, 100, 0.2)',
    background: 'rgba(255, 255, 255, 0.45)',
    color: '#605e5c',
    cursor: 'pointer',
    fontSize: 13,
    display: 'grid',
    placeItems: 'center',
    textDecoration: 'none',
    fontWeight: 800,
  },
  iconBtnActive: {
    background: '#eafda8',
    color: '#050505',
    borderColor: 'rgba(5, 5, 5, 0.08)',
  },
  profileContainer: {
    position: 'relative' as const,
    width: 36,
    height: 36,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#050505',
    color: '#dfff65',
    border: '1px solid rgba(104, 100, 100, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontWeight: 850,
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: '#16a34a',
    borderRadius: '50%',
    border: '2px solid white',
  },
};