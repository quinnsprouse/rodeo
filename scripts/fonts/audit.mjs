import { spawnSync } from "node:child_process";
import { globSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import { generatedFiles } from "#tooling/project";
import { startBuiltServer } from "#tooling/server";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const config = JSON.parse(readFileSync(new URL("config.json", import.meta.url), "utf8"));
const usagePath = join(repoRoot, config.outputs.usage);
const families = [...new Set(config.faces.map((face) => face.family))];
const maxScrollSteps = 2000;
const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const generatedPaths = generatedFiles.map((file) => file.path);

function collectFontUsage(familyNames) {
  const wanted = new Map(familyNames.map((name) => [name.toLowerCase(), name]));
  const styleKeys = [
    "fontWeight",
    "fontStyle",
    "fontStretch",
    "fontFeatureSettings",
    "fontVariationSettings",
    "fontVariantLigatures",
    "fontVariantNumeric",
    "fontVariantCaps",
    "fontVariantPosition",
    "fontVariantEastAsian",
    "fontVariantAlternates",
    "fontKerning",
    "fontSynthesis",
    "fontOpticalSizing",
    "textRendering",
    "writingMode",
  ];
  const groups = new Map();
  const unrendered = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "TITLE"]);

  const familyOf = (style) =>
    style.fontFamily
      .split(",")
      .map((name) =>
        name
          .trim()
          .replace(/^["']|["']$/g, "")
          .toLowerCase(),
      )
      .map((name) => wanted.get(name))
      .find(Boolean);

  const languageOf = (element) => element.closest("[lang]")?.getAttribute("lang") ?? "";

  const transformed = (text, style, language) => {
    const locale = language || undefined;
    const upper = text.toLocaleUpperCase(locale);
    const lower = text.toLocaleLowerCase(locale);
    if (style.fontVariantCaps !== "normal") return text + upper + lower;
    if (style.textTransform.includes("uppercase")) return upper;
    if (style.textTransform.includes("lowercase")) return lower;
    if (style.textTransform.includes("capitalize")) return text + upper;
    return text;
  };

  const add = (style, text, element) => {
    const family = familyOf(style);
    if (!family || !text) return;
    const language = languageOf(element);
    let characters = transformed(text, style, language);
    if (style.hyphens === "auto" || characters.includes("\u00AD")) characters += "\u2010-";
    const key = JSON.stringify([family, language, ...styleKeys.map((name) => style[name])]);
    let group = groups.get(key);
    if (!group) {
      group = {
        family,
        language,
        ...Object.fromEntries(styleKeys.map((name) => [name, style[name]])),
        characters: new Set(),
      };
      groups.set(key, group);
    }
    for (const character of characters) group.characters.add(character);
  };

  const contentText = (content, element, style) => {
    if (content === "none" || content === "normal") return "";
    let text = "";
    for (const match of content.matchAll(
      /"((?:[^"\\]|\\.)*)"|attr\(\s*([\w-]+)\s*\)|(open-quote|close-quote)|counters?\(/g,
    )) {
      if (match[1] !== undefined) {
        text += match[1].replace(/\\([0-9a-fA-F]{1,6})\s?|\\(.)/g, (_, codePoint, literal) =>
          codePoint ? String.fromCodePoint(Number.parseInt(codePoint, 16)) : literal,
        );
      } else if (match[2]) {
        text += element.getAttribute(match[2]) ?? "";
      } else if (match[3]) {
        text +=
          style.quotes === "auto" || style.quotes === "none"
            ? "\u201C\u201D\u2018\u2019"
            : style.quotes;
      } else {
        text += "0123456789.";
      }
    }
    return text;
  };

  const markerText = (style) => {
    const type = style.listStyleType;
    if (type === "none") return "";
    if (type === "disc" || type === "circle" || type === "square") return "\u2022\u25E6\u25AA ";
    return "0123456789. ";
  };

  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || unrendered.has(element.tagName) || element.closest("head")) continue;
    add(getComputedStyle(element), node.data, element);
  }

  for (const element of document.body.querySelectorAll("*")) {
    const style = getComputedStyle(element);
    if (style.textOverflow.includes("ellipsis") || style.webkitLineClamp !== "none") {
      add(style, "\u2026", element);
    }
    for (const pseudo of ["::before", "::after"]) {
      const pseudoStyle = getComputedStyle(element, pseudo);
      add(pseudoStyle, contentText(pseudoStyle.content, element, pseudoStyle), element);
    }
    if (style.display.includes("list-item")) {
      add(getComputedStyle(element, "::marker"), markerText(style), element);
    }
    for (const pseudo of ["::first-letter", "::first-line"]) {
      const pseudoStyle = getComputedStyle(element, pseudo);
      if (
        pseudoStyle.fontWeight !== style.fontWeight ||
        pseudoStyle.fontStyle !== style.fontStyle
      ) {
        add(pseudoStyle, element.textContent ?? "", element);
      }
    }
    if (element.matches("input:not([type=hidden]), textarea")) {
      add(style, element.value, element);
      add(getComputedStyle(element, "::placeholder"), element.getAttribute("placeholder"), element);
    }
  }

  for (const group of groups.values()) group.characters = [...group.characters].join("");
  return [...groups.values()];
}

