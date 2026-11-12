import { isFlag } from "./simple-command.mjs";

const verdicts = {
  foreignPackageManager: {
    decision: "deny",
    reason:
      "This project is npm-only (see devEngines in package.json), and other package managers write their own lockfiles and resolve other versions. Use npm: `vp add <pkg>` or `npm install` for dependencies, `npm run <script>` for scripts.",
  },
  downloadedTool: {
    decision: "deny",
    reason:
      "Use the project commands: `vp lint`, `vp fmt`, `vp test`. One-off tool downloads can bypass the project's pinned versions.",
  },
};

const QUERIES = new Set(["--version", "-v", "--help", "-h", "help"]);
const DOWNLOADED_TOOLS = new Set(["oxlint", "oxfmt", "vitest", "eslint", "prettier"]);

function foreignPackageManagerVerdict(args) {
  const query = args.length === 1 && QUERIES.has(args[0].text);
  return query ? null : verdicts.foreignPackageManager;
}

function npxVerdict(args) {
  const tool = args.find((word) => !isFlag(word))?.text.replace(/(?<=.)@.*$/, "");
  if (tool !== "npx" && packageManagerPrograms.has(tool)) return verdicts.foreignPackageManager;
  return DOWNLOADED_TOOLS.has(tool) ? verdicts.downloadedTool : null;
}

export const packageManagerPrograms = new Map([
  ["pnpm", foreignPackageManagerVerdict],
  ["yarn", foreignPackageManagerVerdict],
  ["bun", foreignPackageManagerVerdict],
  ["pnpx", foreignPackageManagerVerdict],
  ["bunx", foreignPackageManagerVerdict],
  ["npx", npxVerdict],
]);
