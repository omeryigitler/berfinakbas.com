import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, findPotentialDuplicateClientsMock, getDatabaseMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findPotentialDuplicateClientsMock: vi.fn(),
  getDatabaseMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));
vi.mock("@/lib/clients/client-duplicate-review", () => ({
  findPotentialDuplicateClients: findPotentialDuplicateClientsMock,
}));

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
  findPotentialDuplicateClientsMock.mockResolvedValue([]);
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
        client: {
          firstName: "Sentetik",
          id: "55555555-5555-4555-8555-555555555555",
          lastName: "Danışan",
          type: "ADULT",
        },
        duplicateReviewStatus: "NOT_REQUIRED",
        endsAt: new Date("2031-07-01T10:00:00.000Z"),
        id: "22222222-2222-4222-8222-222222222222",
        locationTypeSnapshot: "IN_PERSON",
        practitioner: { displayName: "Sentetik Uzman" },
        publicReference: "IT-SENTETIK",
        serviceNameSnapshot: "Sentetik Hizmet",
        source: "WEB",
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
          duplicateReview: { candidates: [], status: "NOT_REQUIRED" },
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
        client: { select: { firstName: true, id: true, lastName: true, type: true } },
        duplicateReviewStatus: true,
        endsAt: true,
        id: true,
        locationTypeSnapshot: true,
        practitioner: { select: { displayName: true } },
        publicReference: true,
        serviceNameSnapshot: true,
        source: true,
        startsAt: true,
        status: true,
      },
      take: 26,
      where: {
        practitioner: { is: { userId } },
        status: { in: ["REQUESTED", "PENDING_REVIEW"] },
      },
    });
    expect(findPotentialDuplicateClientsMock).toHaveBeenCalledWith(
      database,
      "55555555-5555-4555-8555-555555555555",
      {
        candidateWhere: {
          appointments: {
            some: { practitioner: { is: { userId } } },
          },
        },
      },
    );
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
      data: rows.slice(0, 2).map((row) => ({
        ...row,
        duplicateReview: { candidates: [] },
      })),
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

  it("returns privacy-minimized duplicate candidates for the review queue", async () => {
    const sourceClientId = "55555555-5555-4555-8555-555555555555";
    const candidateClientId = "66666666-6666-4666-8666-666666666666";
    const rows = [
      {
        client: {
          firstName: "Yeni",
          id: sourceClientId,
          lastName: "Danışan",
          type: "ADULT",
        },
        duplicateReviewStatus: "NOT_REQUIRED",
        endsAt: new Date("2031-07-01T10:00:00.000Z"),
        id: "22222222-2222-4222-8222-222222222222",
        locationTypeSnapshot: "IN_PERSON",
        practitioner: { displayName: "Sentetik Uzman" },
        publicReference: "IT-SENTETIK",
        serviceNameSnapshot: "Sentetik Hizmet",
        source: "WEB",
        startsAt: new Date("2031-07-01T09:00:00.000Z"),
        status: "PENDING_REVIEW",
      },
    ];
    const database = createDatabase(rows);
    getDatabaseMock.mockReturnValue(database);
    findPotentialDuplicateClientsMock.mockResolvedValue([
      {
        clientId: candidateClientId,
        firstName: "Mevcut",
        lastName: "Danışan",
        matchReasons: ["PHONE"],
        targetGuardianId: "private-guardian-id",
        type: "ADULT",
      },
    ]);

    const response = await GET(request());
    const payload = await response.json();

    expect(payload.data[0].duplicateReview).toEqual({
      candidates: [
        {
          clientId: candidateClientId,
          firstName: "Mevcut",
          lastName: "Danışan",
          matchReasons: ["PHONE"],
          type: "ADULT",
        },
      ],
      status: "PENDING",
    });
    expect(JSON.stringify(payload)).not.toContain("private-guardian-id");
  });
});
