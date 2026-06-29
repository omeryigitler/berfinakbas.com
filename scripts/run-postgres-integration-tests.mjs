import { spawnSync } from "node:child_process";

import { config } from "dotenv";

config({ path: ".env.integration", quiet: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL tanımlanmalıdır. Yerel değer için .env.integration dosyasını kullanın.",
  );
}

const parsedUrl = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ""));
const localHosts = new Set(["127.0.0.1", "::1", "localhost"]);

if (!parsedUrl.protocol.startsWith("postgresql")) {
  throw new Error("TEST_DATABASE_URL bir PostgreSQL bağlantısı olmalıdır.");
}
if (!/(?:test|integration)/i.test(databaseName)) {
  throw new Error("Integration veritabanı adı 'test' veya 'integration' içermelidir.");
}
if (
  !localHosts.has(parsedUrl.hostname) &&
  process.env.ALLOW_REMOTE_INTEGRATION_DATABASE !== "true"
) {
  throw new Error(
    "Uzak integration veritabanı varsayılan olarak kapalıdır. Bilinçli kullanım için ALLOW_REMOTE_INTEGRATION_DATABASE=true tanımlayın.",
  );
}

const environment = {
  ...process.env,
  APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  AUTH_SECRET:
    process.env.AUTH_SECRET ?? "integration-test-secret-that-is-at-least-32-characters-long",
  BUSINESS_TIME_ZONE: process.env.BUSINESS_TIME_ZONE ?? "Europe/Istanbul",
  DATABASE_URL: testDatabaseUrl,
  NODE_ENV: "test",
  TEST_DATABASE_URL: testDatabaseUrl,
};
const packageManagerPath = process.env.npm_execpath;

function runPackageManager(args) {
  const result = packageManagerPath
    ? spawnSync(process.execPath, [packageManagerPath, ...args], {
        env: environment,
        stdio: "inherit",
      })
    : spawnSync("pnpm", args, { env: environment, stdio: "inherit" });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

runPackageManager(["exec", "prisma", "migrate", "deploy"]);
runPackageManager(["exec", "vitest", "run", "--config", "vitest.integration.config.ts"]);
