import type { KnipConfig } from "knip";

export default {
  // Vite+ is not a stock Vite/Vitest package, so make its executable surfaces explicit.
  entry: [
    "commitlint.config.ts",
    "e2e/**/*.ts",
    "playwright.config.ts",
    "scripts/**/*.mjs",
    "src/router.tsx",
    "src/routes/**/*.{ts,tsx}",
    "src/**/*.test.{ts,tsx}",
    "src/test/setup.ts",
    "vite.config.ts",
    "vitest.config.ts",
  ],
  // vp (vite-plus) consumes these internally via oxlint bridge — knip can't trace string specifiers
  ignoreDependencies: [
    "@commitlint/cli",
    "@vitest/coverage-v8",
    "jsdom",
    "oxlint",
    "eslint-plugin-react-hooks",
    "eslint-plugin-testing-library",
    "eslint-plugin-jest-dom",
    "eslint-plugin-playwright",
    "@tanstack/eslint-plugin-router",
    "@tanstack/eslint-plugin-query",
  ],
  // skills CLI is invoked by the optional setup:skills package script
  ignoreBinaries: ["skills"],
  // Consumed by the react-doctor CLI, which knip has no plugin for
  ignore: ["doctor.config.ts"],
} satisfies KnipConfig;
