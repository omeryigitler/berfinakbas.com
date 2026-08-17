import { NextResponse } from "next/server";
import { rolePermissions } from "@/domain/auth/permissions";
import { getAppointmentAccessWhere } from "@/lib/booking/appointment-api-access";
import { getDatabase } from "@/lib/db";
import { can, forbidden, readSettings, type ActiveSession } from "./management-hub-common";

function integrationStatus() {
  return {
    googleAuth: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    googleCalendar: false,
    email: Boolean(process.env.RESEND_API_KEY),
    storage: Boolean(
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}

export async function readSystemModule(session: ActiveSession, module: string) {
  const database = getDatabase();

  if (module === "raporlar") {
    const appointmentAccessWhere = getAppointmentAccessWhere({
      mode: "read",
      roles: session.user.roles,
      userId: session.user.id,
    });
    const canReadClients = can(session, "clients:read");
    const canReadFinance = can(session, "finance:read");
    const canReadServices = can(session, "services:read");
    const [appointments, clients, plans, services, finance] = await Promise.all([
      appointmentAccessWhere !== null
        ? database.appointment.groupBy({
            by: ["status"],
            _count: { _all: true },
            where: appointmentAccessWhere,
          })
        : [],
      canReadClients ? database.client.groupBy({ by: ["status"], _count: { _all: true } }) : [],
      canReadFinance ? database.clientPlan.groupBy({ by: ["status"], _count: { _all: true } }) : [],
      canReadServices ? database.service.groupBy({ by: ["status"], _count: { _all: true } }) : [],
      canReadFinance
        ? database.financeLedgerEntry.groupBy({
            by: ["currency", "type"],
            _sum: { amountMinor: true },
            _count: { _all: true },
          })
        : [],
    ]);
    return NextResponse.json({
      data: {
        appointments,
        clients,
        plans,
        services,
        finance: finance.map((row) => ({
          ...row,
          _sum: { amountMinor: row._sum.amountMinor?.toString() ?? "0" },
        })),
      },
    });
  }

  if (module === "kullanicilar-yetkiler") {
    if (!can(session, "users:manage")) return forbidden();
    const users = await database.user.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }, { email: "asc" }],
      select: {
        createdAt: true,
        email: true,
        id: true,
        lastLoginAt: true,
        name: true,
        roles: { select: { assignedAt: true, role: { select: { key: true, name: true } } } },
        status: true,
      },
    });
    const rolePermissionMatrix = Object.fromEntries(
      Object.entries(rolePermissions).map(([role, permissions]) => [role, [...permissions]]),
    );
    return NextResponse.json({
      data: { users, currentUserId: session.user.id, rolePermissions: rolePermissionMatrix },
    });
  }

  if (module === "ayarlar") {
    if (!can(session, "services:read")) return forbidden();
    const settings = await readSettings([
      "BUSINESS_PROFILE",
      "BOOKING_RULES",
      "FIRST_MEETING_SETTINGS",
      "NOTIFICATION_SETTINGS",
      "PRIVACY_SETTINGS",
      "APPEARANCE_SETTINGS",
    ]);
    return NextResponse.json({ data: { settings, integrations: integrationStatus() } });
  }

  if (module === "arsiv") {
    if (!can(session, "clients:read")) return forbidden();
    const [clients, services, audit] = await Promise.all([
      database.client.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          firstName: true,
          id: true,
          lastName: true,
          status: true,
          type: true,
          updatedAt: true,
        },
        take: 150,
        where: { status: "INACTIVE" },
      }),
      can(session, "services:read")
        ? database.service.findMany({
            orderBy: { updatedAt: "desc" },
            select: { id: true, name: true, status: true, updatedAt: true },
            take: 150,
            where: { status: "INACTIVE" },
          })
        : [],
      can(session, "audit:read")
        ? database.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            select: {
              action: true,
              actor: { select: { email: true, name: true } },
              createdAt: true,
              entityId: true,
              entityType: true,
              id: true,
              reason: true,
            },
            take: 200,
          })
        : [],
    ]);
    return NextResponse.json({ data: { clients, services, audit } });
  }

  return null;
}
