'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AdminSidebarProps {
  activeMenuItemId: string;
  setActiveMenuItemId: (id: string) => void;
}

const menuGroups = [
  {
    title: 'BENIM ÇALIŞMAM',
    items: [
      { id: 'danisanlar', label: 'Danışanlar', href: '/yonetim/danisanlar' },
      { id: 'randevular', label: 'Randevular', href: '/yonetim/randevular' },
      { id: 'odemeler', label: 'Ödemeler', href: '/yonetim/odemeler' },
    ]
  },
  {
    title: 'MÜŞTERİLER',
    items: [
      { id: 'hesaplar', label: 'Hesaplar', href: '/yonetim/hesaplar' },
      { id: 'iletisim', label: 'İletişim', href: '/yonetim/iletisim' },
    ]
  },
  {
    title: 'SATIŞLAR',
    items: [
      { id: 'leads', label: 'Leads', href: '/yonetim/leads' },
      { id: 'firsatlar', label: 'Fırsatlar', href: '/yonetim/firsatlar' },
    ]
  },
  {
    title: 'PERFORMANS',
    items: [
      { id: 'hedefler', label: 'Hedefler', href: '/yonetim/hedefler' },
      { id: 'tahminler', label: 'Tahminler', href: '/yonetim/tahminler' },
    ]
  }
];

export default function AdminSidebar({ activeMenuItemId, setActiveMenuItemId }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={{
      ...styles.sidebar,
      width: isCollapsed ? 64 : 240,
    }}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>📊</div>
        </div>
        {!isCollapsed && (
          <div style={styles.logoText}>
            <span style={styles.brandName}>Berfin Akbaş</span>
            <span style={styles.subtitle}>Admin</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={styles.nav}>
        {/* Menu Header */}
        <div style={styles.menuHeader}>
          {!isCollapsed && <span style={styles.menuTitle}>Menu</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={styles.collapseBtn}
            title={isCollapsed ? 'Genişlet' : 'Daralt'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Menu Groups */}
        {menuGroups.map((group) => (
          <div key={group.title} style={styles.menuGroup}>
            {!isCollapsed && (
              <span style={styles.groupTitle}>{group.title}</span>
            )}
            <div style={styles.itemsContainer}>
              {group.items.map((item) => {
                const isActive = activeMenuItemId === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveMenuItemId(item.id)}
                    style={{
                      ...styles.menuItem,
                      ...(isActive ? styles.menuItemActive : {}),
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                    }}
                  >
                    {!isCollapsed && <span style={styles.itemLabel}>{item.label}</span>}
                    {isCollapsed && <span style={styles.itemLabelCollapsed}>{item.label[0]}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
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
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 64,
    borderBottom: '1px solid rgba(226, 225, 223, 0.6)',
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
    shrinkFlexGrow: 0,
  },
  logo: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 18,
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
    transition: 'all 0.2s',
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
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: '#605e5c',
    textDecoration: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#c7e9c0',
    color: '#000000',
    fontWeight: 700,
  },
  itemLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  itemLabelCollapsed: {
    fontSize: 12,
    fontWeight: 700,
  }
};
