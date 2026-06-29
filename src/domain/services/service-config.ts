import { z } from "zod";

export const serviceConfigSchema = z.object({
  approvalMode: z.enum(["MANUAL", "AUTOMATIC"]).default("MANUAL"),
  bufferAfterMinutes: z.number().int().min(0).max(240).default(0),
  bufferBeforeMinutes: z.number().int().min(0).max(240).default(0),
  durationMinutes: z.number().int().min(5).max(480),
  locationType: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
  name: z.string().trim().min(2).max(160),
  policy: z.object({
    bookingMaxAdvanceDays: z.number().int().min(1).max(730),
    bookingMinNoticeMinutes: z.number().int().min(0).max(525_600),
    cancellationWindowMinutes: z.number().int().min(0).max(525_600),
    maxDailyAppointments: z.number().int().min(1).max(100).nullable().default(null),
    rescheduleWindowMinutes: z.number().int().min(0).max(525_600),
  }),
  publicDescription: z.string().trim().max(2_000).nullable().default(null),
  publicVisible: z.boolean().default(false),
  reason: z.string().trim().min(8).max(500),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug küçük harf, sayı ve tire içerebilir."),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
});

export type ServiceConfig = z.infer<typeof serviceConfigSchema>;

export type ServiceSnapshot = Readonly<{
  approvalMode: ServiceConfig["approvalMode"];
  bufferAfterMinutes: number;
  bufferBeforeMinutes: number;
  durationMinutes: number;
  locationType: ServiceConfig["locationType"];
  name: string;
  policy: ServiceConfig["policy"];
  serviceId: string;
}>;

export function createServiceSnapshot(serviceId: string, input: ServiceConfig): ServiceSnapshot {
  const service = serviceConfigSchema.parse(input);

  return Object.freeze({
    approvalMode: service.approvalMode,
    bufferAfterMinutes: service.bufferAfterMinutes,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    durationMinutes: service.durationMinutes,
    locationType: service.locationType,
    name: service.name,
    policy: Object.freeze({ ...service.policy }),
    serviceId,
  });
}
