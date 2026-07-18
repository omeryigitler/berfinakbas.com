'use client';

export default function AdminHeader() {
  return (
    <header style={styles.header}>
      <div style={styles.spacer}></div>

      <div style={styles.icons}>
        <button style={styles.iconBtn} title="Arama">
          🔍
        </button>
        <button style={styles.iconBtn} title="Tarih">
          🕐
        </button>
        <button style={styles.iconBtn} title="Yeni">
          ➕
        </button>
        <button style={styles.iconBtn} title="Fikirler">
          💡
        </button>
        <button style={styles.iconBtn} title="Filtre">
          ⚙️
        </button>
        <button style={styles.iconBtn} title="Ayarlar">
          ⚙️
        </button>
        <button style={styles.iconBtn} title="Yardım">
          ❓
        </button>
        <button style={styles.iconBtn} title="Destek">
          🎧
        </button>

        <div style={styles.profileContainer}>
          <div style={styles.avatar}>👤</div>
          <div style={styles.onlineIndicator}></div>
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
    shrinkFlexGrow: 0,
  },
  spacer: {
    flex: 1,
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
    background: 'rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  profileContainer: {
    position: 'relative' as const,
    width: 36,
    height: 36,
    cursor: 'pointer',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#e8e7e5',
    border: '1px solid rgba(104, 100, 100, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
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
  }
};
