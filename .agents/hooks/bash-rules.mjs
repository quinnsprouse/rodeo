import { resolve } from "node:path";

import { fileDeletePrograms } from "./file-delete-rules.mjs";
import { gitPrograms } from "./git-command.mjs";
import { hooksDisabledBy } from "./git-hook-rules.mjs";
import { scriptReader, simpleCommands } from "./nested-scripts.mjs";
import { packageManagerPrograms } from "./package-manager-rules.mjs";

const unreadableScript = {
  decision: "ask",
  reason:
    "The guard cannot read a script piped into a shell, so it cannot check the commands in it. A human should confirm the script.",
};

const programs = new Map([...gitPrograms, ...fileDeletePrograms, ...packageManagerPrograms]);

function commandVerdict({ assignments, program, args, runsUnreadableScript }, location) {
  const hooksDisabled = hooksDisabledBy(assignments);
  if (hooksDisabled) return hooksDisabled;
  if (runsUnreadableScript) return unreadableScript;
  return programs.get(program)?.(args, location) ?? null;
}

export function bashVerdict(command, { projectRoot, cwd }) {
  const location = {
    projectRoot,
    cwd: cwd === undefined ? projectRoot : resolve(projectRoot, cwd),
  };
  let asked = null;
  for (const simpleCommand of simpleCommands(command, scriptReader(location.cwd))) {
    const verdict = commandVerdict(simpleCommand, location);
    if (verdict?.decision === "deny") return verdict;
    asked ??= verdict;
  }
  return asked;
}
