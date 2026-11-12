import { statSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";

import { physicalPath } from "./physical-path.mjs";
import { expandHome, parseArgs } from "./simple-command.mjs";

export const unknownDirectory = {
  decision: "ask",
  reason:
    "An earlier cd, pushd, or popd in this command moves to a directory the guard cannot work out, such as a variable, a command substitution, `cd -`, or a directory that does not exist yet, so it cannot check this relative path. A human should confirm the command.",
};

const DIRECTORY_CHANGES = new Set(["cd", "pushd", "popd"]);

function isLiteral(word) {
  return !word.runtime && !/[$`]/.test(word.text);
}

export function needsDirectory(word) {
  return !isAbsolute(expandHome(word));
}

function isDirectory(path) {
  return statSync(path, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

function destination({ program, args }, from) {
  const { flags, operands: beforeDashes, afterDashes } = parseArgs(args);
  const operands = [...beforeDashes, ...(afterDashes ?? [])];
  const physical = flags.some((flag) => flag.includes("P"));
  if (operands.length === 0) return program === "cd" ? homedir() : null;
  const [operand] = operands;
  if (operands.length > 1 || !isLiteral(operand) || operand.text === "-") return null;
  if (from === null && needsDirectory(operand)) return null;
  const path = expandHome(operand);
  const target = physical ? physicalPath(from ?? "/", path) : resolve(from ?? "/", path);
  return isDirectory(target) ? target : null;
}

function moved(level, command) {
  if (command.program === "popd") {
    const known = command.args.length === 0 && level.pushed.length > 0;
    return known
      ? { directory: level.pushed.at(-1), pushed: level.pushed.slice(0, -1) }
      : { directory: null, pushed: [] };
  }
  const directory = destination(command, level.directory);
  const pushed = command.program === "pushd" ? [...level.pushed, level.directory] : level.pushed;
  return { directory, pushed };
}

export function directoryWalk(start, rawCommands) {
  const producers = new Set(rawCommands.map((raw) => raw.pipedFrom));
  const levels = [{ directory: start, pushed: [] }];
  return {
    step(raw, command) {
      levels.length = Math.min(levels.length, raw.subshell + 1);
      while (levels.length <= raw.subshell) levels.push({ ...levels.at(-1) });
      const here = levels.at(-1).directory;
      const forked = raw.background || raw.pipedFrom !== null || producers.has(raw);
      if (!forked && DIRECTORY_CHANGES.has(command.program)) {
        levels[levels.length - 1] = moved(levels.at(-1), command);
      }
      return here;
    },
    adopt(directory) {
      levels.at(-1).directory = directory;
    },
    get directory() {
      return levels[0].directory;
    },
  };
}
