import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { canAccessAvailabilityApi } from "@/lib/availability/availability-api-access";
import {
  AvailabilityPractitionerUnavailableError,
  availabilityRuleMutationRequestSchema,
  createAvailabilityRule,
} from "@/lib/availability/availability-service";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const practitionerIdSchema = z.uuid();

function forbidden() {
  return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();

  const parsedPractitionerId = practitionerIdSchema.safeParse(
    new URL(request.url).searchParams.get("practitionerId"),
  );
  if (!parsedPractitionerId.success) {
    return NextResponse.json({ error: "Uzman kimliği geçersiz." }, { status: 400 });
  }
  if (
    !(await canAccessAvailabilityApi({
      mode: "read",
      practitionerId: parsedPractitionerId.data,
      roles: session.user.roles,
      userId: session.user.id,
    }))
  )
    return forbidden();

  const rules = await getDatabase().availabilityRule.findMany({
    orderBy: [{ weekday: "asc" }, { localStartTime: "asc" }, { createdAt: "asc" }],
    where: { practitionerId: parsedPractitionerId.data },
  });

  return NextResponse.json({ data: rules });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") return forbidden();

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json({ error: "Güvenilmeyen istek kaynağı." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi geçerli JSON olmalıdır." }, { status: 400 });
  }
  const parsed = availabilityRuleMutationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Çalışma kuralı geçersiz.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (
    !(await canAccessAvailabilityApi({
      mode: "manage",
      practitionerId: parsed.data.rule.practitionerId,
      roles: session.user.roles,
      userId: session.user.id,
    }))
  )
    return forbidden();

  try {
    const rule = await createAvailabilityRule({
      ...parsed.data,
      actorUserId: session.user.id,
      correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
    });
    return NextResponse.json({ data: rule }, { status: 201 });
  } catch (error) {
    if (error instanceof AvailabilityPractitionerUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
