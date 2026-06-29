import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getDatabaseMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getDatabaseMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import { GET } from "./route";

const userId = "11111111-1111-4111-8111-111111111111";
const activeTherapist = { id: userId, roles: ["THERAPIST"], status: "ACTIVE" };

function request(query = "") {
  return new Request(`https://berfinakbas.com/api/admin/appointments${query}`);
}

function createDatabase(rows: Array<Record<string, unknown>> = []) {
  return {
    appointment: { findMany: vi.fn().mockResolvedValue(rows) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: activeTherapist });
});

describe("GET /api/admin/appointments", () => {
  it.each([
    ["missing", null],
    ["suspended", { user: { ...activeTherapist, status: "SUSPENDED" } }],
  ])("rejects a %s session before querying appointment data", async (_label, session) => {
    authMock.mockResolvedValue(session);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it("rejects a role without appointment read permission", async () => {
    authMock.mockResolvedValue({ user: { ...activeTherapist, roles: ["FINANCE"] } });

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it.each(["?status=UNKNOWN", "?take=0", "?take=101", "?cursor=not-a-uuid", "?extra=1"])(
    "rejects the invalid list filter %s without querying data",
    async (query) => {
      const response = await GET(request(query));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: "Randevu listesi filtresi geçersiz.",
      });
      expect(getDatabaseMock).not.toHaveBeenCalled();
    },
  );

  it("returns a data-minimized pending queue scoped to the therapist", async () => {
    const rows = [
      {
        client: { firstName: "Sentetik", lastName: "Danışan", type: "ADULT" },
        endsAt: new Date("2031-07-01T10:00:00.000Z"),
        id: "22222222-2222-4222-8222-222222222222",
        locationTypeSnapshot: "IN_PERSON",
        practitioner: { displayName: "Sentetik Uzman" },
        publicReference: "IT-SENTETIK",
        serviceNameSnapshot: "Sentetik Hizmet",
        startsAt: new Date("2031-07-01T09:00:00.000Z"),
        status: "PENDING_REVIEW",
      },
    ];
    const database = createDatabase(rows);
    getDatabaseMock.mockReturnValue(database);

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          client: { firstName: "Sentetik", lastName: "Danışan", type: "ADULT" },
          publicReference: "IT-SENTETIK",
          serviceNameSnapshot: "Sentetik Hizmet",
          status: "PENDING_REVIEW",
        },
      ],
      pagination: { nextCursor: null },
    });
    expect(database.appointment.findMany).toHaveBeenCalledWith({
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      select: {
        client: { select: { firstName: true, lastName: true, type: true } },
        endsAt: true,
        id: true,
        locationTypeSnapshot: true,
        practitioner: { select: { displayName: true } },
        publicReference: true,
        serviceNameSnapshot: true,
        startsAt: true,
        status: true,
      },
      take: 26,
      where: {
        practitioner: { is: { userId } },
        status: "PENDING_REVIEW",
      },
    });
  });

  it("uses a bounded cursor page and returns only the next cursor", async () => {
    const rows = [
      { id: "22222222-2222-4222-8222-222222222222" },
      { id: "33333333-3333-4333-8333-333333333333" },
      { id: "44444444-4444-4444-8444-444444444444" },
    ];
    const database = createDatabase(rows);
    getDatabaseMock.mockReturnValue(database);

    const response = await GET(
      request("?status=CONFIRMED&take=2&cursor=11111111-1111-4111-8111-111111111111"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: rows.slice(0, 2),
      pagination: { nextCursor: rows[1].id },
    });
    expect(database.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "11111111-1111-4111-8111-111111111111" },
        skip: 1,
        take: 3,
        where: {
          practitioner: { is: { userId } },
          status: "CONFIRMED",
        },
      }),
    );
  });
});
