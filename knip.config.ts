import type { KnipConfig } from "knip";

export default {
  // vp (vite-plus) consumes these internally via oxlint bridge — knip can't trace string specifiers
  ignoreDependencies: [
    "oxlint",
    "eslint-plugin-react-hooks",
    "eslint-plugin-testing-library",
    "eslint-plugin-jest-dom",
    "eslint-plugin-playwright",
    "@tanstack/eslint-plugin-router",
    "@tanstack/eslint-plugin-query",
  ],
  // skills CLI is invoked in prepare script
  ignoreBinaries: ["skills"],
  // Consumed by the react-doctor CLI, which knip has no plugin for
  ignore: ["doctor.config.ts"],
} satisfies KnipConfig;
