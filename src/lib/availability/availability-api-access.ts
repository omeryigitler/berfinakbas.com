import type { RoleKey } from "@/domain/auth/permissions";
import { canAccessPractitionerAvailability } from "@/domain/booking/availability-access";
import { getDatabase } from "@/lib/db";

type AvailabilityApiAccessInput = Readonly<{
  mode: "manage" | "read";
  practitionerId: string;
  roles: readonly RoleKey[];
  userId: string;
}>;

export async function canAccessAvailabilityApi(input: AvailabilityApiAccessInput) {
  const practitioner = await getDatabase().practitioner.findUnique({
    select: { userId: true },
    where: { id: input.practitionerId },
  });
  if (!practitioner) return false;

  return canAccessPractitionerAvailability({
    mode: input.mode,
    practitionerUserId: practitioner.userId,
    roles: input.roles,
    userId: input.userId,
  });
}
