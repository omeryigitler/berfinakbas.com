'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const menuGroups = [
  {
    title: 'YÖNETİM',
    items: [
      { id: 'baslangic', icon: '⌂', label: 'Genel Bakış', href: '/yonetim/baslangic' },
      { id: 'danisanlar', icon: '◉', label: 'Danışanlar', href: '/yonetim/danisanlar' },
      { id: 'randevular', icon: '◷', label: 'Randevular', href: '/yonetim/randevular' },
      { id: 'odemeler', icon: '₺', label: 'Ödemeler', href: '/yonetim/odemeler' },
    ],
  },
];

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: isCollapsed ? 64 : 240,
      }}
    >
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>BA</div>
        </div>
        {!isCollapsed && (
          <div style={styles.logoText}>
            <span style={styles.brandName}>Berfin Akbaş</span>
            <span style={styles.subtitle}>Yönetim</span>
          </div>
        )}
      </div>

      <nav aria-label="Yönetim menüsü" style={styles.nav}>
        <div style={styles.menuHeader}>
          {!isCollapsed && <span style={styles.menuTitle}>Menü</span>}
          <button
            aria-label={isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
            onClick={() => setIsCollapsed((value) => !value)}
            style={styles.collapseBtn}
            title={isCollapsed ? 'Genişlet' : 'Daralt'}
            type="button"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {menuGroups.map((group) => (
          <div key={group.title} style={styles.menuGroup}>
            {!isCollapsed && <span style={styles.groupTitle}>{group.title}</span>}
            <div style={styles.itemsContainer}>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/yonetim/baslangic' && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    aria-current={isActive ? 'page' : undefined}
                    href={item.href as Route}
                    key={item.id}
                    style={{
                      ...styles.menuItem,
                      ...(isActive ? styles.menuItemActive : {}),
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span style={styles.itemIcon}>{item.icon}</span>
                    {!isCollapsed && <span style={styles.itemLabel}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={styles.footer}>
        <Link href="/" style={styles.siteLink} title="Siteyi aç">
          <span style={styles.itemIcon}>↗</span>
          {!isCollapsed && <span>Siteyi aç</span>}
        </Link>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    backgroundColor: '#f3f2f1',
    borderRight: '1px solid rgba(226, 225, 223, 0.6)',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    flex: '0 0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 64,
    borderBottom: '1px solid rgba(226, 225, 223, 0.6)',
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
    flex: '0 0 auto',
  },
  logo: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#050505',
    flex: '0 0 auto',
  },
  logoIcon: {
    color: '#dfff65',
    fontSize: 9,
    fontWeight: 850,
    letterSpacing: '-0.04em',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column' as const,
    whiteSpace: 'nowrap' as const,
  },
  brandName: {
    fontWeight: 700,
    fontSize: 13,
    color: '#323130',
  },
  subtitle: {
    fontSize: 10,
    color: '#605e5c',
    fontWeight: 600,
  },
  nav: {
    flex: 1,
    overflow: 'auto',
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 8,
    paddingRight: 8,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  menuHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 12,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#323130',
  },
  collapseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    border: '1px solid rgba(104, 100, 100, 0.2)',
    background: 'rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
    fontSize: 12,
    color: '#605e5c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#323130',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingLeft: 12,
    paddingRight: 12,
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: '#605e5c',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  menuItemActive: {
    backgroundColor: '#eafda8',
    color: '#000000',
    fontWeight: 700,
  },
  itemIcon: {
    display: 'grid',
    width: 20,
    height: 20,
    flex: '0 0 auto',
    placeItems: 'center',
    fontSize: 12,
    fontWeight: 800,
  },
  itemLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  footer: {
    borderTop: '1px solid rgba(226, 225, 223, 0.6)',
    padding: 12,
  },
  siteLink: {
    display: 'flex',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    background: '#ffffff',
    color: '#605e5c',
    fontSize: 12,
    fontWeight: 700,
    textDecoration: 'none',
  },
};