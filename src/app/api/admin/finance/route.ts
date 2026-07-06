import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import {
  financeOperationPayloadSchema,
  financeOverviewQuerySchema,
} from "@/domain/finance/finance-operations";
import { getFilteredFinanceOverview } from "@/lib/finance/finance-overview-filter";
import {
  executeFinanceOperation,
  FinanceConflictError,
  FinancePolicyViolationError,
  FinanceResourceNotFoundError,
} from "@/lib/finance/finance-service";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const MAX_REQUEST_BODY_BYTES = 32 * 1_024;

class RequestBodyTooLargeError extends Error {}

async function readBoundedJsonBody(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > MAX_REQUEST_BODY_BYTES) {
    throw new RequestBodyTooLargeError();
  }

  const reader = request.body?.getReader();
  if (!reader) return JSON.parse("");

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let body = "";
  let receivedBytes = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    receivedBytes += chunk.value.byteLength;
    if (receivedBytes > MAX_REQUEST_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new RequestBodyTooLargeError();
    }
    body += decoder.decode(chunk.value, { stream: true });
  }
  body += decoder.decode();
  return JSON.parse(body);
}

function forbidden() {
  return NextResponse.json({ code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." }, { status: 403 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE" || !hasPermission(session.user.roles, "finance:read")) {
    return forbidden();
  }

  const searchParams = new URL(request.url).searchParams;
  const keys = [...searchParams.keys()];
  const parsed = financeOverviewQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (new Set(keys).size !== keys.length || !parsed.success) {
    return NextResponse.json({ code: "INVALID_REQUEST", error: "Finans filtresi geçersiz." }, { status: 400 });
  }

  const overview = await getFilteredFinanceOverview(parsed.data);
  return NextResponse.json({ data: overview }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE" || !hasPermission(session.user.roles, "finance:manage")) {
    return forbidden();
  }

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json({ code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." }, { status: 403 });
  }
  if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
    return NextResponse.json({ code: "UNSUPPORTED_MEDIA_TYPE", error: "İstek gövdesi JSON olmalıdır." }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await readBoundedJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ code: "BODY_TOO_LARGE", error: "İstek gövdesi izin verilen sınırı aşıyor." }, { status: 413 });
    }
    return NextResponse.json({ code: "INVALID_JSON", error: "İstek gövdesi geçerli JSON olmalıdır." }, { status: 400 });
  }

  const parsed = financeOperationPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_REQUEST", error: "Finans işlemi alanları geçersiz." }, { status: 400 });
  }

  try {
    const result = await executeFinanceOperation(parsed.data, {
      actorUserId: session.user.id,
      correlationId: getSafeCorrelationId(request.headers.get("x-correlation-id")),
    });
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
