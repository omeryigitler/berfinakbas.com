import { hasPermission, type RoleKey } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";

export async function canManageAppointmentApi(input: {
  appointmentId: string;
  roles: readonly RoleKey[];
  userId: string;
}): Promise<boolean> {
  if (!hasPermission(input.roles, "appointments:manage")) return false;

  if (input.roles.includes("SUPER_ADMIN") || input.roles.includes("ASSISTANT")) {
    return true;
  }
  if (!input.roles.includes("THERAPIST")) return false;

  const appointment = await getDatabase().appointment.findFirst({
    select: { id: true },
    where: {
      id: input.appointmentId,
      practitioner: { is: { userId: input.userId } },
    },
  });

  return appointment !== null;
}
