import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { isGeneratedPath } from "#tooling/project";

import { repoRoot } from "./harness";

const appDirectory = join(repoRoot, "src");
const uiGuide = join(repoRoot, "docs", "agents", "UI_MOTION.md");

function filesUnder(directory: string, extensions: readonly string[]): string[] {
  return readdirSync(directory, { recursive: true, encoding: "utf8" })
    .filter((file) => !file.split("/").some((segment) => segment.startsWith(".")))
    .filter((file) => extensions.some((extension) => file.endsWith(extension)))
    .map((file) => join(directory, file));
}

function declaredNames(css: string) {
  const utilities = [...css.matchAll(/@utility\s+([\w-]+)/g)].map((match) => match[1] ?? "");
  const classes = [...css.matchAll(/^\.([\w-]+)[\s,:{]/gm)].map((match) => match[1] ?? "");
  return [...utilities, ...classes];
}

const documented = [...readFileSync(uiGuide, "utf8").matchAll(/`([^`]+)`/g)]
  .map((match) => match[1] ?? "")
  .join("\n");

const source = filesUnder(appDirectory, [".ts", ".tsx"])
  .filter((file) => !isGeneratedPath(relative(repoRoot, file)))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const declared = filesUnder(appDirectory, [".css"]).flatMap((file) =>
  declaredNames(readFileSync(file, "utf8")).map((name) => ({
    name,
    file: relative(repoRoot, file),
  })),
);

const named = (name: string, text: string) => new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(text);
const unused = declared.filter(({ name }) => !named(name, source) && !named(name, documented));

describe("Stylesheets", () => {
  it("declare only utilities and classes that some source file or the UI guide uses", () => {
    expect(
      unused,
      "Delete each unused rule from its stylesheet, use it, or name it in docs/agents/UI_MOTION.md.",
    ).toEqual([]);
  });
});
