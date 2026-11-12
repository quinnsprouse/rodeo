import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";

import { compile } from "tailwindcss";
import { describe, expect, it } from "vite-plus/test";

import { isGeneratedPath } from "#tooling/project";

import { repoRoot } from "./harness";
import { spacingNamesShadowingContainers } from "./rules/no-off-theme-classes.js";

const appDirectory = join(repoRoot, "src");
const appStylesheet = join(appDirectory, "styles", "app.css");
const requireFromRoot = createRequire(join(repoRoot, "package.json"));
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function packageStylesheet(name: string) {
  const directory = join(repoRoot, "node_modules", name);
  const manifest: unknown = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  const exported = isRecord(manifest) && isRecord(manifest.exports) ? manifest.exports["."] : null;
  const style = isRecord(exported) ? exported.style : null;
  if (typeof style !== "string") throw new Error(`${name} exports no stylesheet`);
  return join(directory, style);
}

function loadStylesheet(id: string, base: string) {
  const path = id.startsWith(".") ? resolve(base, id) : packageStylesheet(id);
  return Promise.resolve({ path, base: dirname(path), content: readFileSync(path, "utf8") });
}

const themeNames = (css: string, namespace: string) =>
  [...css.matchAll(new RegExp(`--${namespace}-([\\w-]+):`, "g"))].map((match) => match[1] ?? "");

const appCss = readFileSync(appStylesheet, "utf8");
const tailwindTheme = readFileSync(requireFromRoot.resolve("tailwindcss/theme.css"), "utf8");
const containerNames = new Set(themeNames(tailwindTheme, "container"));
const shadowedNames = themeNames(appCss, "spacing").filter((name) => containerNames.has(name));

const widthUtilities = [
  { prefix: "w", property: "width" },
  { prefix: "min-w", property: "min-width" },
  { prefix: "max-w", property: "max-width" },
  { prefix: "basis", property: "flex-basis" },
].flatMap(({ prefix, property }) =>
  shadowedNames.map((name) => ({ utility: `${prefix}-${name}`, property, name })),
);

async function compiledRules(utilities: readonly string[]) {
  const compiler = await compile(appCss, { base: dirname(appStylesheet), loadStylesheet });
  const css = compiler.build([...utilities]);
  const declarations = new Map(
    [...css.matchAll(/^\s*\.([\w-]+) \{\s*([\w-]+): ([^;]+);/gm)].map(
      ([, utility = "", property = "", value = ""]) => [utility, `${property}: ${value}`],
    ),
  );
  return utilities.map((utility) => `${utility} { ${declarations.get(utility) ?? "missing"} }`);
}

describe("Theme sizes", () => {
  it("leave Tailwind's container widths on the width utilities whose names the spacing scale shares", async () => {
    expect(
      await compiledRules(widthUtilities.map(({ utility }) => utility)),
      "Map each listed name to its container width in src/styles/app.css, as --max-width-xl: var(--container-xl) does.",
    ).toEqual(
      widthUtilities.map(
        ({ utility, property, name }) => `${utility} { ${property}: var(--container-${name}) }`,
      ),
    );
  });

  it("are the names the lint rule rejects on logical sizes, which have no theme key to map", () => {
    expect(
      shadowedNames,
      "Update spacingNamesShadowingContainers in lint/rules/no-off-theme-classes.js.",
    ).toEqual(spacingNamesShadowingContainers);
  });
});
