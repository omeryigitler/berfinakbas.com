import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";

export default async function AdminStartPage() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") redirect("/yonetim/giris");

  if (hasPermission(session.user.roles, "services:read")) redirect("/yonetim");
  if (hasPermission(session.user.roles, "appointments:read")) redirect("/yonetim/randevular");
  if (hasPermission(session.user.roles, "clients:read")) redirect("/yonetim/danisanlar");
  if (hasPermission(session.user.roles, "finance:read")) redirect("/yonetim/odemeler");
  if (hasPermission(session.user.roles, "technical-health:read")) redirect("/yonetim/saglik");
  redirect("/yonetim/yetkisiz");
}
