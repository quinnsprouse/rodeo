import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { hasShort, parseArgs } from "./simple-command.mjs";

const discardsWork = {
  decision: "ask",
  reason: "This discards uncommitted work. A human should confirm destructive git commands.",
};

const CHECKOUT_VALUE_FLAGS = new Set(["-b", "-B", "--orphan"]);
const SWITCH_VALUE_FLAGS = new Set(["-c", "-C", "--create", "--force-create", "--orphan"]);
const RESTORE_VALUE_FLAGS = new Set(["-s", "--source"]);
const CLEAN_VALUE_FLAGS = new Set(["-e", "--exclude"]);
const STASH_VALUE_FLAGS = new Set(["-m", "--message"]);
const PATHSPEC_GLOB = /[*?[]/;

function resetVerdict(args) {
  return parseArgs(args).flags.includes("--hard") ? discardsWork : null;
}

function cleanVerdict(args) {
  const { flags } = parseArgs(args, CLEAN_VALUE_FLAGS);
  const forced = flags.includes("--force") || hasShort(flags, "f", "e");
  const dryRun = flags.includes("--dry-run") || hasShort(flags, "n", "e");
  return forced && !dryRun ? discardsWork : null;
}

function namesPath(word, workingDirectory) {
  return (
    word.runtime ||
    word.text === "." ||
    PATHSPEC_GLOB.test(word.text) ||
    existsSync(resolve(workingDirectory(), word.text))
  );
}

function checkoutVerdict(args, workingDirectory) {
  const { flags, operands, afterDashes } = parseArgs(args, CHECKOUT_VALUE_FLAGS);
  const forced = flags.includes("--force") || hasShort(flags, "f", "bB");
  const touchesPaths =
    afterDashes === null
      ? operands.some((word) => namesPath(word, workingDirectory))
      : afterDashes.length > 0;
  return forced || touchesPaths ? discardsWork : null;
}

function switchVerdict(args) {
  const { flags } = parseArgs(args, SWITCH_VALUE_FLAGS);
  const discards =
    flags.includes("--force") || flags.includes("--discard-changes") || hasShort(flags, "f", "cC");
  return discards ? discardsWork : null;
}

function restoreVerdict(args) {
  const { flags } = parseArgs(args, RESTORE_VALUE_FLAGS);
  const staged = flags.includes("--staged") || hasShort(flags, "S", "s");
  const worktree = flags.includes("--worktree") || hasShort(flags, "W", "s");
  return staged && !worktree ? null : discardsWork;
}

function stashVerdict(args) {
  const action = parseArgs(args, STASH_VALUE_FLAGS).operands[0]?.text;
  return action === "drop" || action === "clear" ? discardsWork : null;
}

export const workRulesBySubcommand = new Map([
  ["reset", resetVerdict],
  ["clean", cleanVerdict],
  ["checkout", checkoutVerdict],
  ["switch", switchVerdict],
  ["restore", restoreVerdict],
  ["stash", stashVerdict],
]);
