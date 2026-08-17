import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { getServerEnvironment } from "@/lib/env";
import {
  FinanceConflictError,
  FinancePolicyViolationError,
  FinanceResourceNotFoundError,
} from "@/lib/finance/finance-service";
import {
  recordSimplePlanPayment,
  simplePlanPaymentSchema,
} from "@/lib/finance/simple-plan-payment-service";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const paymentRequestSchema = simplePlanPaymentSchema.omit({ idempotencyKey: true });

function forbidden() {
  return NextResponse.json({ code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." }, { status: 403 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "finance:manage")
  ) {
    return forbidden();
  }

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json(
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", error: "İstek gövdesi geçerli JSON olmalıdır." },
      { status: 400 },
    );
  }

  const parsed = paymentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", error: "Ödeme bilgileri geçersiz." },
      { status: 400 },
    );
  }

  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  try {
    const result = await recordSimplePlanPayment(
      { ...parsed.data, amountMinor: parsed.data.amountMinor.toString(), idempotencyKey: `simple-payment:${correlationId}` },
      { actorUserId: session.user.id, correlationId },
    );
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceResourceNotFoundError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: 404 });
    }
    if (error instanceof FinancePolicyViolationError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: 422 });
    }
    if (error instanceof FinanceConflictError) {
      return NextResponse.json({ code: error.code, error: error.message }, { status: 409 });
    }
    throw error;
  }
}
