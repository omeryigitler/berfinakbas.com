import { NextResponse } from "next/server";

import { hasPermission } from "@/domain/auth/permissions";
import { buildClientProfileFinanceSummary } from "@/domain/clients/client-profile-summary";
import { calculateLedgerBalance } from "@/domain/finance/finance-operations";
import { listStoredClientDocuments } from "@/lib/clients/client-document-store";
import { getDatabase } from "@/lib/db";
import {
  UPCOMING_APPOINTMENT_STATUSES,
  PROFILE_PREFIX,
  type RouteContext,
  asJsonRecord,
  booleanOrDefault,
  clientAppointmentSelect,
  forbidden,
  notFound,
  requireClientAccess,
  serializeAppointment,
  textOrNull,
} from "@/lib/clients/client-dashboard-shared";

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireClientAccess("clients:read");
  if (!session) return forbidden();

  const canReadFinance = hasPermission(session.user.roles, "finance:read");
  const { clientId } = await context.params;
  const now = new Date();
  const database = getDatabase();

  const client = await database.client.findUnique({
    select: {
      birthYear: true,
      contactLogs: {
        orderBy: { occurredAt: "desc" },
        select: { channel: true, id: true, occurredAt: true, result: true, summary: true },
        take: 50,
      },
      createdAt: true,
      email: true,
      firstName: true,
      guardians: {
        orderBy: { isPrimary: "desc" },
        select: {
          guardian: {
            select: {
              email: true,
              firstName: true,
              id: true,
              lastName: true,
              phone: true,
            },
          },
          isPrimary: true,
          relationship: true,
        },
      },
      id: true,
      lastName: true,
      notes: {
        orderBy: { createdAt: "desc" },
        select: {
          category: true,
          createdAt: true,
          createdBy: { select: { name: true } },
          id: true,
          note: true,
        },
        take: 50,
      },
      phone: true,
      preferredName: true,
      status: true,
      type: true,
      updatedAt: true,
    },
    where: { id: clientId },
  });

  if (!client) return notFound();

  const financeDataPromise = canReadFinance
    ? database.client.findUnique({
        select: {
          financeEntries: {
            orderBy: { occurredAt: "desc" },
            select: {
              amountMinor: true,
              currency: true,
              externalReference: true,
              id: true,
              note: true,
              occurredAt: true,
              paymentMethod: { select: { name: true } },
              plan: { select: { name: true } },
              reversedBy: { select: { id: true } },
              type: true,
            },
            take: 50,
          },
          plans: {
            orderBy: { createdAt: "desc" },
            select: {
              currency: true,
              id: true,
              installments: {
                orderBy: { sequence: "asc" },
                select: {
                  amountDueMinor: true,
                  id: true,
                  ledgerEntries: { select: { amountMinor: true } },
                  sequence: true,
                },
              },
              ledgerEntries: { select: { amountMinor: true } },
              name: true,
              sessionCount: true,
              sessionCreditEntries: { select: { quantityDelta: true } },
              sessionDurationMinutes: true,
              status: true,
              totalAmountMinor: true,
              validFrom: true,
              validUntil: true,
            },
            take: 20,
          },
        },
        where: { id: clientId },
      })
    : Promise.resolve(null);

  const [
    profileSetting,
    documentsRaw,
    pastAppointments,
    upcomingAppointments,
    completedAppointments,
    financeData,
  ] = await Promise.all([
    database.operationalSetting.findUnique({
      select: { value: true },
      where: { key: `${PROFILE_PREFIX}${clientId}` },
    }),
    listStoredClientDocuments(clientId),
    database.appointment.findMany({
      orderBy: { startsAt: "desc" },
      select: clientAppointmentSelect,
      take: 10,
      where: { clientId, startsAt: { lt: now } },
    }),
    database.appointment.findMany({
      orderBy: { startsAt: "asc" },
      select: clientAppointmentSelect,
      take: 10,
      where: {
        clientId,
        startsAt: { gte: now },
        status: { in: [...UPCOMING_APPOINTMENT_STATUSES] },
      },
    }),
    database.appointment.count({ where: { clientId, status: "COMPLETED" } }),
    financeDataPromise,
  ]);

  const profile = asJsonRecord(profileSetting?.value);
  const archived = booleanOrDefault(profile.archived, false);
  const documents = documentsRaw.map((document) => ({
    category: document.category,
    createdAt: document.createdAt,
    downloadUrl: document.hasContent
      ? `/api/admin/clients/${clientId}/documents/${document.id}`
      : document.url,
    fileName: document.fileName,
    id: document.id,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    title: document.title,
    url: document.url,
  }));

  const appointments = [...upcomingAppointments, ...pastAppointments].map(serializeAppointment);
  const nextAppointment = upcomingAppointments[0]
    ? serializeAppointment(upcomingAppointments[0])
    : null;
  const lastCompletedAppointment = pastAppointments.find(
    (appointment) => appointment.status === "COMPLETED",
  );
  const lastVisit = lastCompletedAppointment
    ? serializeAppointment(lastCompletedAppointment)
    : null;

  const financeEntriesRaw = financeData?.financeEntries ?? [];
  const plansRaw = financeData?.plans ?? [];
  const plans = plansRaw.map(
    ({ ledgerEntries, sessionCreditEntries, installments, ...plan }) => ({
      ...plan,
      balanceMinor: calculateLedgerBalance(ledgerEntries).toString(),
      installments: installments.map((installment) => ({
        id: installment.id,
        sequence: installment.sequence,
        amountDueMinor: installment.amountDueMinor.toString(),
        outstandingMinor: (
          installment.amountDueMinor + calculateLedgerBalance(installment.ledgerEntries)
        ).toString(),
      })),
      remainingSessions: sessionCreditEntries
        .reduce((total, entry) => total + entry.quantityDelta, 0)
        .toString(),
      totalAmountMinor: plan.totalAmountMinor.toString(),
    }),
  );
  const financeSummary = canReadFinance
    ? buildClientProfileFinanceSummary(
        plans.map((plan) => ({
          balanceMinor: plan.balanceMinor,
          currency: plan.currency,
          remainingSessions: plan.remainingSessions,
          status: plan.status,
          totalAmountMinor: plan.totalAmountMinor,
        })),
      )
    : null;

  const score = Math.min(
    100,
    35 +
      (client.phone ? 15 : 0) +
      (client.email ? 15 : 0) +
      Math.min(completedAppointments * 6, 20) +
      Math.min(client.notes.length * 3, 15),
  );

  return NextResponse.json(
    {
      data: {
        ...client,
        address: textOrNull(profile.address),
        appointments,
        archived,
        city: textOrNull(profile.city),
        completedAppointments,
        contactConsent: booleanOrDefault(profile.contactConsent, false),
        country: textOrNull(profile.country),
        district: textOrNull(profile.district),
        documents,
        emergencyContact: textOrNull(profile.emergencyContact),
        financeAccess: canReadFinance,
        financeEntries: canReadFinance
          ? financeEntriesRaw.map((entry) => ({
              ...entry,
              amountMinor: entry.amountMinor.toString(),
              isReversed: Boolean(entry.reversedBy),
              reversedBy: undefined,
            }))
          : [],
        financeSummary,
        lastVisit,
        nextAppointment,
        plans: canReadFinance ? plans : [],
        preferredContactMethod: textOrNull(profile.preferredContactMethod),
        score,
        status: archived ? "ARCHIVED" : client.status,
        whatsapp: textOrNull(profile.whatsapp) ?? client.phone,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
