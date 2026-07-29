import { hasPermission, type RoleKey } from "@/domain/auth/permissions";

export function canAccessAppointmentCompletionPlans(roles: readonly RoleKey[]): boolean {
  return hasPermission(roles, "finance:read");
}

export function getVisibleConsumedPlanId(
  roles: readonly RoleKey[],
  consumedPlanId: string | null,
): string | null {
  return canAccessAppointmentCompletionPlans(roles) ? consumedPlanId : null;
}
