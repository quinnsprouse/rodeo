import { join, relative } from "node:path";

import { isWithin, physicalPath } from "./physical-path.mjs";
import { expandHome, hasShort, isFlag, parseArgs } from "./simple-command.mjs";
import { needsDirectory, unknownDirectory } from "./working-directory.mjs";

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
const FIND_NEGATIONS = new Set(["!", "-not"]);
const FIND_ALTERNATIVES = new Set(["-o", "-or", ","]);
const FIND_NAME_FILTERS = new Set([
  "-name",
  "-iname",
  "-path",
  "-ipath",
  "-wholename",
  "-iwholename",
  "-regex",
  "-iregex",
  "-lname",
  "-ilname",
  "-samefile",
  "-inum",
]);
const FIND_VALUE_PRIMARIES = new Set([
  ...FIND_NAME_FILTERS,
  "-type",
  "-xtype",
  "-mindepth",
  "-maxdepth",
  "-newer",
  "-anewer",
  "-cnewer",
  "-mtime",
  "-mmin",
  "-atime",
  "-amin",
  "-ctime",
  "-cmin",
  "-used",
  "-size",
  "-user",
  "-group",
  "-uid",
  "-gid",
  "-perm",
  "-links",
  "-fstype",
  "-regextype",
]);
const FIND_NEWER_THAN = /^-newer[aBcmt]{2}$/;
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
  const literal = words.filter((word) => !word.runtime && !word.text.includes("$"));
  if (cwd === null && literal.some(needsDirectory)) return unknownDirectory;
  const targets = literal.map((word) => physicalPath(cwd ?? "/", expandHome(word)));
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

function keepsFilesWithContent(primary, value) {
  if (FIND_NAME_FILTERS.has(primary)) return true;
  if (primary === "-type" || primary === "-xtype") return value === "d";
  return primary === "-empty";
}

function narrowsBeforeDelete(texts) {
  let negated = false;
  for (let index = 0; index < texts.length && texts[index] !== "-delete"; index++) {
    const primary = texts[index];
    const takesValue = FIND_VALUE_PRIMARIES.has(primary) || FIND_NEWER_THAN.test(primary);
    const value = takesValue ? texts[++index] : undefined;
    if (!negated && keepsFilesWithContent(primary, value)) return true;
    negated = FIND_NEGATIONS.has(primary) || (negated && primary === "(");
  }
  return false;
}

function deletesWholeTree(expression) {
  const texts = expression.map((word) => word.text);
  if (!texts.includes("-delete")) return false;
  return texts.some((text) => FIND_ALTERNATIVES.has(text)) || !narrowsBeforeDelete(texts);
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
