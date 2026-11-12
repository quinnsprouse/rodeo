import { isAbsolute, sep } from "node:path";

import { gitHookVerdict, hookRulesBySubcommand } from "./git-hook-rules.mjs";
import { physicalPath } from "./physical-path.mjs";
import { isFlag } from "./simple-command.mjs";
import { workRulesBySubcommand } from "./uncommitted-work-rules.mjs";

const GIT_VALUE_OPTIONS = new Set([
  "-c",
  "-C",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--config-env",
]);

const rulesBySubcommand = new Map([...hookRulesBySubcommand, ...workRulesBySubcommand]);

function gitInvocation(args) {
  const settings = [];
  const directories = [];
  let index = 0;
  while (index < args.length && isFlag(args[index])) {
    const option = args[index].text;
    const value = args[index + 1]?.text ?? "";
    if (option === "-c" || option === "--config-env") settings.push(value);
    if (option.startsWith("--config-env=")) settings.push(option.slice("--config-env=".length));
    if (option === "-C") directories.push(value);
    index += GIT_VALUE_OPTIONS.has(option) ? 2 : 1;
  }
  return { settings, directories, subcommand: args[index]?.text, rest: args.slice(index + 1) };
}

function gitDirectory(cwd, directories) {
  const path = directories.reduce(
    (current, directory) => (isAbsolute(directory) ? directory : `${current}${sep}${directory}`),
    cwd,
  );
  return physicalPath(cwd, path);
}

function gitVerdict(args, { cwd }) {
  const git = gitInvocation(args);
  const hookVerdict = gitHookVerdict(git);
  if (hookVerdict) return hookVerdict;
  let directory;
  const workingDirectory = () => (directory ??= gitDirectory(cwd, git.directories));
  return rulesBySubcommand.get(git.subcommand)?.(git.rest, workingDirectory) ?? null;
}

export const gitPrograms = new Map([["git", gitVerdict]]);
