import "@fontsource-variable/inter/index.css";

import type { Metadata, Route } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  buildWeeklyAvailability,
  mapAppointmentToHubRecord,
  mapClientToHubRecord,
} from "@/components/admin/hub/hub-data";
import { buildHubFinanceSummary } from "@/components/admin/hub/hub-finance";
import { RecordCenter } from "@/components/admin/hub/record-center";
import { hasPermission } from "@/domain/auth/permissions";
import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/authorization";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getZonedMonthRange } from "@/lib/time-zone";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false, noarchive: true, nosnippet: true },
  title: "Kayıt Merkezi | Berfin Akbaş",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ListSection = "danisanlar" | "talepler";

const PAGE_SIZE = 30;
const openRequestStatuses = ["REQUESTED", "PENDING_REVIEW", "RESCHEDULE_PROPOSED"] as const;
const upcomingClientStatuses = ["CONFIRMED", "PENDING_REVIEW", "RESCHEDULE_PROPOSED"] as const;

function singleParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function pageNumber(value: string): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function listHref({
  page,
  query,
  section,
}: {
  page: number;
  query: string;
  section: ListSection;
}): Route {
  const params = new URLSearchParams();
  if (section === "danisanlar") params.set("bolum", "danisanlar");
  if (query) params.set("q", query);
  if (page > 1) params.set("sayfa", String(page));
  const suffix = params.toString();
  return `/yonetim/hub${suffix ? `?${suffix}` : ""}` as Route;
}

function buildClientWhere(query: string): Prisma.ClientWhereInput {
  if (!query) return {};
  const terms = query.split(/\s+/).filter(Boolean).slice(0, 6);
  return {
    AND: terms.map((term) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { preferredName: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ],
    })),
  };
}

function buildAppointmentWhere(query: string): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {
    status: { in: [...openRequestStatuses] },
  };
  if (!query) return where;
  const terms = query.split(/\s+/).filter(Boolean).slice(0, 6);
  where.AND = terms.map((term) => ({
    OR: [
      { publicReference: { contains: term, mode: "insensitive" } },
      { serviceNameSnapshot: { contains: term, mode: "insensitive" } },
      { client: { firstName: { contains: term, mode: "insensitive" } } },
      { client: { lastName: { contains: term, mode: "insensitive" } } },
      { client: { preferredName: { contains: term, mode: "insensitive" } } },
      { client: { phone: { contains: term, mode: "insensitive" } } },
      { client: { email: { contains: term, mode: "insensitive" } } },
    ],
  }));
  return where;
}

