import type { NextRequest } from "next/server";

import { GET as getClientDashboard } from "@/lib/clients/client-dashboard-read";
import { PATCH as patchClientDashboard } from "@/lib/clients/client-dashboard-write";
import { DELETE as deleteClientDashboard } from "@/lib/clients/client-dashboard-delete";

type RouteContext = { params: Promise<{ clientId: string }> };

export function GET(request: NextRequest, context: RouteContext) {
  return getClientDashboard(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return patchClientDashboard(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return deleteClientDashboard(request, context);
}
