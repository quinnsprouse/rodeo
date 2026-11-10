export const fontOutputs = {
  fonts: "src/assets/fonts",
  stylesheet: "src/styles/fonts.gen.css",
  usage: "scripts/fonts/usage.json",
};

export const generatedFiles = [
  {
    path: "src/routeTree.gen.ts",
    generator: "TanStack Router",
    howToRegenerate:
      "Add, edit, or delete a file under src/routes/ and the hooks, `npm run check`, dev, and build regenerate it.",
  },
  {
    path: "src/lib/cn-tables.ts",
    generator: "the cn Vite plugin",
    howToRegenerate:
      "Change the class names in src/ or the theme in src/styles/app.css, and dev and build regenerate it.",
  },
  ...[fontOutputs.stylesheet, `${fontOutputs.fonts}/`, fontOutputs.usage].map((path) => ({
    path,
    generator: "`npm run fonts`",
    howToRegenerate:
      "It reads the pages and scripts/fonts/sources/. Change the content or scripts/fonts/subset.py and rerun it.",
  })),
];

export const ignoredDirectories = [
  ".git",
  "node_modules",
  ".output",
  "dist",
  ".tanstack",
  ".tanstack-start",
  ".scratch",
  "test-results",
  "playwright-report",
  "coverage",
  ".vitest",
  "tmp",
  ".vercel",
  ".wrangler",
];

export const typedExtensions = new Set([".cts", ".mts", ".ts", ".tsx"]);

export const lintableExtensions = new Set([...typedExtensions, ".cjs", ".js", ".jsx", ".mjs"]);

export const checkableExtensions = new Set([
  ...lintableExtensions,
  ".css",
  ".html",
  ".json",
  ".jsonc",
  ".md",
  ".yaml",
  ".yml",
]);

export const gitHooksDirectory = ".vite-hooks";

const docLocations = [
  ".agents/",
  ".claude/",
  ".codex/",
  ".github/",
  ".scratch/",
  "docs/agents/",
  "gui/",
];

const rootDocs = new Set(["AGENTS.md", "CLAUDE.md", "GUI.md", "README.md"]);

export const docReason =
  "Project docs live in docs/agents/, theme guidance in GUI.md and gui/. Docs cover only what code, types, and lint errors can't say. Put plans, PRDs, decision records, and notes in .scratch/, which Git ignores. To keep a decision, encode it in code, a type, or a lint rule.";

export const appUnitTestReason =
  "App code has no unit tests. Test the behavior end to end in e2e/ with Playwright, through the page or through the server's HTTP endpoints. See docs/agents/TESTING.md.";

export function isMarkdown(path) {
  return /\.mdx?$/.test(path);
}

export function isAllowedDoc(path) {
  return rootDocs.has(path) || docLocations.some((location) => path.startsWith(location));
}

export function isAppUnitTest(path) {
  return /^src\/.+\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path);
}
