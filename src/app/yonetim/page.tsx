import { redirect } from 'next/navigation';

// Yönetim kökü, görsel kabuğu değiştirmeden canlı başlangıç ekranına yönlenir.
export default function YonetimPage() {
  redirect('/yonetim/baslangic');
}
