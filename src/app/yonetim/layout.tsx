import { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';

interface YonetimLayoutProps {
  children: ReactNode;
}

export default function YonetimLayout({ children }: YonetimLayoutProps) {
  return (
    <div style={styles.root}>
      <AdminLayout>
        {children}
      </AdminLayout>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f3f2f1',
    fontSize: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden' as const,
  }
};
