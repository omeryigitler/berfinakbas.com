import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import { getPublicBookingBootstrap } from "@/lib/booking/public-booking-service";
import { resolvePublicBookingRuntime } from "@/lib/booking/public-booking-runtime";
import { getServerEnvironment } from "@/lib/env";
import { publicJsonResponse } from "@/lib/http/public-api";
import { getSafeCorrelationId } from "@/lib/request-security";

export async function GET(request: Request) {
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const environment = getServerEnvironment();
  const runtime = await resolvePublicBookingRuntime();

  if (!runtime.practitionerId) {
    return publicJsonResponse(
      correlationId,
      {
        code: "BOOKING_FLOW_DISABLED",
        error: "Aktif randevu uzmanı bulunamadı.",
      },
      404,
    );
  }

  try {
    const bootstrap = await getPublicBookingBootstrap(
      runtime.practitionerId,
      environment.BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES,
    );
    return publicJsonResponse(correlationId, { data: bootstrap }, 200);
  } catch (error) {
    if (error instanceof BookingResourceUnavailableError) {
      return publicJsonResponse(correlationId, { code: error.code, error: error.message }, 409);
    }
    throw error;
  }
}
