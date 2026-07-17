import type { CreateClientPayload } from "./client-management";

export type StoredClientCreateReplay = Readonly<{
  birthYear: number | null;
  email: string | null;
  firstName: string;
  guardians: readonly Readonly<{
    guardianId: string;
    relationship: string;
    guardian: Readonly<{
      email: string | null;
      firstName: string;
      lastName: string;
      phone: string;
    }>;
  }>[];
  lastName: string;
  phone: string | null;
  preferredName: string | null;
  status: "ACTIVE" | "INACTIVE" | "PROSPECTIVE";
  type: "ADULT" | "CHILD";
}>;

export function matchesClientCreateReplay(
  existing: StoredClientCreateReplay,
  payload: CreateClientPayload,
): boolean {
  const clientMatches =
    existing.birthYear === payload.birthYear &&
    existing.email === payload.email &&
    existing.firstName === payload.firstName &&
    existing.lastName === payload.lastName &&
    existing.phone === payload.phone &&
    existing.preferredName === payload.preferredName &&
    existing.status === payload.status &&
    existing.type === payload.type;
  if (!clientMatches) return false;
  if (payload.type === "ADULT") return true;

  if (payload.guardianMode === "EXISTING") {
    return existing.guardians.some(
      (relation) =>
        relation.guardianId === payload.guardianId &&
        relation.relationship === payload.relationship,
    );
  }

  if (payload.guardianMode === "NEW") {
    return existing.guardians.some(
      (relation) =>
        relation.relationship === payload.relationship &&
        relation.guardian.email === payload.guardianEmail &&
        relation.guardian.firstName === payload.guardianFirstName &&
        relation.guardian.lastName === payload.guardianLastName &&
        relation.guardian.phone === payload.guardianPhone,
    );
  }

  return false;
}
