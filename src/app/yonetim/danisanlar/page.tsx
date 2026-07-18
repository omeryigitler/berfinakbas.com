'use client';

import { useState } from 'react';
import DanisanlarPanel from '@/components/admin/danisanlar-panel';
import DanisanDetayPanel from '@/components/admin/danisan-detay-panel';

export default function DanisanlarPage() {
  const [selectedDanisanId, setSelectedDanisanId] = useState('danisan-1');

  return (
    <div style={styles.container}>
      {/* Sol: Danışanlar Listesi */}
      <DanisanlarPanel
        selectedId={selectedDanisanId}
        onSelectDanisan={setSelectedDanisanId}
      />

      {/* Sağ: Danışan Detayları */}
      <DanisanDetayPanel selectedDanisanId={selectedDanisanId} />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: 16,
    height: 'calc(100vh - 160px)',
    overflow: 'hidden',
  }
};
