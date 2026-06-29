import { hasPermission, type RoleKey } from "@/domain/auth/permissions";

type AvailabilityAccessInput = Readonly<{
  mode: "manage" | "read";
  practitionerUserId: string;
  roles: readonly RoleKey[];
  userId: string;
}>;

export function canAccessPractitionerAvailability(input: AvailabilityAccessInput): boolean {
  const permission = input.mode === "manage" ? "availability:manage" : "availability:read";
  if (!hasPermission(input.roles, permission)) return false;
  if (input.roles.includes("SUPER_ADMIN")) return true;

  return input.roles.includes("THERAPIST") && input.userId === input.practitionerUserId;
}
