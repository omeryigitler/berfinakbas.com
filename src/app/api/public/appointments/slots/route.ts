import { NextResponse } from "next/server";

import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import {
  listPublicAppointmentSlots,
  publicAppointmentSlotsQuerySchema,
} from "@/lib/booking/public-appointment-slots-service";
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

  if (!environment.PUBLIC_APPOINTMENT_SLOTS_ENABLED) {
    return publicJsonResponse(
      correlationId,
      {
        code: "BOOKING_SLOTS_DISABLED",
        error: "Randevu saatleri şu anda kullanıma açık değil.",
      },
      404,
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const keys = [...searchParams.keys()];
  const hasDuplicateKey = new Set(keys).size !== keys.length;
  const parsed = publicAppointmentSlotsQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  );
  if (hasDuplicateKey) {
    return publicJsonResponse(
      correlationId,
      {
        code: "INVALID_REQUEST",
        error: "Randevu saati sorgusu geçersiz.",
        issues: [{ code: "custom", path: "" }],
      },
      400,
    );
  }
  if (!parsed.success) {
    return publicJsonResponse(
      correlationId,
      {
        code: "INVALID_REQUEST",
        error: "Randevu saati sorgusu geçersiz.",
        issues: parsed.error.issues.map((issue) => ({
          code: issue.code,
          path: issue.path.join("."),
        })),
      },
      400,
    );
  }

  try {
    const slots = await listPublicAppointmentSlots(parsed.data);
    return publicJsonResponse(
      correlationId,
      {
        data: slots.map((slot) => ({
          endsAt: slot.endsAt.toISOString(),
          startsAt: slot.startsAt.toISOString(),
        })),
      },
      200,
    );
  } catch (error) {
    if (error instanceof BookingResourceUnavailableError) {
      return publicJsonResponse(correlationId, { code: error.code, error: error.message }, 409);
    }
    throw error;
  }
}
