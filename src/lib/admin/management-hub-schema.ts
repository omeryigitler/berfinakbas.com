import { z } from 'zod';

export const moduleSchema = z.enum([
  'randevular',
  'takvim-uygunluk',
  'talepler-iletisim',
  'hizmetler',
  'odeme-planlar',
  'pdf-kaynaklar',
  'raporlar',
  'kullanicilar-yetkiler',
  'ayarlar',
  'arsiv',
]);

export const settingKeys = [
  'BOOKING_RULES',
  'FIRST_MEETING_SETTINGS',
  'MESSAGE_TEMPLATES',
  'COMMUNICATION_CONSENTS',
  'PDF_RESOURCE_LIBRARY',
  'PDF_DELIVERY_SETTINGS',
  'BUSINESS_PROFILE',
  'NOTIFICATION_SETTINGS',
  'PRIVACY_SETTINGS',
  'APPEARANCE_SETTINGS',
] as const;

export const settingKeySchema = z.enum(settingKeys);

export const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('SAVE_AVAILABILITY_RULES'),
    rules: z.array(z.object({
      weekday: z.number().int().min(1).max(7),
      start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      slotIncrementMinutes: z.number().int().min(5).max(120),
      active: z.boolean(),
    })),
  }),
  z.object({
    action: z.literal('CREATE_AVAILABILITY_EXCEPTION'),
    type: z.enum(['CUSTOM_HOURS', 'CLOSED', 'BLOCKED']),
    date: z.iso.date(),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    reasonCode: z.string().trim().min(2).max(80),
    privateNote: z.string().trim().max(500).nullable().optional(),
  }),
  z.object({
    action: z.literal('SET_AVAILABILITY_EXCEPTION_STATUS'),
    id: z.uuid(),
    status: z.enum(['ACTIVE', 'INACTIVE']),
  }),
  z.object({
    action: z.literal('SAVE_SETTING'),
    key: settingKeySchema,
    value: z.unknown(),
    reason: z.string().trim().min(4).max(500),
  }),
  z.object({
    action: z.literal('SAVE_PDF_RESOURCES'),
    resources: z.array(z.object({
      id: z.string().trim().min(1).max(120),
      title: z.string().trim().min(2).max(160),
      language: z.string().trim().min(2).max(40),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
      url: z.union([z.literal(''), z.url().max(500)]),
      description: z.string().trim().max(500).optional().default(''),
    })),
  }),
  z.object({ action: z.literal('UPDATE_SERVICE_STATUS'), serviceId: z.uuid(), status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']) }),
  z.object({ action: z.literal('UPDATE_USER_STATUS'), userId: z.uuid(), status: z.enum(['ACTIVE', 'SUSPENDED']) }),
  z.object({ action: z.literal('RESTORE_CLIENT'), clientId: z.uuid() }),
  z.object({ action: z.literal('RESTORE_SERVICE'), serviceId: z.uuid() }),
]);

export type ManagementModule = z.infer<typeof moduleSchema>;
export type ManagementAction = z.infer<typeof actionSchema>;
