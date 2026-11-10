import type { KnipConfig } from "knip";

import { lintConfig } from "./lint/config";

const lintPluginPackages = lintConfig.jsPlugins
  .map(({ specifier }) => specifier)
  .filter((specifier) => !specifier.startsWith("."));

// why: These modules are the kit API the starter ships for apps, several of them taught in
// docs/agents/UI_MOTION.md, so Knip keeps them before an app renders them.
const keptKit = [
  "src/components/theme-toggle.tsx",
  "src/components/ui/shimmer-text.tsx",
  "src/components/ui/snippet.tsx",
  "src/hooks/use-on-screen.ts",
  "src/hooks/use-play-on-view.ts",
  "src/hooks/use-prefers-reduced-motion.ts",
  "src/hooks/use-theme-revealing.ts",
  "src/hooks/use-web-animation.ts",
];

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
    ...keptKit,
  ],
  ignoreDependencies: [
    // why: The commit-msg shell hook runs this executable, outside Knip's JavaScript analysis.
    "@commitlint/cli",
    // why: The starter ships these for apps to use, as docs/agents/UI_MOTION.md describes, so
    // they stay installed before an app imports them.
    "torph",
    "skullet",
    "glimm",
    "motion",
    // why: Oxlint loads these plugins by package name from lint/config.ts, and Knip reads lint
    // plugins only from vite.config.ts itself.
    ...lintPluginPackages,
  ],
  // why: npm run fonts runs its fontTools step through uv, a Python tool that npm cannot install.
  ignoreBinaries: ["uv"],
  // why: Only the react-doctor CLI reads this file, and Knip has no plugin for it.
  ignore: ["doctor.config.ts"],
} satisfies KnipConfig;
