import { globSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";
import * as z from "zod/mini";

import { ignoredDirectories } from "#tooling/project";

import { declinedLandminesRules, lintConfig } from "./config";
import { exceptions } from "./exceptions";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRoot = createRequire(join(repoRoot, "package.json"));

const cheapPackages = [/^node:/, /^vite-plus$/, /^vite-plus\/lint\/plugins$/];
const staticImport =
  /^(?:import\s+(?!type\s)(?:[^;]*?\sfrom\s+)?|export\s+(?!type\s)[^;]*?\sfrom\s+)["']([^"']+)["']/gm;
const localExtensions = ["", ".ts", ".js", ".mjs"];

function resolveLocal(specifier: string, importer: string) {
  if (specifier.startsWith("#")) return requireFromRoot.resolve(specifier);
  if (!specifier.startsWith("./")) return null;
  const base = join(dirname(importer), specifier);
  return localExtensions
    .map((extension) => base + extension)
    .find((path) => statSync(path, { throwIfNoEntry: false })?.isFile());
}

function packagesLoadedWith(entry: string) {
  const seen = new Set<string>();
  const packages: string[] = [];
  const pending = [entry];
  for (let file = pending.pop(); file !== undefined; file = pending.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, specifier = ""] of readFileSync(file, "utf8").matchAll(staticImport)) {
      const local = resolveLocal(specifier, file);
      if (local) pending.push(local);
      else if (!cheapPackages.some((cheap) => cheap.test(specifier))) {
        packages.push(`${relative(repoRoot, file)} imports ${specifier}`);
      }
    }
  }
  return packages;
}

describe("vite.config.ts", () => {
  it("loads Vite plugins inside lazyPlugins, not with a static import", () => {
    expect(
      packagesLoadedWith(join(repoRoot, "vite.config.ts")),
      "Load each module listed here with import() inside the lazyPlugins callback. vp lint and vp fmt load vite.config.ts and every local module it imports on every run, including after each agent edit, and a static plugin import adds over a second to each. See docs/agents/VITE_PLUS.md",
    ).toEqual([]);
  });
});

describe("Lint exceptions", () => {
  it("name only files that exist", () => {
    const stale = exceptions
      .flatMap(({ files }) => files)
      .filter(
        (glob) => globSync(glob, { cwd: repoRoot, exclude: ignoredDirectories }).length === 0,
      );

    expect(
      stale,
      "Update or delete each exception in lint/exceptions.ts whose files moved.",
    ).toEqual([]);
  });
});

describe("The landmines rules", () => {
  it("are each turned on in lint/config.ts or declined there with a reason", () => {
    const recommended = z
      .object({ rules: z.record(z.string(), z.unknown()) })
      .parse(
        JSON.parse(
          readFileSync(
            requireFromRoot.resolve("@interfere/landmines/configs/recommended.json"),
            "utf8",
          ),
        ),
      );
    const decided = new Set([
      ...Object.keys(lintConfig.rules),
      ...Object.keys(declinedLandminesRules),
    ]);

    expect(
      Object.keys(recommended.rules).filter((rule) => !decided.has(rule)),
      "This version of @interfere/landmines recommends rules that lint/config.ts has not decided on. Turn each one on in the rules of lint/config.ts with a rejected sample in lint/policy/, or add it to declinedLandminesRules with the reason it does not fit the starter.",
    ).toEqual([]);
  });
});
