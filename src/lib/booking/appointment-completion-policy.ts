import { hasPermission, type RoleKey } from "@/domain/auth/permissions";

export function canAccessAppointmentCompletionPlans(roles: readonly RoleKey[]): boolean {
  return hasPermission(roles, "finance:read");
}
