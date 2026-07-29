import { NextResponse } from "next/server";

import { GET as getClients } from "@/app/api/admin/clients/route";
import {
  PROFILE_PREFIX,
  asJsonRecord,
  booleanOrDefault,
} from "@/lib/clients/client-dashboard-shared";
import { getDatabase } from "@/lib/db";

export async function GET(request: Request) {
  const response = await getClients(request);
  if (!response.ok) return response;

  const payload = (await response.json()) as { data?: Array<Record<string, unknown>> };
  const clients = Array.isArray(payload.data) ? payload.data : [];
  const ids = clients
    .map((client) => (typeof client.id === "string" ? client.id : null))
    .filter((id): id is string => Boolean(id));

  const settings = ids.length
    ? await getDatabase().operationalSetting.findMany({
        select: { key: true, value: true },
        where: { key: { in: ids.map((id) => `${PROFILE_PREFIX}${id}`) } },
      })
    : [];
  const archivedById = new Map(
    settings.map((setting) => [
      setting.key.slice(PROFILE_PREFIX.length),
      booleanOrDefault(asJsonRecord(setting.value).archived, false),
    ]),
  );

  return NextResponse.json(
    {
      data: clients.map((client) => {
        const id = typeof client.id === "string" ? client.id : "";
        const archived = archivedById.get(id) === true;
        return { ...client, archived, status: archived ? "ARCHIVED" : client.status };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
