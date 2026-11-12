export const editTools = {
  claude: ["Edit", "Write", "MultiEdit", "NotebookEdit"],
  codex: ["apply_patch", "Edit", "Write"],
};

const patchTool = "apply_patch";
const fileTools = new Set(Object.values(editTools).flat()).difference(new Set([patchTool]));
const patchHeader = /^\*\*\* (?:(?<action>Add|Update|Delete) File|Move to): (?<path>.+)$/gm;

function patchTargets(patch) {
  return [...patch.matchAll(patchHeader)].map(({ groups }) => ({
    path: groups.path.trim(),
    deleted: groups.action === "Delete",
  }));
}

export function editTargets(toolName, toolInput) {
  if (toolName === patchTool) {
    return typeof toolInput?.command === "string" ? patchTargets(toolInput.command) : [];
  }
  if (!fileTools.has(toolName)) return [];
  const path = toolInput?.file_path ?? toolInput?.notebook_path;
  return typeof path === "string" ? [{ path, deleted: false }] : [];
}
