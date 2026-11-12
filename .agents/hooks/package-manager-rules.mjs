import { isFlag } from "./simple-command.mjs";

const verdicts = {
  foreignPackageManager: {
    decision: "deny",
    reason:
      "This project is npm-only (see devEngines in package.json). Use `vp add <pkg>` or `npm install`.",
  },
  downloadedTool: {
    decision: "deny",
    reason:
      "Use the project commands: `vp lint`, `vp fmt`, `vp test`. One-off tool downloads can bypass the project's pinned versions.",
  },
};

const PACKAGE_INSTALLS = new Set(["add", "install", "i", "remove", "rm"]);
const DOWNLOADED_TOOLS = new Set(["oxlint", "oxfmt", "vitest", "eslint", "prettier"]);

function packageManagerVerdict(args) {
  const action = args.find((word) => !isFlag(word))?.text;
  return PACKAGE_INSTALLS.has(action) ? verdicts.foreignPackageManager : null;
}

function npxVerdict(args) {
  const tool = args.find((word) => !isFlag(word))?.text.replace(/(?<=.)@.*$/, "");
  return DOWNLOADED_TOOLS.has(tool) ? verdicts.downloadedTool : null;
}

export const packageManagerPrograms = new Map([
  ["pnpm", packageManagerVerdict],
  ["yarn", packageManagerVerdict],
  ["bun", packageManagerVerdict],
  ["npx", npxVerdict],
]);
