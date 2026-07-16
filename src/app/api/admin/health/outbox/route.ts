import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getOutboxHealth } from "@/lib/integrations/health-service";

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

function unauthorized() {
  return NextResponse.json(
    { code: "UNAUTHORIZED", error: "Bu işlem için kimlik doğrulaması gerekli." },
    { status: 401 },
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return unauthorized();
  }

  if (!hasPermission(session.user.roles, "technical-health:read")) {
    return forbidden();
  }

  const health = await getOutboxHealth();
  return NextResponse.json({ data: health }, { headers: { "Cache-Control": "no-store" } });
}
