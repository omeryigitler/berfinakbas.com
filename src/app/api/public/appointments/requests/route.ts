import { NextResponse } from "next/server";

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import { BookingConsentGateError } from "@/domain/consent/booking-consent";
import {
  AppointmentHoldUnavailableError,
  appointmentRequestPayloadSchema,
  BookingRequestConflictError,
  createAppointmentRequest,
} from "@/lib/booking/appointment-request-service";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const MAX_REQUEST_BODY_BYTES = 16 * 1_024;

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

function isJsonContentType(value: string | null): boolean {
  return value?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

function publicJsonResponse(correlationId: string, body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
      "X-Correlation-ID": correlationId,
    },
    status,
  });
}

export async function POST(request: Request) {
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const environment = getServerEnvironment();

  if (!environment.PUBLIC_APPOINTMENT_REQUESTS_ENABLED) {
    return publicJsonResponse(
      correlationId,
      {
        code: "BOOKING_REQUESTS_DISABLED",
        error: "Randevu talebi şu anda kullanıma açık değil.",
      },
      404,
    );
  }

  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return publicJsonResponse(
      correlationId,
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      403,
    );
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return publicJsonResponse(
      correlationId,
      { code: "UNSUPPORTED_MEDIA_TYPE", error: "İstek gövdesi JSON olmalıdır." },
      415,
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return publicJsonResponse(
        correlationId,
        { code: "BODY_TOO_LARGE", error: "İstek gövdesi izin verilen sınırı aşıyor." },
        413,
      );
    }
    return publicJsonResponse(
      correlationId,
      { code: "INVALID_JSON", error: "İstek gövdesi geçerli JSON olmalıdır." },
      400,
    );
  }

  const parsed = appointmentRequestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return publicJsonResponse(
      correlationId,
      {
        code: "INVALID_REQUEST",
        error: "Randevu talebi alanları geçersiz.",
        issues: parsed.error.issues.map((issue) => ({
          code: issue.code,
          path: issue.path.join("."),
        })),
      },
      400,
    );
  }

  try {
    const appointment = await createAppointmentRequest(
      { ...parsed.data, correlationId },
      {
        requiredExplicitConsentDocumentTypes:
          environment.BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES,
      },
    );
    return publicJsonResponse(correlationId, { data: appointment }, 201);
  } catch (error) {
    if (error instanceof BookingConsentGateError) {
      return publicJsonResponse(
        correlationId,
        { code: error.code, error: error.message, issues: error.issues },
        422,
      );
    }
    if (
      error instanceof AppointmentHoldUnavailableError ||
      error instanceof BookingRequestConflictError ||
      error instanceof BookingResourceUnavailableError
    ) {
      return publicJsonResponse(correlationId, { code: error.code, error: error.message }, 409);
    }
    throw error;
  }
}
