import type { PrismaClient } from "@/generated/prisma/client";

export async function activateBootstrapAdmin(
  database: PrismaClient,
  userId: string,
): Promise<void> {
  await database.$transaction(async (transaction) => {
    const superAdminRole = await transaction.role.findUnique({
      select: { id: true },
      where: { key: "SUPER_ADMIN" },
    });

    if (!superAdminRole) {
      throw new Error("SUPER_ADMIN rolü bulunamadı; sentetik başlangıç verisi çalıştırılmalıdır.");
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
        beforeSummary: { roles: [], status: "INVITED" },
        correlationId: `auth-bootstrap:${userId}`,
        entityId: userId,
        entityType: "USER",
        reason: "ALLOWLISTED_GOOGLE_SIGN_IN",
      },
    });
  });
}
