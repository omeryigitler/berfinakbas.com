import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "src/generated/prisma/**",
    "next-env.d.ts",
    // Override source for the external dashboard clone; built by a separate Vite
    // pipeline (scripts/build-dashboard-source.mjs), not the Next.js app, so it is
    // not typechecked/linted with the app's config.
    "dashboard-overrides/**",
  ]),
]);
