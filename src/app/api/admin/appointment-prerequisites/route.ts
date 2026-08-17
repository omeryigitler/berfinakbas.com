import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAppointmentAccessWhere } from "@/lib/booking/appointment-api-access";
import { getDatabase } from "@/lib/db";

function forbidden() {
  return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();

  const accessWhere = getAppointmentAccessWhere({
    mode: "manage",
    roles: session.user.roles,
    userId: session.user.id,
  });
  if (accessWhere === null) return forbidden();

  const database = getDatabase();
  const [clients, practitioners, services] = await Promise.all([
    database.client.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        firstName: true,
        guardians: {
          orderBy: { isPrimary: "desc" },
          select: { guardianId: true, isPrimary: true },
          take: 1,
        },
        id: true,
        lastName: true,
        type: true,
      },
      take: 200,
      where: { status: { in: ["PROSPECTIVE", "ACTIVE"] } },
    }),
    database.practitioner.findMany({
      orderBy: { displayName: "asc" },
      select: { displayName: true, id: true, timeZone: true },
      where: {
        status: "ACTIVE",
        ...(Object.keys(accessWhere).length === 0 ? {} : { userId: session.user.id }),
      },
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
