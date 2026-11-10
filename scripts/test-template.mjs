import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parse } from "node-html-parser";

import { hermeticGitEnv } from "#tooling/git-env";
import { startBuiltServer } from "#tooling/server";

const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const appRoot = mkdtempSync(join(tmpdir(), "rodeo-template-"));
const artifactRoot = join(repoRoot, "test-results", "starter-journey");
const journeyLog = join(artifactRoot, "journey.log");
const keepTemplate = process.env.KEEP_TEMPLATE_TEST === "1";
const npmExecPath = process.env.npm_execpath;
const appEnv = { ...hermeticGitEnv(), CI: "1" };
let phase = "with the demo";
let currentCommand = "initialization";
let succeeded = false;

rmSync(artifactRoot, { force: true, recursive: true });
mkdirSync(artifactRoot, { recursive: true });

function log(message) {
  appendFileSync(journeyLog, `${message}\n`);
}

function startPhase(name) {
  phase = name;
  log(`\n## Template journey ${name}`);
  console.log(`\nTemplate journey ${name}`);
}

function startStep(description) {
  currentCommand = description;
  log(`\n$ ${description}`);
}

function run(command, args, { cwd = appRoot, env = appEnv, input, capture, expectStatus } = {}) {
  startStep(`${command === process.execPath ? "node" : command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env,
    input,
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error) throw result.error;

  const output = [result.stdout, result.stderr].filter(Boolean).join("");
  if (output) {
    log(output.trimEnd());
    if (!capture) process.stdout.write(output);
  }
  const failure = `${currentCommand} exited ${result.status}${output ? `\n${output}` : ""}`;

  if (expectStatus !== undefined) {
    assert.equal(result.status, expectStatus, failure);
  } else if (result.status !== 0) {
    throw new Error(failure);
  }

  return result;
}

function writeTree() {
  return run("git", ["write-tree"], { capture: true }).stdout.trim();
}

function runNpm(args, options) {
  return npmExecPath
    ? run(process.execPath, [npmExecPath, ...args], options)
    : run("npm", args, options);
}

function hookOutput(hook, input) {
  return run(process.execPath, [`.agents/hooks/${hook}.mjs`], {
    capture: true,
    input: JSON.stringify(input),
  }).stdout;
}

function assertTree(expected, label) {
  run("git", ["add", "--all"]);
  assert.equal(writeTree(), expected, `${label} changed the distributed template tree`);
}

function assertCleanTree() {
  assert.equal(run("git", ["status", "--porcelain=v1"], { capture: true }).stdout, "");
}

async function servedHome(logName) {
  startStep(`start the built server and request / (log: ${logName})`);
  const server = await startBuiltServer({ root: appRoot, logFile: join(artifactRoot, logName) });
  try {
    const response = await fetch(server.origin);
    const html = await response.text();
    return { status: response.status, main: parse(html).querySelector("main#main") };
  } finally {
    await server.stop();
  }
}

function copyTheTemplate() {
  // why: Users install with degit, which copies tracked files and symlinks without .git.
  run("git", ["checkout-index", "--all", "--force", `--prefix=${appRoot}/`], {
    cwd: repoRoot,
    env: process.env,
  });
}

function installTheTemplate() {
  const skippedSetup = run(process.execPath, ["scripts/setup.mjs"], { capture: true });
  assert.match(skippedSetup.stdout, /Git hooks skipped/);

  run("git", ["init", "--initial-branch=main", "--quiet"]);
  run("git", ["add", "--all"]);
  const distributedTree = writeTree();

  runNpm(["ci", "--no-audit", "--no-fund"]);
  assertTree(distributedTree, "npm ci");

  const hooksPath = run("git", ["config", "--get", "core.hooksPath"], {
    capture: true,
  }).stdout.trim();
  assert.equal(hooksPath, ".vite-hooks/_");
  assert.equal(existsSync(join(appRoot, ".vite-hooks", "_", "h")), true);
  assert.equal(existsSync(join(appRoot, ".husky")), false);

  runNpm(["run", "setup"]);
  run("git", ["hook", "run", "pre-commit"]);
  assertTree(distributedTree, "pre-commit feedback");
}

function proveTheToolHooks() {
  const codexHooks = JSON.parse(readFileSync(join(appRoot, ".codex/hooks.json"), "utf8"));
  const codexGuard = run("sh", ["-c", codexHooks.hooks.PreToolUse[0].hooks[0].command], {
    capture: true,
    input: JSON.stringify({
      hook_event_name: "PreToolUse",
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Update File: package-lock.json\n*** End Patch" },
    }),
  });
  assert.match(codexGuard.stdout, /"permissionDecision":"deny"/);

  const postEdit = (filePath) =>
    hookOutput("post-edit", {
      hook_event_name: "PostToolUse",
      tool_name: "Write",
      tool_input: { file_path: filePath },
    });

  const hookProbe = join(appRoot, ".scratch", "hook-probe.ts");
  mkdirSync(dirname(hookProbe), { recursive: true });
  writeFileSync(hookProbe, "export  const hookProbe={value:'ok'}\n");
  postEdit(hookProbe);
  assert.equal(readFileSync(hookProbe, "utf8"), 'export const hookProbe = { value: "ok" };\n');
  rmSync(hookProbe);

  const lintProbe = join(appRoot, "src", "lint-probe.tsx");
  writeFileSync(
    lintProbe,
    'import { useEffect } from "react";\nexport function Probe({ title }: { title: string }) {\n  useEffect(() => { document.title = title; }, []);\n  return null;\n}\n',
  );
  assert.match(postEdit(lintProbe), /react-hooks-js\(exhaustive-deps\)/);
  rmSync(lintProbe);

  const guardDecision = (command) =>
    hookOutput("pre-tool-guard", {
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command },
    });
  assert.match(guardDecision('git commit -m "feat: x" --no-verify'), /"permissionDecision":"deny"/);
  assert.equal(guardDecision("npm run check"), "");
}

function commitTheBaseline() {
  run("git", [
    "-c",
    "user.name=Rodeo CI",
    "-c",
    "user.email=ci@localhost",
    "commit",
    "--no-verify",
    "--quiet",
    "-m",
    "chore: establish template baseline",
  ]);
  assertCleanTree();
}

function proveTheStopCheck() {
  const stopCheck = (stopHookActive) =>
    hookOutput("stop-check", { hook_event_name: "Stop", stop_hook_active: stopHookActive });
  assert.equal(stopCheck(false), "");
  const stopProbe = join(appRoot, "src", "stop-probe.ts");
  writeFileSync(stopProbe, "export function probe(value: any) {\n  return value;\n}\n");
  assert.match(stopCheck(false), /"decision":"block".*no-explicit-any/s);
  assert.match(stopCheck(true), /"systemMessage"/);
  rmSync(stopProbe);
  assert.equal(stopCheck(false), "");
}

function proveTheCommitMessageHook() {
  const commitMessagePath = join(appRoot, ".git", "COMMIT_EDITMSG");
  writeFileSync(commitMessagePath, "chore: verify template journey\n");
  run("git", ["hook", "run", "commit-msg", "--", commitMessagePath]);

  writeFileSync(commitMessagePath, "invalid message\n");
  run("git", ["hook", "run", "commit-msg", "--", commitMessagePath], {
    capture: true,
    expectStatus: 1,
  });
}

function proveTheIgnoredPaths() {
  for (const ignoredPath of [
    ".claude/settings.local.json",
    ".scratch/probe.txt",
    "tmp/probe.txt",
    "src/example/__pycache__/probe.pyc",
  ]) {
    run("git", ["check-ignore", "--no-index", "--quiet", "--", ignoredPath]);
  }
}

async function proveThePushGate() {
  runNpm(["run", "test:e2e:install"]);
  run("git", ["hook", "run", "pre-push"]);
  assert.equal(existsSync(join(appRoot, ".output", "server", "index.mjs")), true);
  const home = await servedHome("production-server.log");
  assert.equal(home.status, 200);
  assert.ok(home.main, "The home page renders no main#main.");
  assertCleanTree();
}

async function proveTheStarterWithoutTheDemo() {
  run(process.execPath, ["scripts/remove-demo.mjs"]);
  runNpm(["run", "check:push"]);

  startStep("read the site name from src/config/site.ts");
  const { site } = await import(pathToFileURL(join(appRoot, "src", "config", "site.ts")).href);
  const home = await servedHome("starter-server.log");
  assert.equal(home.status, 200);
  assert.ok(
    home.main?.text.includes(site.name),
    `The starter home's main#main does not show the site name "${site.name}".`,
  );
}

