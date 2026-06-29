import { hasPermission, type Permission, type RoleKey } from "@/domain/auth/permissions";
import type { Prisma } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";

export type AppointmentAccessMode = "manage" | "read";

const permissionByMode = {
  manage: "appointments:manage",
  read: "appointments:read",
} satisfies Record<AppointmentAccessMode, Permission>;

export function getAppointmentAccessWhere(input: {
  mode: AppointmentAccessMode;
  roles: readonly RoleKey[];
  userId: string;
}): Prisma.AppointmentWhereInput | null {
  if (!hasPermission(input.roles, permissionByMode[input.mode])) return null;

  if (input.roles.includes("SUPER_ADMIN") || input.roles.includes("ASSISTANT")) {
    return {};
  }
  if (input.roles.includes("THERAPIST")) {
    return { practitioner: { is: { userId: input.userId } } };
  }

  return null;
}

export async function canManageAppointmentApi(input: {
  appointmentId: string;
  roles: readonly RoleKey[];
  userId: string;
}): Promise<boolean> {
  const accessWhere = getAppointmentAccessWhere({ ...input, mode: "manage" });
  if (accessWhere === null) return false;
  if (Object.keys(accessWhere).length === 0) return true;

  const appointment = await getDatabase().appointment.findFirst({
    select: { id: true },
    where: {
      ...accessWhere,
      id: input.appointmentId,
    },
  });

  return appointment !== null;
}
