export default function YonetimPage() {
  return (
    <div style={styles.container}>
      <div style={styles.welcome}>
        <h1 style={styles.title}>Yönetim Paneli</h1>
        <p style={styles.subtitle}>Sol menüden başlayınız.</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  welcome: {
    textAlign: 'center' as const,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#323130',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#605e5c',
  }
};
