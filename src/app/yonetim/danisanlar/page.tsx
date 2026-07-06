import type { Route } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { ClientFilterForm } from "@/components/admin/client-filter-form";
import {
  clientStatusLabels,
  clientTypeLabels,
  type ClientStatusValue,
  type ClientTypeValue,
} from "@/domain/clients/client-management";
import { hasPermission } from "@/domain/auth/permissions";
import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const clientStatuses = ["PROSPECTIVE", "ACTIVE", "INACTIVE"] as const;
const clientTypes = ["ADULT", "CHILD"] as const;
const statusOptions = [
  { label: "Tüm statüler", value: "ALL" },
  ...clientStatuses.map((statusOption) => ({
    label: clientStatusLabels[statusOption],
    value: statusOption,
  })),
];
const typeOptions = [
  { label: "Yetişkin ve çocuk", value: "ALL" },
  ...clientTypes.map((typeOption) => ({
    label: clientTypeLabels[typeOption],
    value: typeOption,
  })),
];

function singleParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function statusParam(value: string): ClientStatusValue | "ALL" {
  return clientStatuses.includes(value as ClientStatusValue) ? (value as ClientStatusValue) : "ALL";
}

function typeParam(value: string): ClientTypeValue | "ALL" {
  return clientTypes.includes(value as ClientTypeValue) ? (value as ClientTypeValue) : "ALL";
}

export default async function AdminClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requirePermission("clients:read");
  const params = await searchParams;
  const query = singleParam(params, "q").trim();
  const status = statusParam(singleParam(params, "status"));
  const type = typeParam(singleParam(params, "type"));
  const where: Prisma.ClientWhereInput = {};

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  if (status !== "ALL") where.status = status;
  if (type !== "ALL") where.type = type;

  const [clients, totalCount] = await Promise.all([
    getDatabase().client.findMany({
      include: {
        _count: { select: { appointments: true, guardians: true, plans: true } },
        guardians: {
          include: {
            guardian: { select: { firstName: true, lastName: true, phone: true } },
          },
          orderBy: [{ isPrimary: "desc" }, { guardian: { lastName: "asc" } }],
          take: 2,
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      where,
    }),
    getDatabase().client.count({ where }),
  ]);

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
      subtitle="Danışan kayıtları, veli ilişkileri ve ileride bağlanacak randevu/finans özetleri için temel merkez."
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
          status={status}
          statusOptions={statusOptions}
          type={type}
          typeOptions={typeOptions}
        />

        {clients.length === 0 ? (
          <div className="admin-empty-state">
            <strong>Danışan bulunamadı</strong>
            <span>Filtreleri temizleyebilir veya yeni danışan oluşturabilirsiniz.</span>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-appointments-table">
              <thead>
                <tr>
                  <th>Danışan</th>
                  <th>İletişim</th>
                  <th>Tip / Statü</th>
                  <th>Veli</th>
                  <th>Özet</th>
                  <th>Detay</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const primaryGuardian = client.guardians.find((guardian) => guardian.isPrimary);
                  return (
                    <tr key={client.id}>
                      <td>
                        <strong>
                          {client.firstName} {client.lastName}
                        </strong>
                        <span>{client.preferredName ? `Tercih edilen ad: ${client.preferredName}` : "—"}</span>
                      </td>
                      <td>
                        <strong>{client.phone ?? "Telefon yok"}</strong>
                        <span>{client.email ?? "E-posta yok"}</span>
                      </td>
                      <td>
                        <strong>{clientTypeLabels[client.type]}</strong>
                        <span>{clientStatusLabels[client.status]}</span>
                      </td>
                      <td>
                        {primaryGuardian ? (
                          <>
                            <strong>
                              {primaryGuardian.guardian.firstName} {primaryGuardian.guardian.lastName}
                            </strong>
                            <span>{primaryGuardian.guardian.phone}</span>
                          </>
                        ) : (
                          <span>{client.type === "CHILD" ? "Veli bekleniyor" : "Gerekli değil"}</span>
                        )}
                      </td>
                      <td>
                        <strong>{client._count.appointments} randevu</strong>
                        <span>
                          {client._count.plans} plan · {client._count.guardians} veli
                        </span>
                      </td>
                      <td>
                        <Link href={`/yonetim/danisanlar/${client.id}` as Route}>Profili aç</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-list-footer">
          <span>
            {clients.length} kayıt gösteriliyor · Toplam {totalCount}
          </span>
        </div>
      </section>
    </AdminShell>
  );
}
