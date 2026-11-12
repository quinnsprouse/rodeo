import { hasShort, parseArgs } from "./simple-command.mjs";

const hookBypass =
  "Fix the reported problems instead of skipping the Git hooks, or ask a human to bypass them.";

const verdicts = {
  commitBypass: {
    decision: "deny",
    reason: `Committing with --no-verify skips the pre-commit and commit-msg checks. ${hookBypass}`,
  },
  pushBypass: {
    decision: "deny",
    reason: `Pushing with --no-verify skips the pre-push gate (npm run check:push). ${hookBypass}`,
  },
  hooksDisabled: {
    decision: "deny",
    reason: `Overriding core.hooksPath or setting HUSKY=0 / VITE_GIT_HOOKS=0 disables the Git hooks. ${hookBypass}`,
  },
  forcePush: {
    decision: "ask",
    reason:
      "A force push can overwrite commits on the remote. Use --force-with-lease, and only when a human has asked for a history rewrite.",
  },
};

const CONFIG_VALUE_FLAGS = new Set([
  "-f",
  "--file",
  "--blob",
  "--type",
  "--default",
  "--comment",
  "--value",
]);
const CONFIG_WRITE_FLAGS = new Set(["--unset", "--unset-all", "--add", "--replace-all"]);
const CONFIG_READ_FLAGS = new Set([
  "--get",
  "--get-all",
  "--get-regexp",
  "--get-urlmatch",
  "--get-color",
  "--get-colorbool",
  "-l",
  "--list",
]);
const PUSH_VALUE_FLAGS = new Set(["-o", "--push-option", "--repo", "--receive-pack", "--exec"]);

function isHooksPathSetting(setting) {
  return setting?.split("=")[0].toLowerCase() === "core.hookspath";
}

function disablesHooks({ name, value }) {
  if (/^GIT_CONFIG_KEY_\d+$/i.test(name)) return isHooksPathSetting(value);
  return /^(?:HUSKY|VITE_GIT_HOOKS)$/i.test(name) && value === "0";
}

export function hooksDisabledBy(assignments) {
  return assignments.some(disablesHooks) ? verdicts.hooksDisabled : null;
}

function isNoVerify(flag) {
  return flag.length >= "--no-veri".length && "--no-verify".startsWith(flag);
}

function noVerifyVerdict(subcommand, args) {
  const { flags } = parseArgs(args);
  if (!flags.some(isNoVerify)) return null;
  return subcommand === "push" ? verdicts.pushBypass : verdicts.commitBypass;
}

export function gitHookVerdict({ settings, subcommand, rest }) {
  if (settings.some(isHooksPathSetting)) return verdicts.hooksDisabled;
  return noVerifyVerdict(subcommand, rest);
}

function commitVerdict(args) {
  const { flags } = parseArgs(args);
  return hasShort(flags, "n", "mFCctuS") ? verdicts.commitBypass : null;
}

function writesHooksPath(args) {
  const { flags, operands } = parseArgs(args, CONFIG_VALUE_FLAGS);
  const [first, second] = operands.map((word) => word.text);
  if (first === "set" || first === "unset") return isHooksPathSetting(second);
  if (!isHooksPathSetting(first)) return false;
  if (flags.some((flag) => CONFIG_WRITE_FLAGS.has(flag))) return true;
  return second !== undefined && !flags.some((flag) => CONFIG_READ_FLAGS.has(flag));
}

function configVerdict(args) {
  return writesHooksPath(args) ? verdicts.hooksDisabled : null;
}

function pushVerdict(args) {
  const { flags, operands, afterDashes } = parseArgs(args, PUSH_VALUE_FLAGS);
  const refspecs = [...operands, ...(afterDashes ?? [])];
  const forced =
    flags.includes("--force") ||
    hasShort(flags, "f", "o") ||
    refspecs.some((word) => word.text.startsWith("+"));
  return forced ? verdicts.forcePush : null;
}

export const hookRulesBySubcommand = new Map([
  ["commit", commitVerdict],
  ["config", configVerdict],
  ["push", pushVerdict],
]);
