import { BookingResourceUnavailableError } from "@/domain/booking/appointment-hold";
import {
  listPublicAppointmentSlots,
  publicAppointmentSlotsQuerySchema,
} from "@/lib/booking/public-appointment-slots-service";
import { resolvePublicBookingRuntime } from "@/lib/booking/public-booking-runtime";
import { publicJsonResponse } from "@/lib/http/public-api";
import { getSafeCorrelationId } from "@/lib/request-security";

export async function GET(request: Request) {
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));
  const runtime = await resolvePublicBookingRuntime();

  if (!runtime.enabled || !runtime.practitionerId) {
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

  if (parsed.data.practitionerId !== runtime.practitionerId) {
    const error = new BookingResourceUnavailableError();
    return publicJsonResponse(correlationId, { code: error.code, error: error.message }, 409);
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
