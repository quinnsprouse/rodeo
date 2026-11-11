import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it, vi } from "vite-plus/test";

import { hermeticGitEnv, hermeticGitSettings } from "#tooling/git-env";
import { gitHooksDirectory } from "#tooling/project";

import { stopCheck } from "./stop-check.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);
const vp = join(dirname(require.resolve("vite-plus/package.json")), "bin/vp");
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

function createRepo(name: string, files: Record<string, string> = { "README.md": "# Fixture\n" }) {
  const root = fixture(name);
  mkdirSync(join(root, "src"), { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  git(root, "init", "--quiet", "--initial-branch=main");
  git(root, "add", "--all");
  git(root, "commit", "--quiet", "-m", "chore: fixture baseline");
  return root;
}

const checkedProject = {
  "package.json": '{ "name": "stop-check-fixture", "private": true, "type": "module" }\n',
  ".gitignore": "node_modules\n*.tsbuildinfo\n",
  "tsconfig.json":
    '{ "files": ["src/main.ts"], "compilerOptions": { "noEmit": true, "types": [] } }\n',
  "src/main.ts": 'import { value } from "./value";\n\nexport const main = value;\n',
  "src/value.ts": "export const value = 1;\n",
};

const testReadingByPath = {
  "data.txt": "ok\n",
  "checks/data.test.ts": `import { readFileSync } from "node:fs";

import { expect, it } from "vite-plus/test";

it("reads its input by path", () => {
  expect(readFileSync(new URL("../data.txt", import.meta.url), "utf8")).toBe("ok\\n");
});
`,
};

function checkedRepo(name: string, files: Record<string, string> = {}) {
  const root = createRepo(name, { ...checkedProject, ...files });
  git(root, "config", "core.hooksPath", `${gitHooksDirectory}/_`);
  mkdirSync(join(root, gitHooksDirectory, "_"), { recursive: true });
  mkdirSync(join(root, "node_modules"));
  for (const entry of readdirSync(fixture("dependencies"))) {
    symlinkSync(join(fixture("dependencies"), entry), join(root, "node_modules", entry));
  }
  return root;
}

function change(root: string) {
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(
    join(root, "src", "probe.ts"),
    "export function probe(value: any) {\n  return value;\n}\n",
  );
  return root;
}

function linkDependencies(root: string) {
  symlinkSync(fixture("dependencies"), join(root, "node_modules"), "dir");
  return root;
}

const npmMetadata = new Set([".bin", ".package-lock.json"]);

function installedDependencies() {
  const installed = join(repoRoot, "node_modules");
  mkdirSync(fixture("dependencies"));
  const written = readdirSync(installed).filter(
    (entry) => !entry.startsWith(".") || npmMetadata.has(entry),
  );
  for (const name of written) {
    symlinkSync(join(installed, name), join(fixture("dependencies"), name));
  }
}

function freshWorktree(name: string) {
  const main = linkDependencies(createRepo(`${name}-main`));
  execFileSync(process.execPath, [vp, "config", "--hooks-dir", gitHooksDirectory], {
    cwd: main,
    env: gitEnv,
    stdio: "ignore",
  });
  git(main, "worktree", "add", "--quiet", "--detach", fixture(name));
  return fixture(name);
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
  installedDependencies();
  createRepo("unchanged");
  change(createRepo("no-dependencies"));
  change(linkDependencies(createRepo("no-git-hooks")));
  change(linkDependencies(freshWorktree("fresh-worktree")));
  rmSync(join(checkedRepo("deleted-import"), "src", "value.ts"));
  const unimported = checkedRepo("unimported-inputs", testReadingByPath);
  writeFileSync(join(unimported, "data.txt"), "changed\n");
  writeFileSync(join(unimported, "src", "café.ts"), "export const café=1\n");
}, 30_000);

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

  it("sends the agent back to install the Git hooks in a fresh Git worktree", async ({
    expect,
  }) => {
    const output = await stop("fresh-worktree", false);
    expect(output).toHaveProperty("decision", "block");
    expect(output).toHaveProperty("reason", expect.stringContaining("`npm run setup`"));
  });

  it("tells the human when the Git hooks are still missing", async ({ expect }) => {
    const output = await stop("no-git-hooks", true);
    expect(output).not.toHaveProperty("decision");
    expect(output).toHaveProperty("systemMessage", expect.stringContaining("`npm run setup`"));
  });
});

describe.concurrent("stop check on a change in a set-up checkout", { timeout: 30_000 }, () => {
  it("type-checks a change that only deletes files", async ({ expect }) => {
    const output = await stop("deleted-import", false);
    expect(output).toHaveProperty("decision", "block");
    expect(output).toHaveProperty("reason", expect.stringMatching(/tsc -b failed:[^]*TS2307/));
  });

  it("checks changes no import reaches: a file a test reads by path, a name Git quotes", async ({
    expect,
  }) => {
    const output = await stop("unimported-inputs", false);
    expect(output).toHaveProperty("decision", "block");
    expect(output).toHaveProperty(
      "reason",
      expect.stringMatching(/vp test run failed:[^]*checks\/data\.test\.ts/),
    );
    expect(output).toHaveProperty(
      "reason",
      expect.stringMatching(/vp check \(changed files\) failed:[^]*src\/café\.ts/),
    );
  });
});
