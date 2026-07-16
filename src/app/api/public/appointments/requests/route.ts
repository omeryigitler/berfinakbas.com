import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import { BookingConsentGateError } from "@/domain/consent/booking-consent";
import {
  AppointmentHoldUnavailableError,
  BookingRequestConflictError,
} from "@/lib/booking/appointment-request-service";
import {
  publicBookingSubmissionPayloadSchema,
  submitPublicBookingRequest,
} from "@/lib/booking/public-booking-service";
import { getServerEnvironment } from "@/lib/env";
import {
  isJsonContentType,
  publicJsonResponse,
  readBoundedJsonBody,
  RequestBodyTooLargeError,
} from "@/lib/http/public-api";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";
import { checkPublicBotProtection } from "@/lib/security/public-bot-protection";

const MAX_REQUEST_BODY_BYTES = 16 * 1_024;

export async function POST(request: Request) {
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const environment = getServerEnvironment();

  if (
    !environment.PUBLIC_BOOKING_FLOW_ENABLED ||
    !environment.PUBLIC_APPOINTMENT_REQUESTS_ENABLED ||
    !environment.BOOKING_PUBLIC_PRACTITIONER_ID
  ) {
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

  const parsed = publicBookingSubmissionPayloadSchema.safeParse(body);
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
    const appointment = await submitPublicBookingRequest(
      { ...parsed.data, correlationId },
      {
        publicPractitionerId: environment.BOOKING_PUBLIC_PRACTITIONER_ID,
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
