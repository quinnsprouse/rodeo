import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

import { checkableExtensions } from "#tooling/project";
import { run } from "#tooling/run";

import { outputLimit, runHook, truncate } from "./hook-io.mjs";
import {
  dependenciesInstalled,
  gitHooksInstalled,
  packageBinary,
  refreshRouteTree,
  runTool,
} from "./project-tools.mjs";

export const event = "Stop";

const gitEmptyTree = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
const setupSteps = {
  dependencies: {
    reason:
      "Dependencies are not installed in this checkout, so the stop check and the Git hooks cannot run. Run `npm ci`, then finish.",
    systemMessage:
      "The stop check did not run: dependencies are not installed in this checkout, so the checks and the Git hooks cannot run. Run `npm ci`.",
  },
  gitHooks: {
    reason:
      "The Git hooks are not installed in this checkout, so commits and pushes would skip their checks. Run `npm run setup`, then finish.",
    systemMessage:
      "The stop check did not run: the Git hooks are not installed in this checkout, so commits and pushes skip their checks. Run `npm run setup`.",
  },
};

async function git(root, args) {
  const result = await run("git", args, { cwd: root });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

function lines(output) {
  return output.split("\n").filter(Boolean);
}

async function baseRevision(root) {
  const head = await run("git", ["rev-parse", "--verify", "--quiet", "HEAD"], { cwd: root });
  return head.status === 0 ? "HEAD" : gitEmptyTree;
}

async function trackedChanges(root, base) {
  return lines(await git(root, ["diff", "--name-only", base]));
}

async function untrackedPaths(root) {
  return lines(await git(root, ["ls-files", "--others", "--exclude-standard"]));
}

function unique(paths) {
  return [...new Set(paths)];
}

async function fingerprint(root, base, files, untracked) {
  const hash = createHash("sha256");
  hash.update(await git(root, ["diff", base, "--binary"]));
  for (const path of untracked.toSorted()) {
    const stats = statSync(join(root, path), { throwIfNoEntry: false });
    hash.update(`${path}:${stats?.size ?? "deleted"}:${stats?.mtimeMs ?? 0}\n`);
  }
  hash.update(files.join("\n"));
  return hash.digest("hex");
}

function stateFile(root) {
  return join(root, "node_modules", ".cache", "rodeo", "stop-check.json");
}

function readState(root) {
  try {
    const value = JSON.parse(readFileSync(stateFile(root), "utf8"));
    return typeof value === "object" && value !== null ? value : {};
  } catch {
    return {};
  }
}

function writeState(root, state) {
  mkdirSync(dirname(stateFile(root)), { recursive: true });
  writeFileSync(stateFile(root), `${JSON.stringify(state)}\n`);
}

async function missingSetup(root) {
  if (!dependenciesInstalled(root)) return setupSteps.dependencies;
  if (!(await gitHooksInstalled(root))) return setupSteps.gitHooks;
  return null;
}

async function runCheck(root, label, binary, args) {
  return { label, ...(await runTool(root, binary, args, { CI: "1" })) };
}

function runChecks(root, base, files) {
  const vp = packageBinary(root, "vite-plus", "vp");
  const tsc = packageBinary(root, "typescript", "tsc");
  const checkable = files.filter((path) => checkableExtensions.has(extname(path).toLowerCase()));
  const testArgs = ["test", "run", ...(base === "HEAD" ? ["--changed"] : [])];
  return Promise.all([
    checkable.length > 0
      ? runCheck(root, "vp check (changed files)", vp, [
          "check",
          "--no-error-on-unmatched-pattern",
          ...checkable,
        ])
      : { label: "vp check", ok: true, output: "" },
    runCheck(root, "tsc -b", tsc, ["-b", "--pretty", "false"]),
    runCheck(root, `vp ${testArgs.join(" ")}`, vp, [...testArgs, "--passWithNoTests"]),
  ]);
}

function blockReason(failures) {
  const perFailure = Math.floor(outputLimit / failures.length);
  return [
    "The stop check found problems in the files you changed. Fix them before you finish.",
    ...failures.map(
      (failure) =>
        `${failure.label} failed:\n${truncate(failure.output.trim(), { keep: "end", limit: perFailure })}`,
    ),
  ].join("\n\n");
}

async function checkChanges(root, { base, changed, untracked, stopHookActive }) {
  const routeTree = { label: "Route tree generation", ...(await refreshRouteTree(root, changed)) };
  const paths = routeTree.ran
    ? unique([...(await trackedChanges(root, base)), ...untracked])
    : changed;
  const files = paths.filter((path) => existsSync(join(root, path)));
  if (files.length === 0 && routeTree.ok) return null;

  const state = readState(root);
  const current = await fingerprint(root, base, files, untracked);
  if (state.passed === current) return null;
  if (stopHookActive && state.failed === current) {
    return {
      systemMessage:
        "The stop check still fails on the current changes. Run `npm run check` to see the errors.",
    };
  }

  const failures = [routeTree, ...(await runChecks(root, base, files))].filter(
    (result) => !result.ok,
  );
  if (failures.length === 0) {
    writeState(root, { ...state, passed: current });
    return null;
  }
  writeState(root, { ...state, failed: current });
  return { decision: "block", reason: blockReason(failures) };
}

export async function stopCheck(input, { root }) {
  if (!existsSync(join(root, ".git"))) return null;

  const [base, untracked] = await Promise.all([baseRevision(root), untrackedPaths(root)]);
  const changed = unique([...(await trackedChanges(root, base)), ...untracked]);
  if (changed.length === 0) return null;

  const stopHookActive = input.stop_hook_active === true;
  const setup = await missingSetup(root);
  if (setup) {
    return stopHookActive
      ? { systemMessage: setup.systemMessage }
      : { decision: "block", reason: setup.reason };
  }
  return checkChanges(root, { base, changed, untracked, stopHookActive });
}

if (import.meta.main) await runHook(stopCheck, { event, name: "stop check" });
