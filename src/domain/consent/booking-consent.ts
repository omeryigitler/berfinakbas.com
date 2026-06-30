export const mandatoryBookingDocumentTypes = ["PRIVACY_NOTICE", "BOOKING_TERMS"] as const;

export type BookingConsentStage = "CONFIRM" | "REQUEST";
export type BookingConsentStatus = "EXPIRED" | "GRANTED" | "WITHDRAWN";
export type BookingClientType = "ADULT" | "CHILD";

export type BookingConsentRecord = Readonly<{
  documentType: string;
  grantedByGuardianId: string | null;
  status: BookingConsentStatus;
  subjectClientId: string;
}>;

export type BookingConsentIssue = Readonly<{
  code:
    | "ADULT_GUARDIAN_NOT_ALLOWED"
    | "DOCUMENT_GRANTOR_MISMATCH"
    | "GUARDIAN_AUTHORITY_UNVERIFIED"
    | "GUARDIAN_REQUIRED"
    | "MISSING_DOCUMENT";
  documentType?: string;
}>;

export type BookingConsentGateInput = Readonly<{
  clientId: string;
  clientType: BookingClientType;
  consentRecords: readonly BookingConsentRecord[];
  guardianAuthorityVerifiedAt?: Date | null;
  guardianId?: string | null;
  requiredExplicitConsentDocumentTypes?: readonly string[];
}>;

function uniqueDocumentTypes(input: BookingConsentGateInput): readonly string[] {
  return [
    ...new Set([
      ...mandatoryBookingDocumentTypes,
      ...(input.requiredExplicitConsentDocumentTypes ?? []),
    ]),
  ];
}

export function evaluateBookingConsentGate(
  input: BookingConsentGateInput,
  stage: BookingConsentStage,
): readonly BookingConsentIssue[] {
  const issues: BookingConsentIssue[] = [];
  const guardianId = input.guardianId ?? null;

  if (input.clientType === "ADULT" && guardianId) {
    issues.push({ code: "ADULT_GUARDIAN_NOT_ALLOWED" });
  }
  if (input.clientType === "CHILD" && !guardianId) {
    issues.push({ code: "GUARDIAN_REQUIRED" });
  }
  if (input.clientType === "CHILD" && stage === "CONFIRM" && !input.guardianAuthorityVerifiedAt) {
    issues.push({ code: "GUARDIAN_AUTHORITY_UNVERIFIED" });
  }

  for (const documentType of uniqueDocumentTypes(input)) {
    const subjectRecords = input.consentRecords.filter(
      (record) =>
        record.documentType === documentType &&
        record.subjectClientId === input.clientId &&
        record.status === "GRANTED",
    );
    const hasMatchingGrantor = subjectRecords.some((record) =>
      input.clientType === "CHILD"
        ? Boolean(guardianId) && record.grantedByGuardianId === guardianId
        : record.grantedByGuardianId === null,
    );

    if (hasMatchingGrantor) continue;

    issues.push({
      code: subjectRecords.length > 0 ? "DOCUMENT_GRANTOR_MISMATCH" : "MISSING_DOCUMENT",
      documentType,
    });
  }

  return Object.freeze(issues);
}

export class BookingConsentGateError extends Error {
  readonly code = "BOOKING_CONSENT_GATE_FAILED";

  constructor(readonly issues: readonly BookingConsentIssue[]) {
    super("Randevu için gerekli bilgilendirme, rıza veya veli doğrulaması eksik.");
    this.name = "BookingConsentGateError";
  }
}

export function assertBookingConsentGate(
  input: BookingConsentGateInput,
  stage: BookingConsentStage,
): void {
  const issues = evaluateBookingConsentGate(input, stage);
  if (issues.length > 0) throw new BookingConsentGateError(issues);
}
