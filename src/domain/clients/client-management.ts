import { z } from "zod";

export const clientTypeLabels = {
  ADULT: "Yetişkin",
  CHILD: "Çocuk",
} as const;

export const clientStatusLabels = {
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
  PROSPECTIVE: "Ön görüşme",
} as const;

export const guardianModeLabels = {
  EXISTING: "Mevcut veli seç",
  NEW: "Yeni veli oluştur",
} as const;

export type ClientTypeValue = keyof typeof clientTypeLabels;
export type ClientStatusValue = keyof typeof clientStatusLabels;
export type GuardianModeValue = keyof typeof guardianModeLabels;

const currentYear = new Date().getUTCFullYear();

function nullableTrimmedString(maxLength: number) {
  return z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value),
      z.string().trim().max(maxLength).nullable().optional(),
    )
    .transform((value) => value ?? null);
}

function nullableEmail() {
  return z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value),
      z.string().trim().email().max(320).nullable().optional(),
    )
    .transform((value) => value ?? null);
}

function nullableUuid() {
  return z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value),
      z.uuid().nullable().optional(),
    )
    .transform((value) => value ?? null);
}

const birthYearSchema = z
  .preprocess((value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string") return Number(value);
    return value;
  }, z.number().int().min(1900).max(currentYear).nullable().optional())
  .transform((value) => value ?? null);

export const createClientPayloadSchema = z
  .object({
    birthYear: birthYearSchema,
    email: nullableEmail(),
    firstName: z.string().trim().min(1).max(120),
    guardianEmail: nullableEmail(),
    guardianFirstName: nullableTrimmedString(120),
    guardianId: nullableUuid(),
    guardianLastName: nullableTrimmedString(120),
    guardianMode: z.enum(["EXISTING", "NEW"]).nullable().optional(),
    guardianPhone: nullableTrimmedString(40),
    lastName: z.string().trim().min(1).max(120),
    phone: nullableTrimmedString(40),
    preferredName: nullableTrimmedString(120),
    relationship: nullableTrimmedString(80),
    requestId: z.uuid(),
    status: z.enum(["PROSPECTIVE", "ACTIVE", "INACTIVE"]).default("PROSPECTIVE"),
    type: z.enum(["ADULT", "CHILD"]),
  })
  .superRefine((payload, context) => {
    if (payload.type !== "CHILD") return;

    if (!payload.guardianMode) {
      context.addIssue({
        code: "custom",
        message: "Çocuk danışan için veli seçimi zorunludur.",
        path: ["guardianMode"],
      });
    }

    if (!payload.relationship) {
      context.addIssue({
        code: "custom",
        message: "Çocuk danışan için veli yakınlığı zorunludur.",
        path: ["relationship"],
      });
    }

    if (payload.guardianMode === "EXISTING" && !payload.guardianId) {
      context.addIssue({
        code: "custom",
        message: "Mevcut veli seçeneğinde veli kaydı seçilmelidir.",
        path: ["guardianId"],
      });
    }

    if (payload.guardianMode === "NEW") {
      if (!payload.guardianFirstName) {
        context.addIssue({
          code: "custom",
          message: "Yeni veli için ad zorunludur.",
          path: ["guardianFirstName"],
        });
      }
      if (!payload.guardianLastName) {
        context.addIssue({
          code: "custom",
          message: "Yeni veli için soyad zorunludur.",
          path: ["guardianLastName"],
        });
      }
      if (!payload.guardianPhone) {
        context.addIssue({
          code: "custom",
          message: "Yeni veli için telefon zorunludur.",
          path: ["guardianPhone"],
        });
      }
    }
  });

export type CreateClientPayload = z.infer<typeof createClientPayloadSchema>;
