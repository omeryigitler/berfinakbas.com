import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnvironment } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const environment = getServerEnvironment();
  const adapter = new PrismaPg({
    connectionString: environment.DATABASE_URL,
    // The driver adapter serializes Date values as UTC text. Keeping every
    // application connection in UTC prevents PostgreSQL from interpreting
    // that text in the server or developer machine time zone.
    options: "-c timezone=UTC",
  });

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
