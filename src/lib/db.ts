import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnvironment } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const environment = getServerEnvironment();
  const adapter = new PrismaPg({ connectionString: environment.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: environment.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getDatabase(): PrismaClient {
  const database = globalForPrisma.prisma ?? createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = database;
  }

  return database;
}
