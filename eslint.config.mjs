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
    // Build-generated artifacts from scripts/build-dashboard-source.mjs: the two
    // external clones and the compiled Dashboard bundle. All gitignored and never
    // hand-authored, so they must not be linted with the app's config. (CI never
    // sees them during lint because the build step runs last, but a local build
    // followed by `eslint .` would otherwise fail on this generated output.)
    ".dashboard-source/**",
    ".kedi-source/**",
    "public/yonetim-static/**",
  ]),
]);
