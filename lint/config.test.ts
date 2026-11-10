import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = readFileSync(join(repoRoot, "vite.config.ts"), "utf8");

const cheapSpecifiers = [/^node:/, /^vite-plus$/, /^\.\//];
const staticImport = /^import\s+(?!type\s)[^;]*?["']([^"']+)["']/gm;

const loadedOnEveryRun = [...config.matchAll(staticImport)]
  .map((match) => match[1] ?? "")
  .filter((specifier) => !cheapSpecifiers.some((cheap) => cheap.test(specifier)));

describe("vite.config.ts", () => {
  it("loads Vite plugins inside lazyPlugins, not with a static import", () => {
    expect(
      loadedOnEveryRun,
      "Load each module listed here with import() inside the lazyPlugins callback. vp lint and vp fmt load vite.config.ts on every run, including after each agent edit, and a static plugin import adds over a second to each. See docs/agents/VITE_PLUS.md",
    ).toEqual([]);
  });
});
