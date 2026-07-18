import {
  mapAppointmentToHubRecord,
  type HubAppointmentRow,
} from "./hub-data";
import type { HubRecord } from "./hub-model";

/* Appointment placeholders remain available for the empty request queue. Client
   placeholders are intentionally disabled: the Hub now receives ten real,
   removable reference clients from the database migration, and deleted client
   records must never reappear as synthetic rows. */

function sampleAppointmentRows(now: Date): HubAppointmentRow[] {
  const h = 3_600_000;
  const day = 86_400_000;
  return [
    {
      approvedAt: null,
      client: {
        email: "ornek1@onizleme.dev",
        firstName: "Örnek",
        lastName: "Talep",
        phone: "0500 000 00 01",
        preferredName: null,
        type: "CHILD",
      },
      createdAt: new Date(now.getTime() - 2 * h),
      duplicateReviewStatus: "NOT_REQUIRED",
      guardian: { firstName: "Veli", lastName: "Örnek" },
      id: "sample-apt-1",
      practitioner: { displayName: "Berfin Akbaş" },
      publicReference: "ÖRNEK-1001",
      requestNote: "Bu bir önizleme kaydıdır.",
      serviceNameSnapshot: "Çocuk dil değerlendirmesi",
      source: "WEB",
      startsAt: new Date(now.getTime() + 2 * day),
      status: "REQUESTED",
      statusLogs: [{ createdAt: new Date(now.getTime() - 2 * h), toStatus: "REQUESTED" }],
    },
    {
      approvedAt: null,
      client: {
        email: "ornek2@onizleme.dev",
        firstName: "Örnek",
        lastName: "İnceleme",
        phone: "0500 000 00 02",
        preferredName: null,
        type: "ADULT",
      },
      createdAt: new Date(now.getTime() - 6 * h),
      duplicateReviewStatus: "NOT_REQUIRED",
      guardian: null,
      id: "sample-apt-2",
      practitioner: { displayName: "Berfin Akbaş" },
      publicReference: "ÖRNEK-1002",
      requestNote: "Bu bir önizleme kaydıdır.",
      serviceNameSnapshot: "Yetişkin ses terapisi",
      source: "PHONE",
      startsAt: new Date(now.getTime() + 3 * day),
      status: "PENDING_REVIEW",
      statusLogs: [
        { createdAt: new Date(now.getTime() - 1 * h), toStatus: "PENDING_REVIEW" },
        { createdAt: new Date(now.getTime() - 6 * h), toStatus: "REQUESTED" },
      ],
    },
    {
      approvedAt: new Date(now.getTime() - 20 * h),
      client: {
        email: "ornek3@onizleme.dev",
        firstName: "Örnek",
        lastName: "Onay",
        phone: "0500 000 00 03",
        preferredName: null,
        type: "CHILD",
      },
      createdAt: new Date(now.getTime() - 2 * day),
      duplicateReviewStatus: "NOT_REQUIRED",
      guardian: { firstName: "Veli", lastName: "Örnek" },
      id: "sample-apt-3",
      practitioner: { displayName: "Berfin Akbaş" },
      publicReference: "ÖRNEK-0993",
      requestNote: "Bu bir önizleme kaydıdır.",
      serviceNameSnapshot: "Çocuk dil terapisi",
      source: "WEB",
      startsAt: new Date(now.getTime() + 1 * day),
      status: "CONFIRMED",
      statusLogs: [
        { createdAt: new Date(now.getTime() - 20 * h), toStatus: "CONFIRMED" },
        { createdAt: new Date(now.getTime() - 30 * h), toStatus: "PENDING_REVIEW" },
        { createdAt: new Date(now.getTime() - 2 * day), toStatus: "REQUESTED" },
      ],
    },
  ];
}

export function buildSampleAppointments(now: Date, timeZone: string): readonly HubRecord[] {
  return sampleAppointmentRows(now).map((row) => mapAppointmentToHubRecord(row, now, timeZone));
}

export function buildSampleClients(_now?: Date, _timeZone?: string): readonly HubRecord[] {
  return [];
}
