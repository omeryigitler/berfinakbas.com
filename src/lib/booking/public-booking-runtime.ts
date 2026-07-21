import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";

export type PublicBookingRuntime = Readonly<{
  holdDurationMinutes: number;
  practitionerId: string | null;
}>;

export async function resolvePublicBookingRuntime(): Promise<PublicBookingRuntime> {
  const environment = getServerEnvironment();

  if (environment.BOOKING_PUBLIC_PRACTITIONER_ID) {
    return {
      holdDurationMinutes: environment.BOOKING_HOLD_DURATION_MINUTES ?? 8,
      practitionerId: environment.BOOKING_PUBLIC_PRACTITIONER_ID,
    };
  }

  const practitioner = await getDatabase().practitioner.findFirst({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
    where: { status: "ACTIVE" },
  });

  return {
    holdDurationMinutes: environment.BOOKING_HOLD_DURATION_MINUTES ?? 8,
    practitionerId: practitioner?.id ?? null,
  };
}
