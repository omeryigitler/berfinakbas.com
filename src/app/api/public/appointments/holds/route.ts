import { z } from "zod";

import {
  BookingResourceUnavailableError,
  SlotConflictError,
} from "@/domain/booking/appointment-hold";
import { createAppointmentHold } from "@/lib/booking/appointment-hold-service";
import { resolvePublicBookingRuntime } from "@/lib/booking/public-booking-runtime";
import { getServerEnvironment } from "@/lib/env";
import {
  isJsonContentType,
  publicJsonResponse,
  readBoundedJsonBody,
  RequestBodyTooLargeError,
} from "@/lib/http/public-api";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";
import { checkPublicBotProtection } from "@/lib/security/public-bot-protection";

const MAX_REQUEST_BODY_BYTES = 4 * 1_024;

const appointmentHoldPayloadSchema = z
  .object({
    practitionerId: z.uuid(),
    serviceId: z.uuid(),
    startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  })
  .strict();

export async function POST(request: Request) {
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const environment = getServerEnvironment();
  const runtime = await resolvePublicBookingRuntime();

  if (!runtime.practitionerId) {
    return publicJsonResponse(
      correlationId,
      {
        code: "BOOKING_HOLDS_DISABLED",
        error: "Aktif randevu uzmanı bulunamadı.",
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

  const botProtection = await checkPublicBotProtection();
  if (botProtection !== "allowed") {
    return publicJsonResponse(
      correlationId,
      botProtection === "blocked"
        ? {
            code: "AUTOMATED_REQUEST_REJECTED",
            error: "Otomatik istek reddedildi.",
          }
        : {
            code: "BOT_PROTECTION_UNAVAILABLE",
            error: "Randevu koruması geçici olarak kullanılamıyor.",
          },
      botProtection === "blocked" ? 403 : 503,
    );
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return publicJsonResponse(
      correlationId,
      {
        code: "UNSUPPORTED_MEDIA_TYPE",
        error: "İstek gövdesi JSON olmalıdır.",
      },
      415,
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJsonBody(request, MAX_REQUEST_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return publicJsonResponse(
        correlationId,
        {
          code: "BODY_TOO_LARGE",
          error: "İstek gövdesi izin verilen sınırı aşıyor.",
        },
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

  if (parsed.data.practitionerId !== runtime.practitionerId) {
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
