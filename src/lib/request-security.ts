import { randomUUID } from "node:crypto";

const correlationIdPattern = /^[A-Za-z0-9._:-]{1,80}$/;

export function hasTrustedOrigin(
  requestOrigin: string | null,
  ...trustedUrls: readonly string[]
): boolean {
  if (!requestOrigin) return false;

  try {
    const origin = new URL(requestOrigin).origin;
    return trustedUrls.some((trustedUrl) => origin === new URL(trustedUrl).origin);
  } catch {
    return false;
  }
}

export function getSafeCorrelationId(value: string | null): string {
  return value && correlationIdPattern.test(value) ? value : randomUUID();
}
