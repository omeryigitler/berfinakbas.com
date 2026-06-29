export type AdminUserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export function normalizeEmailAddress(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function canUseGoogleAdminSignIn(input: {
  allowedAdminEmails: ReadonlySet<string>;
  email: string | null | undefined;
  existingUserStatus: AdminUserStatus | null;
  googleAuthConfigured: boolean;
}): boolean {
  const email = normalizeEmailAddress(input.email);

  if (!email || !input.googleAuthConfigured || input.existingUserStatus === "SUSPENDED") {
    return false;
  }

  return input.existingUserStatus !== null || input.allowedAdminEmails.has(email);
}

export function isAllowedBootstrapAdmin(
  email: string | null | undefined,
  allowedAdminEmails: ReadonlySet<string>,
): boolean {
  const normalizedEmail = normalizeEmailAddress(email);
  return normalizedEmail !== null && allowedAdminEmails.has(normalizedEmail);
}
