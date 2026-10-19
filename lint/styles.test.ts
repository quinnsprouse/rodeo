import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stylesDirectory = join(repoRoot, "src", "styles");
const generatedFiles = new Set(["src/lib/cn-tables.ts"]);
// why: docs/agents/UI_MOTION.md tells agents to draw dividers with these utilities, so they stay
// even before a page uses them.
const documentedUtilities = new Set(["divider-t", "divider-b", "divider-r"]);

function filesUnder(directory: string, extensions: readonly string[]): string[] {
  return readdirSync(directory, { recursive: true, encoding: "utf8" })
    .filter((file) => extensions.some((extension) => file.endsWith(extension)))
    .map((file) => join(directory, file));
}

function declaredNames(css: string) {
  const utilities = [...css.matchAll(/@utility\s+([\w-]+)/g)].map((match) => match[1] ?? "");
  const classes = [...css.matchAll(/^\.([\w-]+)[\s,:{]/gm)].map((match) => match[1] ?? "");
  return [...utilities, ...classes];
}

const source = filesUnder(join(repoRoot, "src"), [".ts", ".tsx"])
  .filter((file) => !generatedFiles.has(relative(repoRoot, file)))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const declared = filesUnder(stylesDirectory, [".css"]).flatMap((file) =>
  declaredNames(readFileSync(file, "utf8")).map((name) => ({
    name,
    file: relative(repoRoot, file),
  })),
);

const isUsed = (name: string) => new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(source);
const unused = declared.filter(({ name }) => !documentedUtilities.has(name) && !isUsed(name));

describe("Stylesheets", () => {
  it("declare only utilities and classes that some source file uses", () => {
    expect(unused, "Delete each unused rule from its stylesheet, or use it.").toEqual([]);
  });
});
