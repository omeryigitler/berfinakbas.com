import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";

export type PublicBookingRuntime = Readonly<{
  enabled: boolean;
  holdDurationMinutes: number;
  practitionerId: string | null;
}>;

export async function resolvePublicBookingRuntime(): Promise<PublicBookingRuntime> {
  const environment = getServerEnvironment();
  const productionTestPhase = environment.NODE_ENV === "production";
  const configuredEnabled =
    environment.PUBLIC_BOOKING_FLOW_ENABLED &&
    environment.PUBLIC_APPOINTMENT_SLOTS_ENABLED &&
    environment.PUBLIC_APPOINTMENT_HOLDS_ENABLED &&
    environment.PUBLIC_APPOINTMENT_REQUESTS_ENABLED;
  const enabled = productionTestPhase || configuredEnabled;

  if (environment.BOOKING_PUBLIC_PRACTITIONER_ID) {
    return {
      enabled,
      holdDurationMinutes: environment.BOOKING_HOLD_DURATION_MINUTES ?? 8,
      practitionerId: environment.BOOKING_PUBLIC_PRACTITIONER_ID,
    };
  }

  if (!productionTestPhase) {
    return {
      enabled,
      holdDurationMinutes: environment.BOOKING_HOLD_DURATION_MINUTES ?? 8,
      practitionerId: null,
    };
  }

  const practitioner = await getDatabase().practitioner.findFirst({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
    where: { status: "ACTIVE" },
  });

  return {
    enabled,
    holdDurationMinutes: environment.BOOKING_HOLD_DURATION_MINUTES ?? 8,
    practitionerId: practitioner?.id ?? null,
  };
}
