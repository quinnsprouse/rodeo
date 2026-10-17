import type { KnipConfig } from "knip";

export default {
  // why: Knip cannot see files that tools load by path or by convention: hook and script
  // commands, the lint plugin specifier, route files, and src/start.ts.
  entry: [
    ".agents/hooks/*.mjs",
    "lint/rules.js",
    "e2e/**/*.ts",
    "scripts/**/*.mjs",
    "src/routes/**/*.{ts,tsx}",
    "src/start.ts",
  ],
  ignoreDependencies: [
    // why: The commit-msg shell hook runs this executable, outside Knip's JavaScript analysis.
    "@commitlint/cli",
  ],
  // why: Only the react-doctor CLI reads this file, and Knip has no plugin for it.
  ignore: ["doctor.config.ts"],
} satisfies KnipConfig;
