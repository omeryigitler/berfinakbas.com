import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { ClientCreateForm } from "@/components/admin/client-create-form";
import { hasPermission } from "@/domain/auth/permissions";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewAdminClientPage() {
  const session = await requirePermission("clients:manage");
  const guardians = await getDatabase().guardian.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { email: true, firstName: true, id: true, lastName: true, phone: true },
    take: 250,
  });

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: hasPermission(session.user.roles, "appointments:read"),
        clientsRead: hasPermission(session.user.roles, "clients:read"),
        financeRead: hasPermission(session.user.roles, "finance:read"),
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
      }}
      subtitle="Yetişkin veya çocuk danışan kaydı oluşturun; çocuk danışanda veli ilişkisi zorunludur."
      title="Yeni danışan"
    >
      <Link className="admin-back-link" href="/yonetim/danisanlar">
        ← Danışan listesine dön
      </Link>

      <section className="admin-panel" aria-labelledby="danisan-olustur">
        <div className="admin-panel-heading">
          <div>
            <h2 id="danisan-olustur">Danışan oluştur</h2>
            <p>
              Bu form klinik not veya sağlık detayı tutmaz; yalnızca idari danışan ve veli kaydı
              oluşturur.
            </p>
          </div>
          <span className="admin-count">CLIENT</span>
        </div>

        <ClientCreateForm guardians={guardians} />
      </section>
    </AdminShell>
  );
}
