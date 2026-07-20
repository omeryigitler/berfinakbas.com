'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { AdminLayout } from '@/components/admin/admin-layout';

export function YonetimLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSalesHubRoute =
    pathname === '/yonetim/danisanlar' || pathname.startsWith('/yonetim/danisanlar/');

  if (isSalesHubRoute) return <>{children}</>;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f3f2f1',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
      }}
    >
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
}
