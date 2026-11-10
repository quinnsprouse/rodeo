import { bashVerdict, editVerdict } from "./guard-rules.mjs";
import { runHook } from "./hook-io.mjs";

export const event = "PreToolUse";
export const shellTool = "Bash";

function toolVerdict(input, root) {
  const command = input.tool_input?.command;
  if (input.tool_name === shellTool && typeof command === "string") {
    const cwd = typeof input.cwd === "string" ? input.cwd : undefined;
    return bashVerdict(command, { projectRoot: root, cwd });
  }
  return editVerdict(input.tool_name, input.tool_input, { projectRoot: root });
}

export function preToolDecision(input, { root }) {
  const verdict = toolVerdict(input, root);
  if (!verdict) return null;
  return {
    hookSpecificOutput: {
      hookEventName: event,
      permissionDecision: verdict.decision,
      permissionDecisionReason: verdict.reason,
    },
  };
}

if (import.meta.main) await runHook(preToolDecision, { event, name: "pre-tool guard" });
