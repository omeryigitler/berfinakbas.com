import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { activateBootstrapAdmin } from "./bootstrap-admin";

function createDatabase(roleId: string | null) {
  const transaction = {
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    role: { findUnique: vi.fn().mockResolvedValue(roleId ? { id: roleId } : null) },
    user: { update: vi.fn().mockResolvedValue({}) },
    userRole: { upsert: vi.fn().mockResolvedValue({}) },
  };
  const database = {
    $transaction: vi.fn(async (callback: (value: typeof transaction) => Promise<void>) =>
      callback(transaction),
    ),
  } as unknown as PrismaClient;

  return { database, transaction };
}

describe("activateBootstrapAdmin", () => {
  it("activates the user, assigns SUPER_ADMIN and writes an audit event atomically", async () => {
    const { database, transaction } = createDatabase("super-admin-role-id");

    await activateBootstrapAdmin(database, "11111111-1111-4111-8111-111111111111");

    expect(transaction.user.update).toHaveBeenCalledWith({
      data: { status: "ACTIVE" },
      where: { id: "11111111-1111-4111-8111-111111111111" },
    });
    expect(transaction.userRole.upsert).toHaveBeenCalledWith({
      create: {
        roleId: "super-admin-role-id",
        userId: "11111111-1111-4111-8111-111111111111",
      },
      update: {},
      where: {
        userId_roleId: {
          roleId: "super-admin-role-id",
          userId: "11111111-1111-4111-8111-111111111111",
        },
      },
    });
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "user.bootstrap_admin_activated",
        actorType: "SYSTEM",
        entityId: "11111111-1111-4111-8111-111111111111",
        reason: "ALLOWLISTED_GOOGLE_SIGN_IN",
      }),
    });
  });

  it("fails closed before activating the user when the role seed is missing", async () => {
    const { database, transaction } = createDatabase(null);

    await expect(
      activateBootstrapAdmin(database, "11111111-1111-4111-8111-111111111111"),
    ).rejects.toThrow("SUPER_ADMIN rolü bulunamadı");
    expect(transaction.user.update).not.toHaveBeenCalled();
    expect(transaction.userRole.upsert).not.toHaveBeenCalled();
    expect(transaction.auditLog.create).not.toHaveBeenCalled();
  });
});
