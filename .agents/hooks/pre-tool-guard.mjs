import { runHook } from "./hook-io.mjs";

export const event = "PreToolUse";
export const shellTool = "Bash";

// why: Node loads every imported module before the hook can answer, and the guard runs before
// every tool call, so each event loads only the rules for its own tool.
async function toolVerdict(input, root) {
  const command = input.tool_input?.command;
  if (input.tool_name === shellTool && typeof command === "string") {
    const { bashVerdict } = await import("./bash-rules.mjs");
    const cwd = typeof input.cwd === "string" ? input.cwd : undefined;
    return bashVerdict(command, { projectRoot: root, cwd });
  }
  const { editVerdict } = await import("./edit-rules.mjs");
  return editVerdict(input.tool_name, input.tool_input, { projectRoot: root });
}

export async function preToolDecision(input, { root }) {
  const verdict = await toolVerdict(input, root);
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
