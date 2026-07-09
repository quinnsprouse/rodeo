import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const appRoot = mkdtempSync(join(tmpdir(), "rodeo-template-"));
const keepTemplate = process.env.KEEP_TEMPLATE_TEST === "1";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? appRoot,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });

  if (result.error) throw result.error;

  const output = [result.stdout, result.stderr].filter(Boolean).join("");
  const failure = `${command} ${args.join(" ")} exited ${result.status}${output ? `\n${output}` : ""}`;

  if (options.expectStatus !== undefined) {
    assert.equal(result.status, options.expectStatus, failure);
  } else if (result.status !== 0) {
    throw new Error(failure);
  }

  return result;
}

try {
  // checkout-index is the degit-shaped artifact: tracked content and symlinks, no .git directory.
  run("git", ["checkout-index", "--all", "--force", `--prefix=${appRoot}/`], {
    cwd: repoRoot,
  });
  assert.equal(existsSync(join(appRoot, ".git")), false);

  const skippedSetup = run(process.execPath, ["scripts/setup.mjs"], { capture: true });
  assert.match(skippedSetup.stdout, /Git hooks skipped/);

  run("git", ["init", "--initial-branch=main", "--quiet"]);
  run("npm", ["install", "--no-audit", "--no-fund"]);

  const hooksPath = run("git", ["config", "--get", "core.hooksPath"], {
    capture: true,
  }).stdout.trim();
  assert.equal(hooksPath, ".vite-hooks/_");
  assert.equal(existsSync(join(appRoot, ".vite-hooks", "_", "h")), true);
  assert.equal(existsSync(join(appRoot, ".husky")), false);

  // Setup is a public recovery command and must remain idempotent.
  run("npm", ["run", "setup"]);
  run("git", ["add", "--all"]);
  run("git", ["hook", "run", "pre-commit"]);

  const commitMessagePath = join(appRoot, ".git", "COMMIT_EDITMSG");
  writeFileSync(commitMessagePath, "chore: verify template journey\n");
  run("git", ["hook", "run", "commit-msg", "--", commitMessagePath]);

  writeFileSync(commitMessagePath, "invalid message\n");
  run("git", ["hook", "run", "commit-msg", "--", commitMessagePath], {
    capture: true,
    expectStatus: 1,
  });

  for (const ignoredPath of [
    ".scratch/probe.txt",
    "tmp/probe.txt",
    "src/example/__pycache__/probe.pyc",
  ]) {
    run("git", ["check-ignore", "--no-index", "--quiet", "--", ignoredPath]);
  }

  // This exercises the real hook and therefore the same cached verification profile developers use.
  run("git", ["hook", "run", "pre-push"]);
  assert.equal(existsSync(join(appRoot, ".output", "server", "index.mjs")), true);

  console.log(`Template journey passed in ${appRoot}`);
} finally {
  if (keepTemplate) {
    console.log(`KEEP_TEMPLATE_TEST=1; preserved ${appRoot}`);
  } else {
    rmSync(appRoot, { force: true, recursive: true });
  }
}