export default async function AdminHubPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requirePermission("appointments:read");
  const params = await searchParams;
  const query = singleParam(params, "q").trim().slice(0, 100);
  const requestedPage = pageNumber(singleParam(params, "sayfa"));
  const requestedSection = singleParam(params, "bolum");
  const canManage = hasPermission(session.user.roles, "appointments:manage");
  const canReadClients = hasPermission(session.user.roles, "clients:read");
  const canReadAvailability = hasPermission(session.user.roles, "services:read");
  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const canReadTechnicalHealth = hasPermission(session.user.roles, "technical-health:read");
  const isSummarySection =
    (requestedSection === "musaitlik" && canReadAvailability) ||
    (requestedSection === "odemeler" && canReadFinance);
  const activeListSection: ListSection =
    requestedSection === "danisanlar" && canReadClients ? "danisanlar" : "talepler";
  const environment = getServerEnvironment();
  const database = getDatabase();
  const now = new Date();
  const timeZone = environment.BUSINESS_TIME_ZONE;
  const monthRange = getZonedMonthRange(now, timeZone);
  const clientWhere = buildClientWhere(query);
  const appointmentWhere = buildAppointmentWhere(query);

  const [appointmentTotal, clientTotal] = await Promise.all([
    database.appointment.count({ where: appointmentWhere }),
    canReadClients ? database.client.count({ where: clientWhere }) : Promise.resolve(0),
  ]);
  const activeTotal = activeListSection === "danisanlar" ? clientTotal : appointmentTotal;
  const totalPages = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [appointmentRows, clientRows, availabilityRows, recentFinanceRows, financeAggregateRows] =
    await Promise.all([
      database.appointment.findMany({
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
          approvedAt: true,
          client: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              preferredName: true,
              type: true,
            },
          },
          createdAt: true,
          duplicateReviewStatus: true,
          guardian: { select: { firstName: true, lastName: true } },
          id: true,
          practitioner: { select: { displayName: true } },
          publicReference: true,
          requestNote: true,
          serviceNameSnapshot: true,
          source: true,
          startsAt: true,
          status: true,
          statusLogs: {
            orderBy: { createdAt: "desc" },
            select: { createdAt: true, toStatus: true },
            take: 5,
          },
        },
        skip,
        take: PAGE_SIZE,
        where: appointmentWhere,
      }),
      canReadClients
        ? database.client.findMany({
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
            select: {
              appointments: {
                orderBy: { startsAt: "asc" },
                select: { serviceNameSnapshot: true, startsAt: true, status: true },
                take: 1,
                where: {
                  startsAt: { gt: now },
                  status: { in: [...upcomingClientStatuses] },
                },
              },
              createdAt: true,
              email: true,
              firstName: true,
              guardians: {
                select: {
                  guardian: { select: { firstName: true, lastName: true } },
                  relationship: true,
                },
              },
              id: true,
              lastName: true,
              phone: true,
              preferredName: true,
              status: true,
              type: true,
              updatedAt: true,
            },
            skip,
            take: PAGE_SIZE,
            where: clientWhere,
          })
        : Promise.resolve([]),
      canReadAvailability
        ? database.availabilityRule.findMany({
            orderBy: [{ weekday: "asc" }, { localStartTime: "asc" }],
            select: {
              localEndTime: true,
              localStartTime: true,
              slotIncrementMinutes: true,
              status: true,
              weekday: true,
            },
          })
        : Promise.resolve(null),
      canReadFinance
        ? database.financeLedgerEntry.findMany({
            orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
            select: {
              amountMinor: true,
              client: { select: { firstName: true, lastName: true, preferredName: true } },
              currency: true,
              id: true,
              occurredAt: true,
              type: true,
            },
            take: 8,
          })
        : Promise.resolve(null),
      canReadFinance
        ? database.financeLedgerEntry.groupBy({
            _count: { _all: true },
            _sum: { amountMinor: true },
            by: ["type", "currency"],
            where: {
              occurredAt: { gte: monthRange.start, lt: monthRange.end },
              type: { in: ["PAYMENT", "ACCRUAL"] },
            },
          })
        : Promise.resolve(null),
    ]);

  const appointments = appointmentRows.map((row) => mapAppointmentToHubRecord(row, now, timeZone));
  const clients = clientRows.map((row) => mapClientToHubRecord(row, now, timeZone));
  const availability = availabilityRows ? buildWeeklyAvailability(availabilityRows) : null;
  const finance =
    recentFinanceRows && financeAggregateRows
      ? buildHubFinanceSummary(
          recentFinanceRows,
          {
            accruals: financeAggregateRows
              .filter((row) => row.type === "ACCRUAL")
              .map((row) => ({
                count: row._count._all,
                currency: row.currency,
                totalMinor: row._sum.amountMinor ?? 0n,
              })),
            payments: financeAggregateRows
              .filter((row) => row.type === "PAYMENT")
              .map((row) => ({
                count: row._count._all,
                currency: row.currency,
                totalMinor: row._sum.amountMinor ?? 0n,
              })),
          },
          now,
          timeZone,
        )
      : null;
  const firstVisible = activeTotal === 0 ? 0 : skip + 1;
  const lastVisible = Math.min(skip + PAGE_SIZE, activeTotal);

  return (
    <AdminShell
      email={session.user.email}
      permissions={{
        appointmentsRead: true,
        clientsRead: canReadClients,
        financeRead: canReadFinance,
        servicesRead: canReadAvailability,
        technicalHealthRead: canReadTechnicalHealth,
      }}
      subtitle="Randevu talepleri, danışan kayıtları, müsaitlik ve finans özetleri tek çalışma alanında açılır."
      title="Kayıt merkezi"
    >
      {!isSummarySection ? (
        <section className="admin-panel" aria-labelledby="kayit-merkezi-arama">
          <div className="admin-panel-heading">
            <div>
              <h2 id="kayit-merkezi-arama">Kayıtlarda ara</h2>
              <p>Danışan adı, telefon, e-posta, hizmet veya randevu referansı ile arayın.</p>
            </div>
            <span className="admin-count">{activeTotal} kayıt</span>
          </div>
          <form action="/yonetim/hub" className="admin-client-filter-form" method="get">
            {activeListSection === "danisanlar" ? (
              <input name="bolum" type="hidden" value="danisanlar" />
            ) : null}
            <label>
              Arama
              <input
                defaultValue={query}
                maxLength={100}
                name="q"
                placeholder="Ad, telefon, e-posta veya referans"
                type="search"
              />
            </label>
            <button type="submit">Ara</button>
            {query || currentPage > 1 ? (
              <Link href={listHref({ page: 1, query: "", section: activeListSection })}>
                Temizle
              </Link>
            ) : null}
          </form>
          <div className="admin-list-footer">
            <span>
              {firstVisible}-{lastVisible} arası · Sayfa {currentPage}/{totalPages}
            </span>
            <nav aria-label="Kayıt merkezi sayfaları">
              {currentPage > 1 ? (
                <Link href={listHref({ page: currentPage - 1, query, section: activeListSection })}>
                  ← Önceki
                </Link>
              ) : null}
              {currentPage < totalPages ? (
                <Link
                  className="primary-button"
                  href={listHref({ page: currentPage + 1, query, section: activeListSection })}
                >
                  Sonraki →
                </Link>
              ) : null}
            </nav>
          </div>
        </section>
      ) : null}

      <RecordCenter
        appointments={appointments}
        availability={availability}
        canManage={canManage}
        canReadClients={canReadClients}
        clients={clients}
        finance={finance}
      />
    </AdminShell>
  );
}
