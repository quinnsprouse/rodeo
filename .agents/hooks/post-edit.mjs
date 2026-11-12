import { statSync } from "node:fs";
import { extname, isAbsolute, relative } from "node:path";

import { checkableExtensions, lintableExtensions, typedExtensions } from "#tooling/project";

import { editTargets } from "./edit-targets.mjs";
import { runHook, truncate } from "./hook-io.mjs";
import { physicalPath } from "./physical-path.mjs";
import {
  dependenciesInstalled,
  packageBinary,
  refreshRouteTree,
  runTool,
} from "./project-tools.mjs";

export const event = "PostToolUse";

const ignoredRoots = [
  ".git",
  ".output",
  ".tanstack",
  ".tanstack-start",
  "coverage",
  "node_modules",
];
const skipped = { ok: true, output: "" };

function feedback(message) {
  return {
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: truncate(message, { keep: "start" }),
    },
  };
}

function writtenPaths(toolName, toolInput) {
  return editTargets(toolName, toolInput)
    .filter((target) => !target.deleted)
    .map((target) => target.path);
}

function projectFile(filePath, root) {
  const target = physicalPath(root, filePath);
  if (!statSync(target, { throwIfNoEntry: false })?.isFile()) return null;

  const projectPath = relative(root, target);
  if (
    projectPath === "" ||
    projectPath.startsWith("..") ||
    isAbsolute(projectPath) ||
    ignoredRoots.some(
      (ignored) => projectPath === ignored || projectPath.startsWith(`${ignored}/`),
    ) ||
    !checkableExtensions.has(extname(target).toLowerCase())
  ) {
    return null;
  }
  return { target, projectPath };
}

function projectFiles(input, root) {
  const files = writtenPaths(input.tool_name, input.tool_input)
    .map((path) => projectFile(path, root))
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

async function problemsIn(files, root) {
  const lintable = withExtension(files, lintableExtensions);
  const typed = withExtension(files, typedExtensions);
  const vp = packageBinary(root, "vite-plus", "vp");
  const tsc = typed.length > 0 ? packageBinary(root, "typescript", "tsc") : null;

  const routeTree = await refreshRouteTree(
    root,
    files.map(({ projectPath }) => projectPath),
  );
  const format = await runTool(root, vp, [
    "fmt",
    "--no-error-on-unmatched-pattern",
    ...targetsOf(files),
  ]);
  const [lint, typecheck] = await Promise.all([
    lintable.length > 0
      ? runTool(root, vp, ["lint", "--no-error-on-unmatched-pattern", ...targetsOf(lintable)])
      : skipped,
    tsc ? runTool(root, tsc, ["-b", "--pretty", "false"]) : skipped,
  ]);

  return [
    ...problem(routeTree, `Route tree generation failed after editing ${pathList(files)}.`),
    ...problem(format, `Automatic formatting failed for ${pathList(files)}.`),
    ...problem(lint, `Lint found an issue in ${pathList(lintable)}.`),
    ...problem(typecheck, `Type checking found an issue after editing ${pathList(typed)}.`),
  ];
}

export async function postEditFeedback(input, { root }) {
  const files = projectFiles(input, root);
  if (files.length === 0) return null;
  if (!dependenciesInstalled(root)) {
    return feedback(
      "Post-edit feedback could not run: dependencies are not installed. Run `npm ci`.",
    );
  }
  const problems = await problemsIn(files, root);
  return problems.length > 0 ? feedback(problems.join("\n\n")) : null;
}

if (import.meta.main) await runHook(postEditFeedback, { event, name: "post-edit feedback" });
