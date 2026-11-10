import type { KnipConfig } from "knip";

import { lintConfig } from "./lint/config";

const lintPluginPackages = lintConfig.jsPlugins
  .map(({ specifier }) => specifier)
  .filter((specifier) => !specifier.startsWith("."));

export default {
  // why: Knip cannot see files that tools load by path or by convention: hook and script
  // commands, the lint plugin specifier, route files, and src/start.ts.
  entry: [
    ".agents/hooks/{pre-tool-guard,post-edit,stop-check}.mjs",
    "lint/rules.js",
    "e2e/**/*.ts",
    "scripts/*.mjs",
    "src/routes/**/*.{ts,tsx}",
    "src/start.ts",
  ],
  ignoreDependencies: [
    // why: The commit-msg shell hook runs this executable, outside Knip's JavaScript analysis.
    "@commitlint/cli",
    // why: The starter ships torph, skullet, and glimm for apps to use, as
    // docs/agents/UI_MOTION.md describes. The demo has no changing label, loading data, or
    // milestone moment, so nothing imports them yet.
    "torph",
    "skullet",
    "glimm",
    // why: Oxlint loads these plugins by package name from lint/config.ts, and Knip reads lint
    // plugins only from vite.config.ts itself.
    ...lintPluginPackages,
  ],
  // why: npm run fonts runs its fontTools step through uv, a Python tool that npm cannot install.
  ignoreBinaries: ["uv"],
  // why: Only the react-doctor CLI reads this file, and Knip has no plugin for it.
  ignore: ["doctor.config.ts"],
} satisfies KnipConfig;
