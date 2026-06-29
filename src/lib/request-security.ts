import { randomUUID } from "node:crypto";

const correlationIdPattern = /^[A-Za-z0-9._:-]{1,80}$/;

export function hasTrustedOrigin(requestOrigin: string | null, applicationUrl: string): boolean {
  if (!requestOrigin) return false;

  try {
    return new URL(requestOrigin).origin === new URL(applicationUrl).origin;
  } catch {
    return false;
  }
}

export function getSafeCorrelationId(value: string | null): string {
  return value && correlationIdPattern.test(value) ? value : randomUUID();
}
