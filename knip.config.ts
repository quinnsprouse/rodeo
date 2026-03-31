import type { KnipConfig } from "knip";

export default {
  // vp (vite-plus) consumes these internally via oxlint bridge — knip can't trace string specifiers
  ignoreDependencies: [
    "oxlint",
    "eslint-plugin-react-hooks",
    "@tanstack/eslint-plugin-router",
    "@tanstack/eslint-plugin-query",
    // Type reference in __root.tsx and optional coverage provider
    "vite",
    "@vitest/coverage-v8",
  ],
  // skills CLI is invoked in prepare script
  ignoreBinaries: ["skills"],
} satisfies KnipConfig;
