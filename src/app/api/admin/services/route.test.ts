import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getDatabaseMock, getServerEnvironmentMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getDatabaseMock: vi.fn(),
  getServerEnvironmentMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));
vi.mock("@/lib/env", () => ({ getServerEnvironment: getServerEnvironmentMock }));

import { GET, POST } from "./route";

const adminUser = {
  id: "11111111-1111-4111-8111-111111111111",
  roles: ["SUPER_ADMIN"],
  status: "ACTIVE",
};

const validServiceConfig = {
  approvalMode: "MANUAL",
  bufferAfterMinutes: 10,
  bufferBeforeMinutes: 5,
  durationMinutes: 50,
  locationType: "HYBRID",
  name: "Sentetik değerlendirme görüşmesi",
  policy: {
    bookingMaxAdvanceDays: 60,
    bookingMinNoticeMinutes: 1_440,
    cancellationWindowMinutes: 1_440,
    maxDailyAppointments: 6,
    rescheduleWindowMinutes: 2_880,
  },
  publicDescription: null,
  publicVisible: false,
  reason: "Yeni sentetik hizmet yapılandırması oluşturuluyor.",
  slug: "sentetik-degerlendirme-gorusmesi",
  sortOrder: 1,
  status: "DRAFT",
};

function createPostRequest(body: BodyInit, origin = "https://berfinakbas.com") {
  return new Request("https://berfinakbas.com/api/admin/services", {
    body,
    headers: {
      "content-type": "application/json",
      origin,
      "x-correlation-id": "test-correlation-id",
    },
    method: "POST",
  });
}

function createDatabase() {
  const transaction = {
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    service: {
      create: vi.fn().mockResolvedValue({
        id: "22222222-2222-4222-8222-222222222222",
        name: validServiceConfig.name,
      }),
    },
    servicePolicy: { create: vi.fn().mockResolvedValue({}) },
  };
  const database = {
    $transaction: vi.fn(async (callback: (value: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
    ),
    service: { findMany: vi.fn().mockResolvedValue([]) },
  };

  return { database, transaction };
}

beforeEach(() => {
  vi.clearAllMocks();
  getServerEnvironmentMock.mockReturnValue({ APP_URL: "https://berfinakbas.com" });
});

describe("GET /api/admin/services", () => {
  it.each([
    ["oturumsuz kullanıcı", null],
    ["suspended yönetici", { user: { ...adminUser, status: "SUSPENDED" } }],
    ["izinsiz rol", { user: { ...adminUser, roles: ["DEVELOPER"] } }],
  ])("rejects %s without reading service data", async (_label, session) => {
    const { database } = createDatabase();
    authMock.mockResolvedValue(session);
    getDatabaseMock.mockReturnValue(database);

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Bu işlem için yetkiniz yok." });
    expect(database.service.findMany).not.toHaveBeenCalled();
  });

  it("returns services to an active role with read permission", async () => {
    const { database } = createDatabase();
    database.service.findMany.mockResolvedValue([
      { id: "22222222-2222-4222-8222-222222222222", name: "Sentetik hizmet" },
    ]);
    authMock.mockResolvedValue({ user: { ...adminUser, roles: ["ASSISTANT"] } });
    getDatabaseMock.mockReturnValue(database);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "22222222-2222-4222-8222-222222222222", name: "Sentetik hizmet" }],
    });
    expect(database.service.findMany).toHaveBeenCalledWith({
      include: { policies: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  });
});

describe("POST /api/admin/services", () => {
  it("rejects an active role without manage permission before parsing input", async () => {
    const { database } = createDatabase();
    authMock.mockResolvedValue({ user: { ...adminUser, roles: ["THERAPIST"] } });
    getDatabaseMock.mockReturnValue(database);

    const response = await POST(createPostRequest(JSON.stringify(validServiceConfig)));

    expect(response.status).toBe(403);
    expect(getServerEnvironmentMock).not.toHaveBeenCalled();
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an untrusted origin before parsing input", async () => {
    const { database } = createDatabase();
    authMock.mockResolvedValue({ user: adminUser });
    getDatabaseMock.mockReturnValue(database);

    const response = await POST(
      createPostRequest(JSON.stringify(validServiceConfig), "https://attacker.example"),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Güvenilmeyen istek kaynağı." });
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("returns a safe 400 response for malformed JSON", async () => {
    const { database } = createDatabase();
    authMock.mockResolvedValue({ user: adminUser });
    getDatabaseMock.mockReturnValue(database);

    const response = await POST(createPostRequest("{"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "İstek gövdesi geçerli JSON olmalıdır.",
    });
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid service configuration without writing", async () => {
    const { database } = createDatabase();
    authMock.mockResolvedValue({ user: adminUser });
    getDatabaseMock.mockReturnValue(database);

    const response = await POST(
      createPostRequest(JSON.stringify({ ...validServiceConfig, durationMinutes: 1 })),
    );

    expect(response.status).toBe(400);
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("creates service, policy and audit records in one transaction", async () => {
    const { database, transaction } = createDatabase();
    authMock.mockResolvedValue({ user: adminUser });
    getDatabaseMock.mockReturnValue(database);

    const response = await POST(createPostRequest(JSON.stringify(validServiceConfig)));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "22222222-2222-4222-8222-222222222222",
        name: validServiceConfig.name,
      },
    });
    expect(database.$transaction).toHaveBeenCalledOnce();
    expect(transaction.service.create).toHaveBeenCalledWith({
      data: {
        approvalMode: "MANUAL",
        defaultBufferAfterMinutes: 10,
        defaultBufferBeforeMinutes: 5,
        defaultDurationMinutes: 50,
        locationType: "HYBRID",
        name: validServiceConfig.name,
        publicDescription: null,
        publicVisible: false,
        slug: validServiceConfig.slug,
        sortOrder: 1,
        status: "DRAFT",
      },
    });
    expect(transaction.servicePolicy.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingMaxAdvanceDays: 60,
        bookingMinNoticeMinutes: 1_440,
        cancellationWindowMinutes: 1_440,
        createdByUserId: adminUser.id,
        maxDailyAppointments: 6,
        rescheduleWindowMinutes: 2_880,
        serviceId: "22222222-2222-4222-8222-222222222222",
      }),
    });
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "service.created",
        actorUserId: adminUser.id,
        correlationId: "test-correlation-id",
        entityId: "22222222-2222-4222-8222-222222222222",
        reason: validServiceConfig.reason,
      }),
    });
  });
});
