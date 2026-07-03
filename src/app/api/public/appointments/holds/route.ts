import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BookingResourceUnavailableError,
  SlotConflictError,
} from "@/domain/booking/appointment-hold";
import { createAppointmentHold } from "@/lib/booking/appointment-hold-service";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const MAX_REQUEST_BODY_BYTES = 4 * 1_024;

const appointmentHoldPayloadSchema = z
  .object({
    practitionerId: z.uuid(),
    serviceId: z.uuid(),
    startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  })
  .strict();

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

  if (
    !environment.PUBLIC_BOOKING_FLOW_ENABLED ||
    !environment.PUBLIC_APPOINTMENT_HOLDS_ENABLED ||
    !environment.BOOKING_PUBLIC_PRACTITIONER_ID ||
    environment.BOOKING_HOLD_DURATION_MINUTES === undefined
  ) {
    return publicJsonResponse(
      correlationId,
      {
        code: "BOOKING_HOLDS_DISABLED",
        error: "Randevu saati ayırma şu anda kullanıma açık değil.",
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

  const parsed = appointmentHoldPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return publicJsonResponse(
      correlationId,
      {
        code: "INVALID_REQUEST",
        error: "Randevu saati ayırma alanları geçersiz.",
        issues: parsed.error.issues.map((issue) => ({
          code: issue.code,
          path: issue.path.join("."),
        })),
      },
      400,
    );
  }

  if (parsed.data.practitionerId !== environment.BOOKING_PUBLIC_PRACTITIONER_ID) {
    const error = new BookingResourceUnavailableError();
    return publicJsonResponse(correlationId, { code: error.code, error: error.message }, 409);
  }

  try {
    const hold = await createAppointmentHold({ ...parsed.data, correlationId });
    return publicJsonResponse(
      correlationId,
      {
        data: {
          endsAt: hold.endsAt.toISOString(),
          expiresAt: hold.expiresAt.toISOString(),
          holdId: hold.holdId,
          holderToken: hold.holderToken,
          startsAt: hold.startsAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    if (error instanceof SlotConflictError || error instanceof BookingResourceUnavailableError) {
      return publicJsonResponse(correlationId, { code: error.code, error: error.message }, 409);
    }
    throw error;
  }
}
