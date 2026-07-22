import "dotenv/config";

import { defineConfig, env } from "prisma/config";

type PrismaEnvironment = {
  DATABASE_URL: string;
};

const migrationDatabaseUrl =
  process.env.DATABASE_URL_UNPOOLED?.trim() || env<PrismaEnvironment>("DATABASE_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationDatabaseUrl,
  },
});
