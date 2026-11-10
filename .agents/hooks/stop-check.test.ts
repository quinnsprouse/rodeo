import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { devNull, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it } from "vite-plus/test";

const hook = join(dirname(fileURLToPath(import.meta.url)), "stop-check.mjs");
const envWithoutGitOverrides = {
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_"))),
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: "1",
};

type StopOutput = {
  decision: string | undefined;
  reason: string | undefined;
  systemMessage: string | undefined;
};

let fixtures = "";
const fixture = (name: string) => join(fixtures, name);

function git(cwd: string, ...args: string[]) {
  execFileSync("git", ["-c", "user.name=Rodeo Test", "-c", "user.email=test@localhost", ...args], {
    cwd,
    env: envWithoutGitOverrides,
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

function runStop(projectDir: string, stopHookActive: boolean) {
  return new Promise<string>((resolvePromise, reject) => {
    const child = spawn(process.execPath, [hook], {
      env: { ...envWithoutGitOverrides, CLAUDE_PROJECT_DIR: projectDir },
    });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) =>
      status === 0
        ? resolvePromise(stdout)
        : reject(new Error(`The hook exited ${String(status)}`)),
    );
    child.stdin.end(JSON.stringify({ hook_event_name: "Stop", stop_hook_active: stopHookActive }));
  });
}

function textField(output: object, key: keyof StopOutput) {
  const value: unknown = Reflect.get(output, key);
  return typeof value === "string" ? value : undefined;
}

async function stop(projectDir: string, stopHookActive: boolean): Promise<StopOutput> {
  const stdout = await runStop(projectDir, stopHookActive);
  const output: unknown = JSON.parse(stdout);
  if (typeof output !== "object" || output === null) {
    throw new Error(`Unexpected stop hook output: ${stdout}`);
  }
  return {
    decision: textField(output, "decision"),
    reason: textField(output, "reason"),
    systemMessage: textField(output, "systemMessage"),
  };
}

beforeAll(() => {
  fixtures = mkdtempSync(join(tmpdir(), "rodeo-stop-check-"));
  createRepo("unchanged", { changed: false });
  createRepo("no-dependencies", { changed: true });
  mkdirSync(join(createRepo("no-git-hooks", { changed: true }), "node_modules", "vite-plus"), {
    recursive: true,
  });
});

afterAll(() => {
  rmSync(fixtures, { recursive: true, force: true });
});

describe.concurrent("stop check in a checkout that is not set up", { timeout: 30_000 }, () => {
  it("passes when nothing changed", async ({ expect }) => {
    expect(await runStop(fixture("unchanged"), false)).toBe("");
  });

  it("sends the agent back to install dependencies", async ({ expect }) => {
    const output = await stop(fixture("no-dependencies"), false);
    expect(output.decision).toBe("block");
    expect(output.reason).toContain("`npm ci`");
    expect(existsSync(join(fixture("no-dependencies"), "node_modules"))).toBe(false);
  });

  it("tells the human on the retry so the turn can end", async ({ expect }) => {
    const output = await stop(fixture("no-dependencies"), true);
    expect(output.decision).toBeUndefined();
    expect(output.systemMessage).toContain("`npm ci`");
  });

  it("sends the agent back to install the Git hooks", async ({ expect }) => {
    const output = await stop(fixture("no-git-hooks"), false);
    expect(output.decision).toBe("block");
    expect(output.reason).toContain("`npm run setup`");
  });

  it("tells the human when the Git hooks are still missing", async ({ expect }) => {
    const output = await stop(fixture("no-git-hooks"), true);
    expect(output.decision).toBeUndefined();
    expect(output.systemMessage).toContain("`npm run setup`");
  });
});
