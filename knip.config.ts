import { existsSync } from "node:fs";

import type { KnipConfig } from "knip";

import { lintConfig } from "./lint/config";

const lintPluginPackages = lintConfig.jsPlugins
  .map(({ specifier }) => specifier)
  .filter((specifier) => !specifier.startsWith("."));

// why: Oxlint loads the lint plugin and React Doctor loads its config by path, and the hooks and
// tests run scripts that package.json does not name, so Knip finds none of them.
const loadedByPath = ["lint/rules.js", "doctor.config.ts", "scripts/*.mjs"];

// why: docs/agents/UI_MOTION.md teaches these hooks, and the starter ships them before a page
// uses them.
const taughtHooks = ["src/hooks/use-play-on-view.ts", "src/hooks/use-web-animation.ts"];

// why: The demo owns "/" until scripts/remove-demo.mjs writes the route that renders this file.
const starterHome = existsSync(new URL("src/demo", import.meta.url))
  ? ["src/components/starter-home.tsx"]
  : [];

export default {
  entry: [...loadedByPath, ...taughtHooks, ...starterHome],
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
} satisfies KnipConfig;
