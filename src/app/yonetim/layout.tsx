import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { YonetimLayoutClient } from '@/components/admin/yonetim-layout-client';

export default async function YonetimLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.status !== 'ACTIVE') {
    redirect('/giris');
  }

  return <YonetimLayoutClient>{children}</YonetimLayoutClient>;
}
