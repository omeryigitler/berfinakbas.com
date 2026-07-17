import {
  mapAppointmentToHubRecord,
  mapClientToHubRecord,
  type HubAppointmentRow,
  type HubClientRow,
} from "./hub-data";
import type { HubRecord } from "./hub-model";

/* Placeholder records shown only when a Hub list section is empty, so the
   record center keeps its reference layout (list + record + score) instead of
   collapsing to a bare empty state. These never touch the database and are
   clearly flagged as "önizleme" in the UI. */

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

function sampleClientRows(now: Date): HubClientRow[] {
  const h = 3_600_000;
  const day = 86_400_000;
  return [
    {
      appointments: [
        {
          serviceNameSnapshot: "Ses terapisi",
          startsAt: new Date(now.getTime() + 4 * day),
          status: "CONFIRMED",
        },
      ],
      createdAt: new Date(now.getTime() - 40 * day),
      email: "ornek.danisan@onizleme.dev",
      firstName: "Örnek",
      guardians: [],
      id: "sample-client-1",
      lastName: "Danışan",
      phone: "0500 000 00 10",
      preferredName: null,
      status: "ACTIVE",
      type: "ADULT",
      updatedAt: new Date(now.getTime() - 3 * h),
    },
    {
      appointments: [],
      createdAt: new Date(now.getTime() - 8 * day),
      email: "ornek.cocuk@onizleme.dev",
      firstName: "Örnek",
      guardians: [{ guardian: { firstName: "Veli", lastName: "Örnek" }, relationship: "Annesi" }],
      id: "sample-client-2",
      lastName: "Çocuk",
      phone: "0500 000 00 11",
      preferredName: null,
      status: "PROSPECTIVE",
      type: "CHILD",
      updatedAt: new Date(now.getTime() - 1 * day),
    },
  ];
}

export function buildSampleAppointments(now: Date, timeZone: string): readonly HubRecord[] {
  return sampleAppointmentRows(now).map((row) => mapAppointmentToHubRecord(row, now, timeZone));
}

export function buildSampleClients(now: Date, timeZone: string): readonly HubRecord[] {
  return sampleClientRows(now).map((row) => mapClientToHubRecord(row, now, timeZone));
}
