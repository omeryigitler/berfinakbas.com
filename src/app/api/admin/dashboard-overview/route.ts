import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission, type Permission } from "@/domain/auth/permissions";
import { GET as getDashboardOverviewInternal } from "@/app/api/admin/dashboard-overview/internal";

const REQUIRED_PERMISSIONS: Permission[] = [
  "appointments:read",
  "clients:read",
  "finance:read",
  "audit:read",
];

export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !REQUIRED_PERMISSIONS.every((permission) => hasPermission(session.user.roles, permission))
  ) {
    return NextResponse.json(
      { code: "FORBIDDEN", error: "Dashboard özetini görüntüleme yetkiniz yok." },
      { status: 403 },
    );
  }

  return getDashboardOverviewInternal();
}