function mergeGroups(target, groups) {
  for (const group of groups) {
    const { characters, ...style } = group;
    const key = JSON.stringify(style);
    const existing = target.get(key);
    if (existing) {
      for (const character of characters) existing.characters.add(character);
    } else {
      target.set(key, { ...style, characters: new Set(characters) });
    }
  }
}

function inOrder(items, run) {
  return items.reduce((previous, item) => previous.then(() => run(item)), Promise.resolve());
}

async function sitemapPaths(origin) {
  const sitemap = await fetch(`${origin}/sitemap.xml`).then((response) => response.text());
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
}

async function sitePages(origin) {
  const fromSitemap = (await sitemapPaths(origin)).filter((path) => !config.pages.includes(path));
  const notFound = config.notFoundPage ? [config.notFoundPage] : [];
  return [...fromSitemap, ...config.pages, ...notFound];
}

async function scrollThrough(page, collect, stepsLeft = maxScrollSteps) {
  const reachedEnd = await page.evaluate(() => {
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight;
    window.scrollBy(0, window.innerHeight);
    return atBottom;
  });
  await page.waitForTimeout(150);
  await collect();
  if (!reachedEnd && stepsLeft > 0) await scrollThrough(page, collect, stepsLeft - 1);
}

async function exercisePage(page, groups) {
  const collect = async () => mergeGroups(groups, await page.evaluate(collectFontUsage, families));
  await collect();
  await scrollThrough(page, collect);
  const tabs = await page.getByRole("tab").all();
  await inOrder(tabs, async (tab) => {
    if (!(await tab.isVisible())) return;
    await tab.click();
    await inOrder([1, 2, 3, 4], async () => {
      await page.waitForTimeout(700);
      await collect();
    });
  });
}

async function auditSite(origin) {
  const groups = new Map();
  const pages = await sitePages(origin);
  const browser = await chromium.launch();
  const visits = viewports.flatMap((viewport) => pages.map((path) => ({ viewport, path })));
  try {
    await inOrder(visits, async ({ viewport, path }) => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const response = await page.goto(origin + path, { waitUntil: "load" });
      if (path !== config.notFoundPage && !response?.ok()) {
        throw new Error(
          `${path} answered ${response?.status()}. Update pages in scripts/fonts/config.json.`,
        );
      }
      await exercisePage(page, groups);
      await context.close();
    });
  } finally {
    await browser.close();
  }
  return { paths: pages, groups: [...groups.values()] };
}

function sourceCharacters() {
  const found = new Map();
  const files = readdirSync(join(repoRoot, "src"), { recursive: true, encoding: "utf8" })
    .map((file) => join("src", file))
    .filter(
      (file) =>
        /\.(tsx?|css|mdx?)$/.test(file) && !generatedPaths.some((path) => file.startsWith(path)),
    );
  for (const file of files) {
    for (const character of readFileSync(join(repoRoot, file), "utf8")) {
      if (character.codePointAt(0) > 0x7e) {
        found.set(character, [...(found.get(character) ?? []), file]);
      }
    }
  }
  return found;
}

function contentCharacters() {
  return new Map(
    config.contentFiles.map(({ family, files }) => {
      const characters = new Set();
      for (const file of files.flatMap((pattern) => globSync(pattern, { cwd: repoRoot }))) {
        for (const character of readFileSync(join(repoRoot, file), "utf8")) {
          if (character.codePointAt(0) > 0x7e) characters.add(character);
        }
      }
      return [family, characters];
    }),
  );
}

function sortedText(characters) {
  return [...characters].toSorted((a, b) => a.codePointAt(0) - b.codePointAt(0)).join("");
}

function hex(character) {
  return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
}

function build() {
  const result = spawnSync("vp", ["build", "--mode", "e2e", "--logLevel", "error"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function format(path) {
  const result = spawnSync("vp", ["fmt", path], { cwd: repoRoot, encoding: "utf8" });
  if (result.status === 0) return;
  process.stderr.write([result.error?.message, result.stdout, result.stderr].join("\n"));
  process.exit(result.status ?? 1);
}

build();
const server = await startBuiltServer({ root: repoRoot });
let audit;
try {
  audit = await auditSite(server.origin);
} finally {
  await server.stop();
}

const content = contentCharacters();
const kept = new Set(Array.from(content.values(), (characters) => Array.from(characters)).flat());
const rendered = new Set(audit.groups.flatMap((group) => [...group.characters]));
const unseen = [...sourceCharacters()]
  .filter(([character]) => !rendered.has(character) && !kept.has(character))
  .map(
    ([character, files]) => `${hex(character)} ${character} in ${[...new Set(files)].join(", ")}`,
  );

const usage = {
  pages: audit.paths,
  viewports,
  groups: audit.groups
    .map((group) => Object.assign(group, { characters: sortedText(group.characters) }))
    .toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  contentCharacters: Object.fromEntries(
    Array.from(content, ([family, characters]) => [family, sortedText(characters)]),
  ),
  sourceCharactersNotRendered: unseen,
};
writeFileSync(usagePath, `${JSON.stringify(usage, null, 2)}\n`);
format(usagePath);

console.log(`Audited ${audit.paths.length} pages at ${viewports.length} viewports.`);
for (const line of unseen) {
  console.log(`Not seen on any audited page, so not kept unless a font already needs it: ${line}`);
}
