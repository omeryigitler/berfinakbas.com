export default function FirsatlarPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💡 Fırsatlar</h1>
      <p style={styles.subtitle}>Satış fırsatları bu sayfada gösterilecek</p>
    </div>
  );
}

const styles = {
  container: { padding: 24 },
  title: { fontSize: 28, fontWeight: 700, color: '#323130', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#605e5c' }
};
