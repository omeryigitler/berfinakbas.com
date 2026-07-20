import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { hasTrustedOrigin } from "@/lib/request-security";

const defaultService = {
  approvalMode: "MANUAL" as const,
  defaultBufferAfterMinutes: 0,
  defaultBufferBeforeMinutes: 0,
  defaultDurationMinutes: 15,
  locationType: "HYBRID" as const,
  name: "İlk görüşme",
  publicDescription: "Admin paneli üzerinden oluşturulan varsayılan ilk görüşme hizmeti.",
  publicVisible: false,
  slug: "ilk-gorusme",
  sortOrder: 0,
  status: "ACTIVE" as const,
};

function forbidden() {
  return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
}

function displayNameFromSession(name?: string | null): string {
  const value = name?.trim();
  return value && value.length > 1 ? value : "Berfin Akbaş";
}

async function requireAppointmentManager() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "appointments:manage")
  ) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAppointmentManager();
  if (!session) return forbidden();

  const database = getDatabase();
  const [clients, practitioners, services] = await Promise.all([
    database.client.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { firstName: true, id: true, lastName: true, type: true },
      take: 200,
      where: { status: { in: ["PROSPECTIVE", "ACTIVE"] } },
    }),
    database.practitioner.findMany({
      orderBy: { displayName: "asc" },
      select: { displayName: true, id: true, timeZone: true },
      where: { status: "ACTIVE" },
    }),
    database.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        defaultDurationMinutes: true,
        id: true,
        locationType: true,
        name: true,
      },
      where: { status: "ACTIVE" },
    }),
  ]);

  return NextResponse.json(
    { data: { clients, practitioners, services } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await requireAppointmentManager();
  if (!session) return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json({ error: "Güvenilmeyen istek kaynağı." }, { status: 403 });
  }

  const database = getDatabase();

  const result = await database.$transaction(async (transaction) => {
    const [activeServiceCount, activePractitionerCount] = await Promise.all([
      transaction.service.count({ where: { status: "ACTIVE" } }),
      transaction.practitioner.count({ where: { status: "ACTIVE" } }),
    ]);

    const service =
      activeServiceCount > 0
        ? null
        : await transaction.service.upsert({
            create: defaultService,
            select: { id: true, name: true },
            update: {
              defaultDurationMinutes: defaultService.defaultDurationMinutes,
              locationType: defaultService.locationType,
              name: defaultService.name,
              status: "ACTIVE",
            },
            where: { slug: defaultService.slug },
          });

    const existingPractitioner = await transaction.practitioner.findUnique({
      select: { id: true },
      where: { userId: session.user.id },
    });

    const practitioner =
      activePractitionerCount > 0
        ? null
        : existingPractitioner
          ? await transaction.practitioner.update({
              data: { status: "ACTIVE" },
              select: { id: true, displayName: true },
              where: { id: existingPractitioner.id },
            })
          : await transaction.practitioner.create({
              data: {
                displayName: displayNameFromSession(session.user.name),
                status: "ACTIVE",
                timeZone: environment.BUSINESS_TIME_ZONE,
                userId: session.user.id,
              },
              select: { id: true, displayName: true },
            });

    return {
      practitionerCreated: Boolean(practitioner),
      serviceCreated: Boolean(service),
    };
  });

  return NextResponse.json({ data: result });
}