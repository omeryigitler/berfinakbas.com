import { auth } from '@/auth';
import SalesHubPage from '@/components/admin/sales-hub/sales-hub-page';

export default async function YonetimPage() {
  const session = await auth();

  return (
    <SalesHubPage
      currentUserEmail={session?.user.email}
      currentUserName={session?.user.name}
    />
  );
}
