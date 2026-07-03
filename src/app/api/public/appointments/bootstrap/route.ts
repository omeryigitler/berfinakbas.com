import { NextResponse } from "next/server";

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import { getPublicBookingBootstrap } from "@/lib/booking/public-booking-service";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId } from "@/lib/request-security";

function publicJsonResponse(correlationId: string, body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
      "X-Correlation-ID": correlationId,
    },
    status,
  });
}

export async function GET(request: Request) {
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const environment = getServerEnvironment();

  if (
    !environment.PUBLIC_BOOKING_FLOW_ENABLED ||
    !environment.PUBLIC_APPOINTMENT_SLOTS_ENABLED ||
    !environment.PUBLIC_APPOINTMENT_HOLDS_ENABLED ||
    !environment.PUBLIC_APPOINTMENT_REQUESTS_ENABLED ||
    !environment.BOOKING_PUBLIC_PRACTITIONER_ID ||
    environment.BOOKING_HOLD_DURATION_MINUTES === undefined
  ) {
    return publicJsonResponse(
      correlationId,
      {
        code: "BOOKING_FLOW_DISABLED",
        error: "Randevu talep akışı şu anda kullanıma açık değil.",
      },
      404,
    );
  }

  try {
    const bootstrap = await getPublicBookingBootstrap(
      environment.BOOKING_PUBLIC_PRACTITIONER_ID,
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
