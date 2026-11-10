import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

import {
  dependenciesInstalled,
  gitHooksInstalled,
  packageBinary,
  projectRoot,
  refreshRouteTree,
  runTool,
} from "./project-tools.mjs";

const stateFile = join(projectRoot, "node_modules", ".cache", "rodeo", "stop-check.json");
const checkableExtensions = new Set([
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
const outputLimit = 3_500;
const setupSteps = [
  {
    missing: () => !dependenciesInstalled(),
    reason:
      "Dependencies are not installed in this checkout, so the stop check and the Git hooks cannot run. Run `npm ci`, then finish.",
    systemMessage:
      "The stop check did not run: dependencies are not installed in this checkout, so the checks and the Git hooks cannot run. Run `npm ci`.",
  },
  {
    missing: () => !gitHooksInstalled(),
    reason:
      "The Git hooks are not installed in this checkout, so commits and pushes would skip their checks. Run `npm run setup`, then finish.",
    systemMessage:
      "The stop check did not run: the Git hooks are not installed in this checkout, so commits and pushes skip their checks. Run `npm run setup`.",
  },
];

function git(args) {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 64 << 20,
  });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

function lines(output) {
  return output.split("\n").filter(Boolean);
}

const gitEmptyTree = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

function baseRevision() {
  const head = spawnSync("git", ["rev-parse", "--verify", "--quiet", "HEAD"], { cwd: projectRoot });
  return head.status === 0 ? "HEAD" : gitEmptyTree;
}

function changedPaths(base, untracked) {
  return [...new Set([...lines(git(["diff", "--name-only", base])), ...untracked])];
}

function changedFiles(base, untracked) {
  return changedPaths(base, untracked).filter((path) => existsSync(join(projectRoot, path)));
}

function fingerprint(base, files, untracked) {
  const hash = createHash("sha256");
  hash.update(git(["diff", base, "--binary"]));
  for (const path of untracked.toSorted()) {
    const stats = statSync(join(projectRoot, path), { throwIfNoEntry: false });
    hash.update(`${path}:${stats?.size ?? "deleted"}:${stats?.mtimeMs ?? 0}\n`);
  }
  hash.update(files.join("\n"));
  return hash.digest("hex");
}

function readState() {
  try {
    const value = JSON.parse(readFileSync(stateFile, "utf8"));
    return typeof value === "object" && value !== null ? value : {};
  } catch {
    return {};
  }
}

function writeState(state) {
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, `${JSON.stringify(state)}\n`);
}

async function runCheck(label, binary, args) {
  return { label, ...(await runTool(binary, args, { CI: "1" })) };
}

function tail(text, limit) {
  const trimmed = text.trim();
  return trimmed.length > limit ? `...${trimmed.slice(-limit)}` : trimmed;
}

function respond(output) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exit(0);
}

function requireSetup(stopHookActive) {
  const step = setupSteps.find(({ missing }) => missing());
  if (!step) return;
  respond(
    stopHookActive
      ? { systemMessage: step.systemMessage }
      : { decision: "block", reason: step.reason },
  );
}

function runChecks(base, files) {
  const vp = packageBinary("vite-plus", "vp");
  const tsc = packageBinary("typescript", "tsc");
  const checkable = files.filter((path) => checkableExtensions.has(extname(path).toLowerCase()));
  return Promise.all([
    checkable.length > 0
      ? runCheck("vp check (changed files)", vp, [
          "check",
          "--no-error-on-unmatched-pattern",
          ...checkable,
        ])
      : { label: "vp check", ok: true, output: "" },
    runCheck("tsc -b", tsc, ["-b", "--pretty", "false"]),
    runCheck("vp test run --changed", vp, [
      "test",
      "run",
      ...(base === "HEAD" ? ["--changed"] : []),
      "--passWithNoTests",
    ]),
  ]);
}

try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (input.hook_event_name !== "Stop") process.exit(0);
  if (!existsSync(join(projectRoot, ".git"))) process.exit(0);

  const base = baseRevision();
  const untracked = lines(git(["ls-files", "--others", "--exclude-standard"]));
  const changed = changedPaths(base, untracked);
  if (changed.length === 0) process.exit(0);

  requireSetup(input.stop_hook_active === true);

  const routeTree = { label: "Route tree generation", ...(await refreshRouteTree(changed)) };
  const files = changedFiles(base, untracked);
  if (files.length === 0 && routeTree.ok) process.exit(0);

  const state = readState();
  const current = fingerprint(base, files, untracked);
  if (state.passed === current) process.exit(0);

  const retriedWithoutChanges = input.stop_hook_active === true && state.failed === current;
  if (retriedWithoutChanges) {
    respond({
      systemMessage:
        "The stop check still fails on the current changes. Run `npm run check` to see the errors.",
    });
  }

  const failures = [routeTree, ...(await runChecks(base, files))].filter((result) => !result.ok);
  if (failures.length === 0) {
    writeState({ ...state, passed: current });
    process.exit(0);
  }

  writeState({ ...state, failed: current });
  const perFailure = Math.floor(outputLimit / failures.length);
  respond({
    decision: "block",
    reason: [
      "The stop check found problems in the files you changed. Fix them before you finish.",
      ...failures.map((failure) => `${failure.label} failed:\n${tail(failure.output, perFailure)}`),
    ].join("\n\n"),
  });
} catch (error) {
  respond({
    systemMessage: `The stop check could not run: ${error instanceof Error ? error.message : String(error)}`,
  });
}
