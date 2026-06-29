import { z } from "zod";

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

export const serverEnvironmentSchema = z
  .object({
    APP_URL: z.url(),
    AUTH_ALLOWED_EMAILS: z.string().default(""),
    AUTH_BOOTSTRAP_ADMIN_EMAIL: optionalNonEmptyString,
    AUTH_GOOGLE_ID: optionalNonEmptyString,
    AUTH_GOOGLE_SECRET: optionalNonEmptyString,
    AUTH_SECRET: z.string().min(32),
    BUSINESS_TIME_ZONE: timeZoneSchema,
    DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
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
      .map((email) => email.trim().toLocaleLowerCase("tr-TR"))
      .filter(Boolean),
  );
}
