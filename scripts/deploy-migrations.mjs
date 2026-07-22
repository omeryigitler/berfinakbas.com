import { spawn } from "node:child_process";
import process from "node:process";

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 15_000;
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function runMigration() {
  return new Promise((resolve, reject) => {
    const child = spawn(pnpmCommand, ["exec", "prisma", "migrate", "deploy"], {
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolve({ code: code ?? 1, output, signal });
    });
  });
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = await runMigration();
  if (result.code === 0) {
    process.exit(0);
  }

  const advisoryLockTimeout =
    result.output.includes("P1002") && result.output.toLowerCase().includes("advisory lock");
  if (!advisoryLockTimeout || attempt === MAX_ATTEMPTS) {
    const signalText = result.signal ? ` (signal: ${result.signal})` : "";
    console.error(`Prisma migration failed with exit code ${result.code}${signalText}.`);
    process.exit(result.code || 1);
  }

  const delayMs = BASE_DELAY_MS * attempt;
  console.warn(
    `Another deployment is applying migrations. Retrying in ${delayMs / 1000} seconds ` +
      `(${attempt}/${MAX_ATTEMPTS}).`,
  );
  await wait(delayMs);
}
