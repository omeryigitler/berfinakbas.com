import type { PrismaClient } from "@/generated/prisma/client";

const SUPER_ADMIN_ROLE = {
  key: "SUPER_ADMIN" as const,
};

export async function activateBootstrapAdmin(
  database: PrismaClient,
  userId: string,
): Promise<void> {
  await database.$transaction(async (transaction) => {
    // Fail closed: the SUPER_ADMIN role must already be seeded. We never
    // auto-create it inside the sign-in bootstrap flow, so a missing seed
    // aborts activation instead of minting an admin role on the fly.
    const superAdminRole = await transaction.role.findUnique({
      select: { id: true },
      where: { key: SUPER_ADMIN_ROLE.key },
    });
    if (!superAdminRole) {
      throw new Error("SUPER_ADMIN rolü bulunamadı");
    }

    await transaction.user.update({
      data: { status: "ACTIVE" },
      where: { id: userId },
    });
    await transaction.userRole.upsert({
      create: { roleId: superAdminRole.id, userId },
      update: {},
      where: { userId_roleId: { roleId: superAdminRole.id, userId } },
    });
    await transaction.auditLog.create({
      data: {
        action: "user.bootstrap_admin_activated",
        actorType: "SYSTEM",
        afterSummary: { roles: ["SUPER_ADMIN"], status: "ACTIVE" },
        correlationId: `auth-bootstrap:${userId}`,
        entityId: userId,
        entityType: "USER",
        reason: "ALLOWLISTED_GOOGLE_SIGN_IN",
      },
    });
  });
}
