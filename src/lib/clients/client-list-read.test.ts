import { beforeEach, describe, expect, it, vi } from "vitest";

const testDoubles = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: testDoubles.auth }));
vi.mock("@/lib/db", () => ({
  getDatabase: () => ({
    client: { findMany: testDoubles.findMany },
  }),
}));

import { GET } from "./client-list-read";

const CLIENT_ID = "11111111-1111-4111-8111-111111111111";
const NOW = new Date("2026-07-29T08:00:00.000Z");

function request() {
  return new Request("https://admin.example.test/api/admin/clients?take=25");
}

function baseClient() {
  return {
    _count: { appointments: 2, notes: 1 },
    appointments: [
      {
        serviceNameSnapshot: "Dil ve Konuşma Terapisi",
        startsAt: NOW,
        status: "CONFIRMED",
      },
    ],
    createdAt: new Date("2026-07-01T08:00:00.000Z"),
    email: "danisan@example.test",
    firstName: "Ayşe",
    id: CLIENT_ID,
    lastName: "Yılmaz",
    phone: "+905551112233",
    preferredName: null,
    status: "ACTIVE",
    type: "ADULT",
    updatedAt: new Date("2026-07-28T08:00:00.000Z"),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("client list finance visibility", () => {
  it("does not query or expose finance fields to assistants", async () => {
    testDoubles.auth.mockResolvedValue({
      user: {
        id: "22222222-2222-4222-8222-222222222222",
        roles: ["ASSISTANT"],
        status: "ACTIVE",
      },
    });
    testDoubles.findMany.mockResolvedValue([baseClient()]);

    const response = await GET(request());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(testDoubles.findMany).toHaveBeenCalledOnce();
    const query = testDoubles.findMany.mock.calls[0]?.[0];
    expect(query.select).not.toHaveProperty("plans");
    expect(query.select._count.select).not.toHaveProperty("plans");
    expect(payload.data[0]).toMatchObject({
      activePlanName: null,
      currency: null,
      financeAccess: false,
      openBalanceMinor: null,
      plansCount: null,
      remainingSessions: null,
      sessionCount: null,
    });
  });

  it("returns finance summary fields to finance-authorized users", async () => {
    testDoubles.auth.mockResolvedValue({
      user: {
        id: "33333333-3333-4333-8333-333333333333",
        roles: ["FINANCE"],
        status: "ACTIVE",
      },
    });
    testDoubles.findMany.mockResolvedValue([
      {
        ...baseClient(),
        _count: { appointments: 2, notes: 1, plans: 1 },
        plans: [
          {
            currency: "TRY",
            ledgerEntries: [{ amountMinor: 150_000n }],
            name: "10 Seanslık Plan",
            sessionCount: 10,
            sessionCreditEntries: [{ quantityDelta: 6 }],
            status: "ACTIVE",
          },
        ],
      },
    ]);

    const response = await GET(request());
    const payload = await response.json();

    expect(response.status).toBe(200);
    const query = testDoubles.findMany.mock.calls[0]?.[0];
    expect(query.select).toHaveProperty("plans");
    expect(query.select._count.select).toHaveProperty("plans", true);
    expect(payload.data[0]).toMatchObject({
      activePlanName: "10 Seanslık Plan",
      currency: "TRY",
      financeAccess: true,
      openBalanceMinor: "150000",
      plansCount: 1,
      remainingSessions: 6,
      sessionCount: 10,
    });
  });
});
