'use client';

import type { ReactNode } from 'react';

import AdminHeader from './admin-header';
import AdminSidebar from './admin-sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div style={styles.container}>
      <AdminSidebar />

      <div style={styles.mainArea}>
        <AdminHeader />
        <div style={styles.contentWrapper}>{children}</div>
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
  },
};