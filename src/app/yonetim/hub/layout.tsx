import type { ReactNode } from "react";

import styles from "@/components/admin/hub/progressive-shell.module.css";
import { ReferenceClientDeleteControl } from "@/components/admin/hub/reference-client-delete-control";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";

export default async function AdminHubLayout({ children }: { children: ReactNode }) {
  const session = await requirePermission("appointments:read");
  const canManageClients = hasPermission(session.user.roles, "clients:manage");

  return (
    <div className={styles.scope}>
      {children}
      <ReferenceClientDeleteControl canManage={canManageClients} />
    </div>
  );
}
