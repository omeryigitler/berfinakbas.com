import type { ReactNode } from 'react';

import { YonetimLayoutClient } from '@/components/admin/yonetim-layout-client';

export default function YonetimLayout({ children }: { children: ReactNode }) {
  return <YonetimLayoutClient>{children}</YonetimLayoutClient>;
}