function collectFailureEvidence(error) {
  const status = spawnSync("git", ["status", "--porcelain=v1"], {
    cwd: appRoot,
    encoding: "utf8",
    env: appEnv,
  });
  writeFileSync(
    join(artifactRoot, "failure.txt"),
    [
      `Failed phase: ${phase}`,
      `Failed command: ${currentCommand}`,
      `Temporary app: ${appRoot}`,
      `Node: ${process.version}`,
      `Platform: ${process.platform} ${process.arch}`,
      "",
      error instanceof Error ? error.stack : String(error),
      "",
      "git status --porcelain=v1",
      status.stdout || status.stderr || "(no output)",
    ].join("\n"),
  );

  for (const directory of ["test-results", "playwright-report"]) {
    const source = join(appRoot, directory);
    if (existsSync(source)) {
      cpSync(source, join(artifactRoot, directory), { recursive: true });
    }
  }
}

try {
  copyTheTemplate();
  const hasDemo = existsSync(join(appRoot, "src", "demo"));
  startPhase(hasDemo ? "with the demo" : "without the demo");
  installTheTemplate();
  proveTheToolHooks();
  commitTheBaseline();
  proveTheStopCheck();
  proveTheCommitMessageHook();
  proveTheIgnoredPaths();
  await proveThePushGate();

  if (hasDemo) {
    startPhase("after demo removal");
    await proveTheStarterWithoutTheDemo();
  }

  succeeded = true;
  console.log(`Template journey passed in ${appRoot}`);
} catch (error) {
  collectFailureEvidence(error);
  throw new Error(`The template journey failed ${phase}: ${currentCommand}`, { cause: error });
} finally {
  if (keepTemplate || !succeeded) {
    console.log(`Preserved template at ${appRoot}`);
    if (!succeeded) console.log(`Failure evidence: ${artifactRoot}`);
  } else {
    rmSync(appRoot, { force: true, recursive: true });
    rmSync(artifactRoot, { force: true, recursive: true });
  }
}
