import type { PrismaClient } from "@/generated/prisma/client";

const SUPER_ADMIN_ROLE = {
  description: "Tüm yönetim izinleri",
  key: "SUPER_ADMIN" as const,
  name: "Süper yönetici",
};

export async function activateBootstrapAdmin(
  database: PrismaClient,
  userId: string,
): Promise<void> {
  await database.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      select: { status: true },
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Etkinleştirilecek yönetici hesabı bulunamadı.");
    }

    const superAdminRole = await transaction.role.upsert({
      create: SUPER_ADMIN_ROLE,
      update: {
        description: SUPER_ADMIN_ROLE.description,
        name: SUPER_ADMIN_ROLE.name,
      },
      where: { key: SUPER_ADMIN_ROLE.key },
    });
    const existingAssignment = await transaction.userRole.findUnique({
      select: { userId: true },
      where: {
        userId_roleId: {
          roleId: superAdminRole.id,
          userId,
        },
      },
    });

    await transaction.user.update({
      data: { status: "ACTIVE" },
      where: { id: userId },
    });
    await transaction.userRole.upsert({
      create: { roleId: superAdminRole.id, userId },
      update: {},
      where: { userId_roleId: { roleId: superAdminRole.id, userId } },
    });

    if (user.status !== "ACTIVE" || !existingAssignment) {
      await transaction.auditLog.create({
        data: {
          action: "user.bootstrap_admin_activated",
          actorType: "SYSTEM",
          afterSummary: { roles: ["SUPER_ADMIN"], status: "ACTIVE" },
          beforeSummary: {
            roles: existingAssignment ? ["SUPER_ADMIN"] : [],
            status: user.status,
          },
          correlationId: `auth-bootstrap:${userId}`,
          entityId: userId,
          entityType: "USER",
          reason: "ALLOWLISTED_GOOGLE_SIGN_IN",
        },
      });
    }
  });
}
