import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { ClientFilterForm } from "@/components/admin/client-filter-form";
import { hasPermission } from "@/domain/auth/permissions";
import { clientStatusLabels, clientTypeLabels } from "@/domain/clients/client-management";
import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const clientStatuses = ["PROSPECTIVE", "ACTIVE", "INACTIVE"] as const;
const clientTypes = ["ADULT", "CHILD"] as const;
const statusOptions = [
  { label: "Tüm statüler", value: "ALL" },
  ...clientStatuses.map((value) => ({ label: clientStatusLabels[value], value })),
];
const typeOptions = [
  { label: "Yetişkin ve çocuk", value: "ALL" },
  ...clientTypes.map((value) => ({ label: clientTypeLabels[value], value })),
];

function singleParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requirePermission("clients:read");
  const params = await searchParams;
  const query = singleParam(params, "q").trim();
  const status = singleParam(params, "status");
  const type = singleParam(params, "type");
  const where: Prisma.ClientWhereInput = {};

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  if (clientStatuses.includes(status as never)) where.status = status as never;
  if (clientTypes.includes(type as never)) where.type = type as never;

  const totalCount = await getDatabase().client.count({ where });
  const canManageClients = hasPermission(session.user.roles, "clients:manage");

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: hasPermission(session.user.roles, "appointments:read"),
        clientsRead: true,
        financeRead: hasPermission(session.user.roles, "finance:read"),
        servicesRead: hasPermission(session.user.roles, "services:read"),
        technicalHealthRead: hasPermission(session.user.roles, "technical-health:read"),
      }}
      subtitle="Danışan kayıtları ve filtreleme ekranı."
      title="Danışanlar"
    >
      <section className="admin-panel" aria-labelledby="danisan-listesi">
        <div className="admin-panel-heading">
          <div>
            <h2 id="danisan-listesi">Danışan listesi</h2>
            <p>Arama ve filtreler yalnızca idari kayıt alanları üzerinden çalışır.</p>
          </div>
          {canManageClients ? (
            <Link className="primary-button" href="/yonetim/danisanlar/yeni">
              Danışan oluştur
            </Link>
          ) : (
            <span className="admin-count">Salt okunur</span>
          )}
        </div>

        <ClientFilterForm
          query={query}
          status={status || "ALL"}
          statusOptions={statusOptions}
          type={type || "ALL"}
          typeOptions={typeOptions}
        />

        <div className="admin-list-footer">
          <span>Toplam {totalCount} kayıt</span>
        </div>
      </section>
    </AdminShell>
  );
}
