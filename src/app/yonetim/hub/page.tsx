import type { Metadata } from "next";

import { DashboardHub } from "@/components/admin/hub/dashboard-hub";
import { requirePermission } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false, noarchive: true, nosnippet: true },
  title: "Yönetim Hub Önizlemesi | Berfin Akbaş",
};

export default async function AdminHubPreviewPage() {
  await requirePermission("services:read");

  return <DashboardHub />;
}
