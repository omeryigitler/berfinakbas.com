import { z } from "zod";

import { normalizeEmailAddress } from "@/domain/auth/admin-access";

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

const disabledByDefaultBoolean = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

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
    BOOKING_REQUIRED_EXPLICIT_CONSENT_DOCUMENT_TYPES: bookingDocumentTypes,
    BUSINESS_TIME_ZONE: timeZoneSchema,
    DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PUBLIC_APPOINTMENT_REQUESTS_ENABLED: disabledByDefaultBoolean,
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

export function getServerEnvironment(): ServerEnvironment {
  return parseServerEnvironment(process.env);
}

export function getAllowedAdminEmails(environment: ServerEnvironment): Set<string> {
  return new Set(
    environment.AUTH_ALLOWED_EMAILS.split(",")
      .map((email) => normalizeEmailAddress(email))
      .filter((email): email is string => email !== null),
  );
}
