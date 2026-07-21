import { z } from "zod";

import { normalizeEmailAddress } from "@/domain/auth/admin-access";

const PRODUCTION_BOOKING_PRACTITIONER_ID = "00000000-0000-4000-8000-000000000001";

const timeZoneSchema = z
  .string()
  .min(1)
  .refine(
    (value) => {
      try {
        Intl.DateTimeFormat("tr-TR", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    },
    { message: "Geçerli bir IANA saat dilimi kullanılmalıdır." },
  );

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.uuid().optional(),
);

const disabledByDefaultBoolean = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const optionalHoldDurationMinutes = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce.number().int().min(1).max(1_440).optional(),
);

const bookingDocumentTypes = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(
        z
          .string()
          .min(1)
          .max(80)
          .regex(/^[A-Z0-9_]+$/),
      )
      .max(20)
      .refine((values) => new Set(values).size === values.length, {
        message: "Randevu belge türleri tekil olmalıdır.",
      }),
  );

export const serverEnvironmentSchema = z
  .object({
    APP_URL: z.url(),
    AUTH_ALLOWED_EMAILS: z.string().default(""),
    AUTH_BOOTSTRAP_ADMIN_EMAIL: optionalNonEmptyString,
    AUTH_GOOGLE_ID: optionalNonEmptyString,
    AUTH_GOOGLE_SECRET: optionalNonEmptyString,
    AUTH_SECRET: z.string().min(32),
    BOOKING_HOLD_DURATION_MINUTES: optionalHoldDurationMinutes,
    BOOKING_PUBLIC_PRACTITIONER_ID: optionalUuid,
    BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: bookingDocumentTypes,
    BUSINESS_TIME_ZONE: timeZoneSchema,
    DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PUBLIC_APPOINTMENT_HOLDS_ENABLED: disabledByDefaultBoolean,
    PUBLIC_APPOINTMENT_REQUESTS_ENABLED: disabledByDefaultBoolean,
    PUBLIC_APPOINTMENT_SLOTS_ENABLED: disabledByDefaultBoolean,
    PUBLIC_BOOKING_FLOW_ENABLED: disabledByDefaultBoolean,
  })
  .superRefine((environment, context) => {
    const hasGoogleId = Boolean(environment.AUTH_GOOGLE_ID);
    const hasGoogleSecret = Boolean(environment.AUTH_GOOGLE_SECRET);

    if (hasGoogleId !== hasGoogleSecret) {
      context.addIssue({
        code: "custom",
        message: "Google OAuth kimliği ve secret değeri birlikte tanımlanmalıdır.",
        path: hasGoogleId ? ["AUTH_GOOGLE_SECRET"] : ["AUTH_GOOGLE_ID"],
      });
    }
  });

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  environment: Record<string, string | undefined>,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment);
}

function withProductionBookingDefaults(
  environment: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const resolved = { ...environment };

  if (environment.VERCEL_ENV !== "production") return resolved;

  resolved.PUBLIC_BOOKING_FLOW_ENABLED = "true";
  resolved.PUBLIC_APPOINTMENT_SLOTS_ENABLED = "true";
  resolved.PUBLIC_APPOINTMENT_HOLDS_ENABLED = "true";
  resolved.PUBLIC_APPOINTMENT_REQUESTS_ENABLED = "true";

  if (!resolved.BOOKING_HOLD_DURATION_MINUTES?.trim()) {
    resolved.BOOKING_HOLD_DURATION_MINUTES = "8";
  }
  if (!resolved.BOOKING_PUBLIC_PRACTITIONER_ID?.trim()) {
    resolved.BOOKING_PUBLIC_PRACTITIONER_ID = PRODUCTION_BOOKING_PRACTITIONER_ID;
  }

  return resolved;
}

export function getServerEnvironment(): ServerEnvironment {
  return parseServerEnvironment(withProductionBookingDefaults(process.env));
}

export function getAllowedAdminEmails(environment: ServerEnvironment): Set<string> {
  const allowedEmails = environment.AUTH_ALLOWED_EMAILS.split(",")
    .map((email) => normalizeEmailAddress(email))
    .filter((email): email is string => email !== null);
  const bootstrapEmail = normalizeEmailAddress(environment.AUTH_BOOTSTRAP_ADMIN_EMAIL);

  if (bootstrapEmail) allowedEmails.push(bootstrapEmail);

  return new Set(allowedEmails);
}
