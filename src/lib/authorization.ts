import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { hasPermission, type Permission } from "@/domain/auth/permissions";

export async function requirePermission(permission: Permission) {
  const session = await auth();

  if (!session?.user || session.user.status !== "ACTIVE") {
    redirect("/giris");
  }

  if (!hasPermission(session.user.roles, permission)) {
    redirect("/giris");
  }

  return session;
}
