export const roleKeys = ["SUPER_ADMIN", "THERAPIST", "ASSISTANT", "FINANCE", "DEVELOPER"] as const;

export type RoleKey = (typeof roleKeys)[number];

export const permissions = [
  "appointments:read",
  "appointments:manage",
  "availability:read",
  "availability:manage",
  "clients:read",
  "clients:manage",
  "consents:read",
  "consents:manage",
  "services:read",
  "services:manage",
  "finance:read",
  "finance:manage",
  "users:manage",
  "audit:read",
  "technical-health:read",
] as const;

export type Permission = (typeof permissions)[number];

const allPermissions = new Set<Permission>(permissions);

export const rolePermissions: Record<RoleKey, ReadonlySet<Permission>> = {
  SUPER_ADMIN: allPermissions,
  THERAPIST: new Set([
    "appointments:read",
    "appointments:manage",
    "availability:read",
    "availability:manage",
    "clients:read",
    "clients:manage",
    "consents:read",
    "services:read",
    "finance:read",
    "audit:read",
    "technical-health:read",
  ]),
  ASSISTANT: new Set([
    "appointments:read",
    "appointments:manage",
    "clients:read",
    "consents:read",
    "services:read",
  ]),
  FINANCE: new Set(["clients:read", "finance:read", "finance:manage"]),
  DEVELOPER: new Set(["technical-health:read"]),
};

export function hasPermission(roles: readonly RoleKey[], permission: Permission): boolean {
  return roles.some((role) => rolePermissions[role].has(permission));
}
