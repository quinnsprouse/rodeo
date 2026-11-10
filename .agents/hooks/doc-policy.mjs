export const docLocations = [
  ".agents/",
  ".claude/",
  ".codex/",
  ".github/",
  ".scratch/",
  "docs/agents/",
  "gui/",
];

export const rootDocs = ["AGENTS.md", "CLAUDE.md", "GUI.md", "README.md"];

export const docReason =
  "Project docs live in docs/agents/, theme guidance in GUI.md and gui/. Docs cover only what code, types, and lint errors can't say. Put plans, PRDs, decision records, and notes in .scratch/, which Git ignores. To keep a decision, encode it in code, a type, or a lint rule.";

export const appUnitTestReason =
  "App code has no unit tests. Test the behavior end to end in e2e/ with Playwright, through the page or through the server's HTTP endpoints. See docs/agents/TESTING.md.";

export function isMarkdown(path) {
  return /\.mdx?$/.test(path);
}

export function isAllowedDoc(path) {
  return rootDocs.includes(path) || docLocations.some((location) => path.startsWith(location));
}

export function isAppUnitTest(path) {
  return /^src\/.+\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path);
}
