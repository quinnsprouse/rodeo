import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it, vi } from "vite-plus/test";

import { hermeticGitEnv, hermeticGitSettings } from "#tooling/git-env";
import { run } from "#tooling/run";

import { stopCheck } from "./stop-check.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const gitEnv = hermeticGitEnv();

let fixtures = "";
const fixture = (name: string) => join(fixtures, name);

function git(cwd: string, ...args: string[]) {
  execFileSync("git", ["-c", "user.name=Rodeo Test", "-c", "user.email=test@localhost", ...args], {
    cwd,
    env: gitEnv,
    stdio: "ignore",
  });
}

function createRepo(name: string, { changed }: { changed: boolean }) {
  const root = fixture(name);
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "README.md"), "# Fixture\n");
  git(root, "init", "--quiet", "--initial-branch=main");
  git(root, "add", "--all");
  git(root, "commit", "--quiet", "-m", "chore: fixture baseline");
  if (changed) {
    writeFileSync(
      join(root, "src", "probe.ts"),
      "export function probe(value: any) {\n  return value;\n}\n",
    );
  }
  return root;
}

function copyHooks(root: string) {
  for (const path of [join(".agents", "hooks"), "scripts", "package.json"]) {
    cpSync(join(repoRoot, path), join(root, path), {
      recursive: true,
      filter: (source) => !source.endsWith(".test.ts"),
    });
  }
}

function stopEvent(stopHookActive: boolean) {
  return { hook_event_name: "Stop", stop_hook_active: stopHookActive };
}

function stop(name: string, stopHookActive: boolean) {
  return stopCheck(stopEvent(stopHookActive), { root: fixture(name) });
}

beforeAll(() => {
  for (const name of Object.keys(process.env).filter((key) => key.startsWith("GIT_"))) {
    vi.stubEnv(name, undefined);
  }
  for (const [name, value] of Object.entries(hermeticGitSettings)) vi.stubEnv(name, value);
  fixtures = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-stop-check-")));
  createRepo("unchanged", { changed: false });
  createRepo("no-dependencies", { changed: true });
  copyHooks(createRepo("hook-copy", { changed: true }));
  mkdirSync(join(createRepo("no-git-hooks", { changed: true }), "node_modules", "vite-plus"), {
    recursive: true,
  });
});

afterAll(() => {
  vi.unstubAllEnvs();
  rmSync(fixtures, { recursive: true, force: true });
});

describe.concurrent("stop check in a checkout that is not set up", { timeout: 30_000 }, () => {
  it("passes when nothing changed", async ({ expect }) => {
    expect(await stop("unchanged", false)).toBeNull();
  });

  it("sends the agent back to install dependencies", async ({ expect }) => {
    const output = await stop("no-dependencies", false);
    expect(output).toHaveProperty("decision", "block");
    expect(output).toHaveProperty("reason", expect.stringContaining("`npm ci`"));
    expect(existsSync(join(fixture("no-dependencies"), "node_modules"))).toBe(false);
  });

  it("tells the human on the retry so the turn can end", async ({ expect }) => {
    const output = await stop("no-dependencies", true);
    expect(output).not.toHaveProperty("decision");
    expect(output).toHaveProperty("systemMessage", expect.stringContaining("`npm ci`"));
  });

  it("sends the agent back to install the Git hooks", async ({ expect }) => {
    const output = await stop("no-git-hooks", false);
    expect(output).toHaveProperty("decision", "block");
    expect(output).toHaveProperty("reason", expect.stringContaining("`npm run setup`"));
  });

  it("prints its verdict on stdout when it runs as a process", async ({ expect }) => {
    const result = await run(
      process.execPath,
      [join(fixture("hook-copy"), ".agents", "hooks", "stop-check.mjs")],
      { env: gitEnv, input: JSON.stringify(stopEvent(false)) },
    );
    expect({ status: result.status, stdout: result.stdout }).toEqual({
      status: 0,
      stdout: `${JSON.stringify(await stop("no-dependencies", false))}\n`,
    });
  });

  it("tells the human when the Git hooks are still missing", async ({ expect }) => {
    const output = await stop("no-git-hooks", true);
    expect(output).not.toHaveProperty("decision");
    expect(output).toHaveProperty("systemMessage", expect.stringContaining("`npm run setup`"));
  });
});
