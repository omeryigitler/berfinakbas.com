import { NextResponse } from "next/server";
import { getAppointmentAccessWhere } from "@/lib/booking/appointment-api-access";
import { getDatabase } from "@/lib/db";
import {
  appointmentSelect,
  can,
  forbidden,
  readSettings,
  resolvePractitioner,
  type ActiveSession,
} from "./management-hub-common";

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

export async function readOperationModule(session: ActiveSession, module: string) {
  const database = getDatabase();

  if (module === "randevular" || module === "talepler-iletisim") {
    if (!can(session, "appointments:read")) return forbidden();
    const accessWhere = getAppointmentAccessWhere({
      mode: "read",
      roles: session.user.roles,
      userId: session.user.id,
    });
    if (accessWhere === null) return forbidden();
    const statuses =
      module === "talepler-iletisim"
        ? (["REQUESTED", "PENDING_REVIEW", "RESCHEDULE_PROPOSED"] as const)
        : ([
            "REQUESTED",
            "PENDING_REVIEW",
            "CONFIRMED",
            "RESCHEDULE_PROPOSED",
            "REJECTED",
            "COMPLETED",
            "NO_SHOW",
            "CANCELLED_BY_CLIENT",
            "CANCELLED_BY_PRACTITIONER",
            "EXPIRED",
          ] as const);
    const appointments = await database.appointment.findMany({
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      select: appointmentSelect(),
      take: 250,
      where: { ...accessWhere, status: { in: [...statuses] } },
    });
    return NextResponse.json({ data: { appointments } });
  }

  if (module === "takvim-uygunluk") {
    if (!can(session, "availability:read")) return forbidden();
    const practitioner = await resolvePractitioner(session);
    const settings = await readSettings(["BOOKING_RULES", "FIRST_MEETING_SETTINGS"]);
    if (!practitioner)
      return NextResponse.json({
        data: {
          practitioner: null,
          rules: [],
          exceptions: [],
          services: [],
          settings,
          integrations: integrationStatus(),
        },
      });
    const [rules, exceptions, services] = await Promise.all([
      database.availabilityRule.findMany({
        orderBy: [{ weekday: "asc" }, { localStartTime: "asc" }],
        where: { practitionerId: practitioner.id },
      }),
      database.availabilityException.findMany({
        orderBy: [{ localDate: "asc" }, { localStartTime: "asc" }],
        take: 250,
        where: { practitionerId: practitioner.id },
      }),
      database.service.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          defaultDurationMinutes: true,
          id: true,
          locationType: true,
          name: true,
          status: true,
        },
      }),
    ]);
    return NextResponse.json({
      data: {
        practitioner,
        rules,
        exceptions,
        services,
        settings,
        integrations: integrationStatus(),
      },
    });
  }

  if (module === "hizmetler") {
    if (!can(session, "services:read")) return forbidden();
    const services = await database.service.findMany({
      include: { policies: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ data: { services } });
  }

  if (module === "odeme-planlar") {
    if (!can(session, "finance:read")) return forbidden();
    const plans = await database.clientPlan.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        client: { select: { firstName: true, id: true, lastName: true } },
        createdAt: true,
        currency: true,
        id: true,
        installments: {
          orderBy: { sequence: "asc" },
          select: { amountDueMinor: true, dueDate: true, id: true, sequence: true },
        },
        ledgerEntries: {
          orderBy: { occurredAt: "desc" },
          select: {
            amountMinor: true,
            id: true,
            note: true,
            occurredAt: true,
            reversedBy: { select: { id: true } },
            type: true,
          },
        },
        name: true,
        sessionCount: true,
        sessionDurationMinutes: true,
        status: true,
        totalAmountMinor: true,
        validFrom: true,
        validUntil: true,
      },
      take: 250,
    });
    return NextResponse.json({
      data: {
        plans: plans.map((plan) => ({
          ...plan,
          createdAt: plan.createdAt.toISOString(),
          totalAmountMinor: plan.totalAmountMinor.toString(),
          installments: plan.installments.map((item) => ({
            ...item,
            amountDueMinor: item.amountDueMinor.toString(),
          })),
          ledgerEntries: plan.ledgerEntries.map((item) => ({
            ...item,
            amountMinor: item.amountMinor.toString(),
            occurredAt: item.occurredAt.toISOString(),
            isReversed: Boolean(item.reversedBy),
            reversedBy: undefined,
          })),
        })),
      },
    });
  }

  if (module === "pdf-kaynaklar") {
    if (!can(session, "services:read")) return forbidden();
    const settings = await readSettings(["PDF_RESOURCE_LIBRARY"]);
    return NextResponse.json({ data: { settings } });
  }

  return null;
}
