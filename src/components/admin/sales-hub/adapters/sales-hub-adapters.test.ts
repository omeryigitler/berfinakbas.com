import type { ClientDetail, ClientListItem } from "@/components/admin/client-dashboard-types";

import { describe, expect, it } from "vitest";

import { adaptClientDetail, calculateClientBalance } from "./client-detail-adapter";
import { adaptClientListItem, filterAndSortClientList } from "./client-list-adapter";

const client: ClientListItem = {
  appointmentsCount: 0,
  createdAt: "2026-07-01T10:00:00.000Z",
  email: "berfin@example.com",
  firstName: "Berfin",
  id: "client-1",
  lastName: "Akbaş",
  nextAppointment: null,
  notesCount: 0,
  phone: "5551112233",
  plansCount: 0,
  preferredName: null,
  score: 65,
  status: "ACTIVE",
  type: "ADULT",
  updatedAt: "2026-07-02T10:00:00.000Z",
};

describe("Sales Hub client list adapter", () => {
  it("does not manufacture a service or appointment when the API has none", () => {
    const adapted = adaptClientListItem(client);

    expect(adapted.serviceLabel).toBe("—");
    expect(adapted.nextAppointmentLabel).toBe("—");
    expect(adapted.planLabel).toBe("Yok");
  });

  it("filters and sorts only the supplied live records", () => {
    const child: ClientListItem = {
      ...client,
      email: "ada@example.com",
      firstName: "Ada",
      id: "client-2",
      lastName: "Yılmaz",
      phone: "5559998877",
      status: "PROSPECTIVE",
      type: "CHILD",
      updatedAt: "2026-07-03T10:00:00.000Z",
    };

    expect(
      filterAndSortClientList([client, child], "CHILD", "", "updated").map((item) => item.id),
    ).toEqual(["client-2"]);
    expect(
      filterAndSortClientList([client, child], "ALL", "berfin", "name").map((item) => item.id),
    ).toEqual(["client-1"]);
  });
});

describe("Sales Hub finance adapter", () => {
  it("calculates the remaining balance from real finance entries", () => {
    const detail: ClientDetail = {
      appointments: [],
      birthYear: null,
      createdAt: "2026-07-01T10:00:00.000Z",
      email: null,
      financeEntries: [
        {
          amountMinor: "500000",
          currency: "TRY",
          externalReference: null,
          id: "entry-1",
          note: null,
          occurredAt: "2026-07-01T10:00:00.000Z",
          paymentMethod: null,
          plan: null,
          type: "ACCRUAL",
        },
        {
          amountMinor: "-200000",
          currency: "TRY",
          externalReference: null,
          id: "entry-2",
          note: null,
          occurredAt: "2026-07-02T10:00:00.000Z",
          paymentMethod: { name: "Havale" },
          plan: null,
          type: "PAYMENT",
        },
      ],
      financeSummary: {
        hasOpenBalance: true,
        openBalanceLabel: "₺3.000,00",
        paidLabel: "₺2.000,00",
        planTotalLabel: "₺5.000,00",
        remainingSessions: 0,
      },
      firstName: "Berfin",
      guardians: [],
      id: "client-1",
      lastName: "Akbaş",
      nextAppointment: null,
      notes: [],
      phone: null,
      plans: [],
      preferredName: null,
      score: 35,
      status: "ACTIVE",
      type: "ADULT",
      updatedAt: "2026-07-02T10:00:00.000Z",
    };

    expect(calculateClientBalance(detail)).toEqual({ amountMinor: 300000n, currency: "TRY" });
  });
});

type DetailAppointment = ClientDetail["appointments"][number];

function makeAppointment(
  id: string,
  startsAt: string,
  status: string,
): DetailAppointment {
  return {
    durationMinutesSnapshot: 60,
    endsAt: startsAt,
    id,
    locationTypeSnapshot: "ONLINE",
    practitioner: { displayName: "Berfin Akbaş" },
    publicReference: `ref-${id}`,
    requestNote: null,
    serviceNameSnapshot: "Seans",
    startsAt,
    status,
  };
}

function makeDetail(appointments: DetailAppointment[]): ClientDetail {
  return {
    appointments,
    birthYear: null,
    createdAt: "2020-01-01T10:00:00.000Z",
    email: null,
    financeEntries: [],
    financeSummary: {
      hasOpenBalance: false,
      openBalanceLabel: "—",
      paidLabel: "—",
      planTotalLabel: "—",
      remainingSessions: 0,
    },
    firstName: "Berfin",
    guardians: [],
    id: "client-1",
    lastName: "Akbaş",
    nextAppointment: null,
    notes: [],
    phone: null,
    plans: [],
    preferredName: null,
    score: 35,
    status: "ACTIVE",
    type: "ADULT",
    updatedAt: "2020-01-02T10:00:00.000Z",
  };
}

describe("Sales Hub completable appointment", () => {
  it("completes the most recent already-started confirmed session, not a future one", () => {
    // Appointments arrive newest-first (API orders by startsAt desc).
    const detail = makeDetail([
      makeAppointment("future-confirmed", "2999-01-01T10:00:00.000Z", "CONFIRMED"),
      makeAppointment("past-confirmed", "2024-06-10T10:00:00.000Z", "CONFIRMED"),
      makeAppointment("past-no-show", "2024-06-05T10:00:00.000Z", "NO_SHOW"),
    ]);

    expect(adaptClientDetail(detail).completableAppointment?.id).toBe("past-confirmed");
  });

  it("offers nothing to complete when the only confirmed session is still in the future", () => {
    const detail = makeDetail([
      makeAppointment("future-confirmed", "2999-01-01T10:00:00.000Z", "CONFIRMED"),
    ]);

    expect(adaptClientDetail(detail).completableAppointment).toBeNull();
  });
});
