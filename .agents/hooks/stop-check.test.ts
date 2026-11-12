import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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
import { run } from "#tooling/run";

import { stopCheck } from "./stop-check.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);
const vp = join(dirname(require.resolve("vite-plus/package.json")), "bin/vp");
const gitEnv = hermeticGitEnv();

let fixtures = "";
const fixture = (name: string) => join(fixtures, name);

async function succeed(cwd: string, command: string, args: readonly string[]) {
  const { status, output } = await run(command, args, { cwd, env: gitEnv });
  if (status !== 0) throw new Error(`${command} ${args.join(" ")} failed in ${cwd}:\n${output}`);
}

function git(cwd: string, ...args: string[]) {
  return succeed(cwd, "git", [
    "-c",
    "user.name=Rodeo Test",
    "-c",
    "user.email=test@localhost",
    ...args,
  ]);
}

function writeFiles(root: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

async function createRepo(
  name: string,
  files: Record<string, string> = { "README.md": "# Fixture\n" },
) {
  const root = fixture(name);
  mkdirSync(join(root, "src"), { recursive: true });
  writeFiles(root, files);
  await git(root, "init", "--quiet", "--initial-branch=main");
  await git(root, "add", "--all");
  await git(root, "commit", "--quiet", "-m", "chore: fixture baseline");
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

function testReading(path: string, content: string) {
  return `import { readFileSync } from "node:fs";

import { expect, it } from "vite-plus/test";

it("reads its input by path", () => {
  expect(readFileSync(new URL(${JSON.stringify(path)}, import.meta.url), "utf8")).toBe(
    ${JSON.stringify(content)},
  );
});
`;
}

const failingToolTest = `import { expect, it } from "vite-plus/test";

it("fails whenever the tool tests run", () => {
  expect.unreachable();
});
`;

async function repoWithGitHooks(name: string, files: Record<string, string>) {
  const root = await createRepo(name, { ...checkedProject, ...files });
  await git(root, "config", "core.hooksPath", `${gitHooksDirectory}/_`);
  mkdirSync(join(root, gitHooksDirectory, "_"), { recursive: true });
  return root;
}

const toolLog = "node_modules/tool-calls.log";
const recordingTool = `import { appendFileSync } from "node:fs";
import { basename } from "node:path";

const call = [basename(process.argv[1], ".mjs"), ...process.argv.slice(2)].join(" ");
appendFileSync(${JSON.stringify(toolLog)}, call + "\\n");
`;
const recordingTools = {
  "node_modules/vite-plus/package.json": '{ "bin": { "vp": "vp.mjs" } }\n',
  "node_modules/vite-plus/vp.mjs": recordingTool,
  "node_modules/typescript/package.json": '{ "bin": { "tsc": "tsc.mjs" } }\n',
  "node_modules/typescript/tsc.mjs": recordingTool,
};

async function recordingRepo(name: string) {
  return writeFiles(await repoWithGitHooks(name, {}), recordingTools);
}

function testRuns(name: string) {
  return readFileSync(join(fixture(name), toolLog), "utf8")
    .split("\n")
    .filter((call) => call.startsWith("vp test run"));
}

async function checkedRepo(name: string, files: Record<string, string> = {}) {
  const root = await repoWithGitHooks(name, files);
  mkdirSync(join(root, "node_modules"));
  for (const entry of readdirSync(fixture("dependencies"))) {
    symlinkSync(join(fixture("dependencies"), entry), join(root, "node_modules", entry));
  }
  return root;
}

function change(root: string) {
  return writeFiles(root, {
    "src/probe.ts": "export function probe(value: any) {\n  return value;\n}\n",
  });
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

async function freshWorktree(name: string) {
  const main = linkDependencies(await createRepo(`${name}-main`));
  await succeed(main, process.execPath, [vp, "config", "--hooks-dir", gitHooksDirectory]);
  await git(main, "worktree", "add", "--quiet", "--detach", fixture(name));
  return fixture(name);
}

function stopEvent(stopHookActive: boolean) {
  return { hook_event_name: "Stop", stop_hook_active: stopHookActive };
}

function stop(name: string, stopHookActive = false) {
  return stopCheck(stopEvent(stopHookActive), { root: fixture(name) });
}

beforeAll(async () => {
  for (const name of Object.keys(process.env).filter((key) => key.startsWith("GIT_"))) {
    vi.stubEnv(name, undefined);
  }
  for (const [name, value] of Object.entries(hermeticGitSettings)) vi.stubEnv(name, value);
  fixtures = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-stop-check-")));
  installedDependencies();
  await Promise.all([
    createRepo("unchanged"),
    createRepo("no-dependencies").then(change),
    createRepo("no-git-hooks").then(linkDependencies).then(change),
    freshWorktree("fresh-worktree").then(linkDependencies).then(change),
    checkedRepo("deleted-import", {
      "lint/value.repo.test.ts": testReading("../src/value.ts", checkedProject["src/value.ts"]),
      "lint/tool.test.ts": failingToolTest,
    }).then((root) => rmSync(join(root, "src", "value.ts"))),
    checkedRepo("unimported-inputs", {
      "data.txt": "ok\n",
      "lint/data.repo.test.ts": testReading("../data.txt", "ok\n"),
      "lint/expected.txt": "ok\n",
      "lint/tool.test.ts": testReading("./expected.txt", "ok\n"),
    }).then((root) => {
      writeFiles(root, { "data.txt": "changed\n", "src/café.ts": "export const café=1\n" });
      return git(root, "mv", "lint/expected.txt", "expected.txt");
    }),
    recordingRepo("remembered-tool-tests"),
  ]);
}, 30_000);

afterAll(() => {
  vi.unstubAllEnvs();
  rmSync(fixtures, { recursive: true, force: true });
});

describe.concurrent("stop check in a checkout that is not set up", { timeout: 30_000 }, () => {
  it("passes when nothing changed", async ({ expect }) => {
    expect(await stop("unchanged")).toBeNull();
  });

  it("sends the agent back to install dependencies", async ({ expect }) => {
    const output = await stop("no-dependencies");
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
    const output = await stop("no-git-hooks");
    expect(output).toHaveProperty("decision", "block");
    expect(output).toHaveProperty("reason", expect.stringContaining("`npm run setup`"));
  });

  it("sends the agent back to install the Git hooks in a fresh Git worktree", async ({
    expect,
  }) => {
    const output = await stop("fresh-worktree");
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
  it("checks an app change that only deletes files with tsc and the repository tests, not the tool tests", async ({
    expect,
  }) => {
    const output = await stop("deleted-import");
    expect(output).toHaveProperty("decision", "block");
    expect(output).toHaveProperty("reason", expect.stringMatching(/tsc -b failed:[^]*TS2307/));
    expect(output).toHaveProperty(
      "reason",
      expect.stringMatching(/vp test run \.repo\.test\.ts failed:[^]*lint\/value\.repo\.test\.ts/),
    );
    expect(output).toHaveProperty("reason", expect.not.stringContaining("lint/tool.test.ts"));
  });

  it("checks changes no import reaches: files tests read by path, a tooling file Git sees as renamed, and a name Git quotes", async ({
    expect,
  }) => {
    const output = await stop("unimported-inputs");
    expect(output).toHaveProperty("decision", "block");
    expect(output).toHaveProperty(
      "reason",
      expect.stringMatching(/vp test run failed:[^]*lint\/data\.repo\.test\.ts/),
    );
    expect(output).toHaveProperty(
      "reason",
      expect.stringMatching(/vp test run failed:[^]*lint\/tool\.test\.ts/),
    );
    expect(output).toHaveProperty(
      "reason",
      expect.stringMatching(/vp check \(changed files\) failed:[^]*src\/café\.ts/),
    );
  });

  it("runs the tool tests once for each state of the uncommitted tooling", async ({ expect }) => {
    const name = "remembered-tool-tests";
    writeFiles(fixture(name), { "scripts/input.txt": "first\n" });
    const toolingChanged = await stop(name);
    writeFiles(fixture(name), { "src/input.txt": "first\n" });
    const appChanged = await stop(name);
    writeFiles(fixture(name), { "scripts/input.txt": "second\n" });
    const toolingChangedAgain = await stop(name);
    expect([toolingChanged, appChanged, toolingChangedAgain]).toEqual([null, null, null]);
    expect(testRuns(name)).toEqual([
      "vp test run --passWithNoTests",
      "vp test run --passWithNoTests .repo.test.ts",
      "vp test run --passWithNoTests",
    ]);
  });
});
