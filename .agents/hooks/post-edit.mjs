import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { extname, isAbsolute, relative, resolve } from "node:path";

import { dependenciesInstalled, packageBinary, projectRoot, runTool } from "./project-tools.mjs";

const formatExtensions = new Set([
  ".cjs",
  ".css",
  ".cts",
  ".html",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const typeScriptExtensions = new Set([".cts", ".mts", ".ts", ".tsx"]);
const lintExtensions = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const ignoredRoots = [
  ".git",
  ".output",
  ".tanstack",
  ".tanstack-start",
  "coverage",
  "node_modules",
];
const skipped = { ok: true, output: "" };

function report(message) {
  const additionalContext = message.length > 4_000 ? `${message.slice(0, 3_997)}...` : message;
  process.stdout.write(
    `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext } })}\n`,
  );
}

function editedFiles(toolName, toolInput) {
  if (toolName === "apply_patch" && typeof toolInput?.command === "string") {
    return [
      ...toolInput.command.matchAll(/^\*\*\* (?:Add|Update) File: (.+)$|^\*\*\* Move to: (.+)$/gm),
    ].map((match) => (match[1] ?? match[2]).trim());
  }
  if (
    ["Edit", "Write", "MultiEdit"].includes(toolName) &&
    typeof toolInput?.file_path === "string"
  ) {
    return [toolInput.file_path];
  }
  return [];
}

function projectFile(filePath) {
  const candidate = isAbsolute(filePath) ? filePath : resolve(projectRoot, filePath);
  if (!existsSync(candidate) || !lstatSync(candidate).isFile()) return null;

  const target = realpathSync(candidate);
  const projectPath = relative(projectRoot, target);
  if (
    projectPath === "" ||
    projectPath.startsWith("..") ||
    isAbsolute(projectPath) ||
    ignoredRoots.some((root) => projectPath === root || projectPath.startsWith(`${root}/`)) ||
    !formatExtensions.has(extname(target).toLowerCase())
  ) {
    return null;
  }
  return { target, projectPath };
}

function projectFiles(input) {
  if (input.hook_event_name !== "PostToolUse") return [];
  const files = editedFiles(input.tool_name, input.tool_input)
    .map(projectFile)
    .filter((file) => file !== null);
  return [...new Map(files.map((file) => [file.target, file])).values()];
}

function withExtension(files, extensions) {
  return files.filter(({ target }) => extensions.has(extname(target).toLowerCase()));
}

function pathList(files) {
  return files.map(({ projectPath }) => projectPath).join(", ");
}

function targetsOf(files) {
  return files.map(({ target }) => target);
}

function problem(result, heading) {
  return result.ok ? [] : [`${heading}\n${result.output}`];
}

async function feedbackFor(files) {
  const lintable = withExtension(files, lintExtensions);
  const typed = withExtension(files, typeScriptExtensions);
  const vp = packageBinary("vite-plus", "vp");
  const tsc = typed.length > 0 ? packageBinary("typescript", "tsc") : null;

  const format = await runTool(vp, ["fmt", "--no-error-on-unmatched-pattern", ...targetsOf(files)]);
  const [lint, typecheck] = await Promise.all([
    lintable.length > 0
      ? runTool(vp, ["lint", "--no-error-on-unmatched-pattern", ...targetsOf(lintable)])
      : skipped,
    tsc ? runTool(tsc, ["-b", "--pretty", "false"]) : skipped,
  ]);

  return [
    ...problem(format, `Automatic formatting failed for ${pathList(files)}.`),
    ...problem(lint, `Lint found an issue in ${pathList(lintable)}.`),
    ...problem(typecheck, `Type checking found an issue after editing ${pathList(typed)}.`),
  ];
}

try {
  const files = projectFiles(JSON.parse(readFileSync(0, "utf8")));
  if (files.length > 0 && !dependenciesInstalled()) {
    report("Post-edit feedback could not run: dependencies are not installed. Run `npm ci`.");
  } else if (files.length > 0) {
    const feedback = await feedbackFor(files);
    if (feedback.length > 0) report(feedback.join("\n\n"));
  }
} catch (error) {
  report(
    `Post-edit feedback could not run.\n${error instanceof Error ? error.message : String(error)}`,
  );
}
