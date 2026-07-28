import type { PrismaClient } from "@/generated/prisma/client";

const SUPER_ADMIN_ROLE = {
  key: "SUPER_ADMIN" as const,
};

export async function activateBootstrapAdmin(
  database: PrismaClient,
  userId: string,
): Promise<void> {
  await database.$transaction(async (transaction) => {
    const [user, superAdminRole] = await Promise.all([
      transaction.user.findUnique({
        select: { status: true },
        where: { id: userId },
      }),
      transaction.role.findUnique({
        select: { id: true },
        where: { key: SUPER_ADMIN_ROLE.key },
      }),
    ]);

    if (!user) {
      throw new Error("Etkinleştirilecek yönetici hesabı bulunamadı.");
    }
    // Fail closed: production sign-in must never mint an authorization role.
    if (!superAdminRole) {
      throw new Error("SUPER_ADMIN rolü bulunamadı");
    }

    const existingAssignment = await transaction.userRole.findUnique({
      select: { userId: true },
      where: {
        userId_roleId: {
          roleId: superAdminRole.id,
          userId,
        },
      },
    });

    if (user.status !== "ACTIVE") {
      await transaction.user.update({
        data: { status: "ACTIVE" },
        where: { id: userId },
      });
    }
    if (!existingAssignment) {
      await transaction.userRole.create({
        data: { roleId: superAdminRole.id, userId },
      });
    }

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
