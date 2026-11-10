import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { bashVerdict, editVerdict } from "./guard-rules.mjs";

const projectRoot = resolve(
  process.env.CLAUDE_PROJECT_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."),
);

function bashInputVerdict(input) {
  const command = input.tool_input?.command;
  if (input.tool_name !== "Bash" || typeof command !== "string") return null;
  const cwd = typeof input.cwd === "string" ? input.cwd : undefined;
  return bashVerdict(command, { projectRoot, cwd });
}

function toolVerdict(input) {
  if (input.hook_event_name !== "PreToolUse") return null;
  return editVerdict(input.tool_name, input.tool_input, { projectRoot }) ?? bashInputVerdict(input);
}

function printDecision({ decision, reason }) {
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    })}\n`,
  );
}

try {
  const verdict = toolVerdict(JSON.parse(readFileSync(0, "utf8")));
  if (verdict) printDecision(verdict);
} catch {
  // why: A guard that cannot parse its input must not block the agent.
}
process.exit(0);
