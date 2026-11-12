import { join, relative } from "node:path";

import { isWithin, physicalPath } from "./physical-path.mjs";
import { expandHome, hasShort, isFlag, parseArgs } from "./simple-command.mjs";

const verdicts = {
  deletesProject: {
    decision: "ask",
    reason:
      "This deletes the project root or its .git directory, and Git cannot restore it. A human should confirm the delete.",
  },
  deletesWork: {
    decision: "ask",
    reason:
      "These files have changes Git has not committed, so deleting them cannot be undone. A human should confirm the delete.",
  },
  deletesRuntimeTargets: {
    decision: "ask",
    reason:
      "This recursive delete gets its targets from xargs or find at run time, so the guard cannot check them against Git. A human should confirm the delete.",
  },
};

const FIND_LEADING_OPTION = /^-(?:[EHLPXdsx]+|O\d)$/;
const FIND_OPERATORS = new Set(["(", ")", "!", ","]);
const FIND_DEPTH_LIMITS = new Set(["-mindepth", "-maxdepth"]);
const FIND_WHOLE_TREE_PRIMARIES = new Set([
  "-delete",
  "-depth",
  "-d",
  "-xdev",
  "-mount",
  "-x",
  "-print",
  "-print0",
  "-noleaf",
  "-ignore_readdir_race",
  "-follow",
]);
const CURRENT_DIRECTORY = { text: ".", quoted: false };

function hasUncommittedWork(paths, projectRoot) {
  // why: Node takes about 1 ms to load child_process, and the guard runs before every tool call
  // but needs Git only for a recursive delete inside the project.
  const { spawnSync } = process.getBuiltinModule("node:child_process");
  const status = spawnSync(
    "git",
    ["--no-optional-locks", "status", "--porcelain", "--untracked-files=normal", "--", ...paths],
    { cwd: projectRoot, encoding: "utf8", timeout: 5000 },
  );
  return status.status !== 0 || status.stdout.trim() !== "";
}

function recursiveDeleteVerdict(words, { projectRoot, cwd }) {
  const targets = words
    .filter((word) => !word.runtime && !word.text.includes("$"))
    .map((word) => physicalPath(cwd, expandHome(word)));
  const gitDir = join(projectRoot, ".git");
  if (targets.some((target) => isWithin(projectRoot, target) || isWithin(target, gitDir))) {
    return verdicts.deletesProject;
  }
  if (words.some((word) => word.runtime)) return verdicts.deletesRuntimeTargets;
  const inside = targets
    .filter((target) => isWithin(target, projectRoot))
    .map((target) => relative(projectRoot, target));
  return inside.length > 0 && hasUncommittedWork(inside, projectRoot) ? verdicts.deletesWork : null;
}

function rmVerdict(args, location) {
  const { flags, operands, afterDashes } = parseArgs(args);
  const recursive = flags.includes("--recursive") || hasShort(flags, "r") || hasShort(flags, "R");
  return recursive ? recursiveDeleteVerdict([...operands, ...(afterDashes ?? [])], location) : null;
}

function deletesWholeTree(expression) {
  let deletes = false;
  for (let index = 0; index < expression.length; index++) {
    const { text } = expression[index];
    if (FIND_DEPTH_LIMITS.has(text)) index++;
    else if (!FIND_WHOLE_TREE_PRIMARIES.has(text)) return false;
    deletes ||= text === "-delete";
  }
  return deletes;
}

function findVerdict(args, location) {
  const optionCount = args.findIndex(
    (word) => !isFlag(word) || !FIND_LEADING_OPTION.test(word.text),
  );
  const operands = optionCount === -1 ? [] : args.slice(optionCount);
  const rootCount = operands.findIndex((word) => isFlag(word) || FIND_OPERATORS.has(word.text));
  const roots = rootCount === -1 ? operands : operands.slice(0, rootCount);
  const expression = rootCount === -1 ? [] : operands.slice(rootCount);
  if (!deletesWholeTree(expression)) return null;
  return recursiveDeleteVerdict(roots.length > 0 ? roots : [CURRENT_DIRECTORY], location);
}

export const fileDeletePrograms = new Map([
  ["rm", rmVerdict],
  ["find", findVerdict],
]);
