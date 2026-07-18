'use client';

import { useState, ReactNode } from 'react';
import AdminSidebar from './admin-sidebar';
import AdminHeader from './admin-header';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [activeMenuItemId, setActiveMenuItemId] = useState('danisanlar');

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <AdminSidebar
        activeMenuItemId={activeMenuItemId}
        setActiveMenuItemId={setActiveMenuItemId}
      />

      {/* Main Area */}
      <div style={styles.mainArea}>
        {/* Header */}
        <AdminHeader />

        {/* Content */}
        <div style={styles.contentWrapper}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    overflow: 'hidden' as const,
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  }
};
