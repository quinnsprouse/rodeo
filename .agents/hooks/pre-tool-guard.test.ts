import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it, vi } from "vite-plus/test";

import { hermeticGitEnv, hermeticGitSettings } from "#tooling/git-env";
import { run as runProcess } from "#tooling/run";

import { bashVerdict, editVerdict } from "./guard-rules.mjs";
import { preToolDecision, shellTool } from "./pre-tool-guard.mjs";

const hooksDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(hooksDir, "..", "..");
const guard = join(hooksDir, "pre-tool-guard.mjs");
const gitEnv = hermeticGitEnv();

type Decision = "allow" | "ask" | "deny";
type ToolInput = Record<string, string>;
type ToolCall = {
  toolName: string;
  toolInput: ToolInput;
  project?: string;
  cwd?: string;
};

function verdict({ toolName, toolInput, project = repoRoot, cwd }: ToolCall) {
  const { command } = toolInput;
  return toolName === shellTool && command !== undefined
    ? bashVerdict(command, { projectRoot: project, cwd })
    : editVerdict(toolName, toolInput, { projectRoot: project });
}

function label(call: ToolCall) {
  return call.cwd === undefined ? call.toolInput : { ...call.toolInput, cwd: call.cwd };
}

function decisions(cases: [ToolCall, Decision][]) {
  return {
    actual: cases.map(([call]) => [label(call), verdict(call)?.decision ?? "allow"]),
    expected: cases.map(([call, decision]) => [label(call), decision]),
  };
}

function sameVerdicts(pairs: [typed: string, routed: string][]) {
  return {
    actual: pairs.map(([, routed]) => [routed, verdict(bash(routed))]),
    expected: pairs.map(([typed, routed]) => [routed, verdict(bash(typed))]),
  };
}

async function runGuard(stdin: string) {
  const { status, stdout } = await runProcess(process.execPath, [guard], {
    env: gitEnv,
    input: stdin,
  });
  return { status, stdout };
}

function hookEvent({ toolName, toolInput, cwd }: ToolCall) {
  const event = { hook_event_name: "PreToolUse", tool_name: toolName, tool_input: toolInput };
  return cwd === undefined ? event : { ...event, cwd };
}

function hookOutput(call: ToolCall, decision: Decision) {
  if (decision === "allow") return null;
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: verdict(call)?.reason,
    },
  };
}

function stdoutFor(call: ToolCall, decision: Decision) {
  const output = hookOutput(call, decision);
  return output === null ? "" : `${JSON.stringify(output)}\n`;
}

async function hookRuns(cases: [ToolCall, Decision][]) {
  const runs = await Promise.all(cases.map(([call]) => runGuard(JSON.stringify(hookEvent(call)))));
  return {
    actual: cases.map(([call], index) => [label(call), runs[index]]),
    expected: cases.map(([call, decision]) => [
      label(call),
      { status: 0, stdout: stdoutFor(call, decision) },
    ]),
  };
}

function handlerRuns(cases: [ToolCall, Decision][]) {
  return {
    actual: cases.map(([call]) => [
      label(call),
      preToolDecision(hookEvent(call), { root: call.project ?? repoRoot }),
    ]),
    expected: cases.map(([call, decision]) => [label(call), hookOutput(call, decision)]),
  };
}

const bash = (command: string): ToolCall => ({ toolName: "Bash", toolInput: { command } });
const edit = (file: string): ToolCall => ({
  toolName: "Edit",
  toolInput: { file_path: join(repoRoot, file) },
});
const patch = (...headers: string[]): ToolCall => ({
  toolName: "apply_patch",
  toolInput: { command: ["*** Begin Patch", ...headers, "*** End Patch"].join("\n") },
});
const script = (...lines: string[]) => bash(lines.join("\n"));
const reasonFor = (command: string) => verdict(bash(command))?.reason ?? "";

describe.concurrent("pre-tool guard", { timeout: 30_000 }, () => {
  it("denies unit tests in app code", ({ expect }) => {
    const { actual, expected } = decisions([
      [edit("src/lib/format.test.ts"), "deny"],
      [edit("src/components/ui/snippet.spec.tsx"), "deny"],
      [patch("*** Add File: src/routes/index.test.tsx"), "deny"],
      [edit("e2e/checkout.spec.ts"), "allow"],
      [edit("lint/rules.test.ts"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("denies new Markdown docs outside docs/agents and agent config", ({ expect }) => {
    const write = (file: string): ToolCall => ({
      toolName: "Write",
      toolInput: { file_path: join(repoRoot, file) },
    });
    const { actual, expected } = decisions([
      [write("docs/adr/0011-use-redis.md"), "deny"],
      [write("PLAN.md"), "deny"],
      [write("src/lib/README.md"), "deny"],
      [patch("*** Add File: docs/prd/checkout.md"), "deny"],
      [write("docs/agents/DATA.md"), "allow"],
      [write("gui/themes/midnight.md"), "allow"],
      [write(".scratch/plan.md"), "allow"],
      [write("CLAUDE.md"), "allow"],
      [edit("README.md"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("denies edits to generated and tool-owned files", ({ expect }) => {
    const { actual, expected } = decisions([
      [edit("src/routeTree.gen.ts"), "deny"],
      [edit("src/lib/cn-tables.ts"), "deny"],
      [edit("src/styles/fonts.gen.css"), "deny"],
      [edit("src/assets/fonts/open-runde-400-core.woff2"), "deny"],
      [edit("scripts/fonts/usage.json"), "deny"],
      [edit("package-lock.json"), "deny"],
      [edit(".vite-hooks/_/h"), "deny"],
      [edit(".output/server/index.mjs"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("allows edits to source, tracked hooks, and files outside the project", ({ expect }) => {
    const { actual, expected } = decisions([
      [edit("src/routes/index.tsx"), "allow"],
      [edit(".vite-hooks/pre-commit"), "allow"],
      [{ toolName: "Write", toolInput: { file_path: "/tmp/elsewhere/notes.md" } }, "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("denies Codex patches that touch generated or tool-owned files", ({ expect }) => {
    const { actual, expected } = decisions([
      [patch("*** Update File: src/routeTree.gen.ts"), "deny"],
      [
        patch("*** Update File: src/routes/index.tsx", "*** Delete File: package-lock.json"),
        "deny",
      ],
      [patch("*** Update File: src/lib/a.ts", "*** Move to: .output/a.ts"), "deny"],
      [patch("*** Add File: src/lib/new.ts"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("denies hook bypasses and foreign package managers", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash('git commit -m "feat: x" --no-verify'), "deny"],
      [bash("git commit -n -m x"), "deny"],
      [bash('git commit -nm "feat: x"'), "deny"],
      [bash("git push --no-verify origin HEAD"), "deny"],
      [bash('git -c core.hooksPath=/dev/null commit -m "feat: x"'), "deny"],
      [bash("git config core.hooksPath .nowhere"), "deny"],
      [bash('HUSKY=0 git commit -m "feat: x"'), "deny"],
      [bash("VITE_GIT_HOOKS=0 git push"), "deny"],
      [bash("pnpm add left-pad"), "deny"],
      [bash("yarn install"), "deny"],
      [bash("npx oxlint src"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("denies hook bypasses behind wrappers, nested shells, and flag clusters", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("git merge --no-verify"), "deny"],
      [bash("git commit --no-verif -m x"), "deny"],
      [bash("env HUSKY=0 git commit -m x"), "deny"],
      [bash("husky=0 git commit -m x"), "deny"],
      [bash("export HUSKY=0"), "deny"],
      [bash("export VITE_GIT_HOOKS=0 && git push"), "deny"],
      [bash('sh -c "git commit --no-verify -m x"'), "deny"],
      [bash("bash -lc 'git push --no-verify'"), "deny"],
      [script("bash <<'EOF'", "git commit --no-verify -m x", "EOF"), "deny"],
      [bash('echo "$(git commit -n -m x)"'), "deny"],
      [bash("echo `git commit -n -m x`"), "deny"],
      [script("cat <<EOF", "$(git commit -n -m x)", "EOF"), "deny"],
      [bash("git config --unset core.hooksPath"), "deny"],
      [bash("git config --global --add core.hooksPath x"), "deny"],
      [bash("git config set core.hooksPath x"), "deny"],
      [bash("git config unset core.hooksPath"), "deny"],
      [bash("echo ok && git commit -n -m x"), "deny"],
      [bash('git commit -anm "x"'), "deny"],
      [bash('git -c "core.hooksPath=/dev/null" commit -m x'), "deny"],
      [bash("git -c core.hookspath=x push"), "deny"],
      [bash("GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=x git commit -m x"), "deny"],
      [bash("npx oxlint@1.2.3 src"), "deny"],
      [bash("npx -y prettier --check ."), "deny"],
      [bash("bun install"), "deny"],
      [bash("yarn --silent add left-pad"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("reads commit messages, heredoc bodies, and quoted arguments as data", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("git config --get core.hooksPath"), "allow"],
      [bash("git config get core.hooksPath"), "allow"],
      [bash("git config core.hooksPath"), "allow"],
      [bash('grep -rn "core.hooksPath" scripts'), "allow"],
      [bash('git commit -m "docs(hooks): explain why -n is blocked"'), "allow"],
      [bash('git commit -m "feat: add push -f guard"'), "allow"],
      [bash('git commit -m "-n is a dry run"'), "allow"],
      [bash('git commit -am "feat: x"'), "allow"],
      [bash("git commit -uno -m x"), "allow"],
      [
        script(
          `git commit -m "$(cat <<'EOF'`,
          `fix(hooks): don't allow --no-verify (really) or "core.hooksPath"`,
          "",
          "HUSKY=0 and git push -f stay blocked.",
          "EOF",
          `)"`,
        ),
        "allow",
      ],
      [script("cat > notes.txt <<'EOF'", "git commit --no-verify", "EOF"), "allow"],
      [script("cat > notes.txt <<EOF", "Run `npm run check` first.", "EOF"), "allow"],
      [bash("git -c color.ui=never commit -m x"), "allow"],
      [bash("npx tsx scripts/setup.mjs"), "allow"],
      [bash("pnpm --version"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("escalates destructive git commands to the human", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("git push --force origin main"), "ask"],
      [bash("git push -f"), "ask"],
      [bash("git push origin +main"), "ask"],
      [bash("git push -uf origin main"), "ask"],
      [bash("git reset --hard HEAD~1"), "ask"],
      [bash("git checkout -- ."), "ask"],
      [bash("git clean -fd"), "ask"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("asks before git commands that discard uncommitted work", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("git checkout ."), "ask"],
      [bash("git checkout -- src/routes/index.tsx"), "ask"],
      [bash("git checkout HEAD -- src"), "ask"],
      [bash("git checkout src/routes/index.tsx"), "ask"],
      [bash("git -C src checkout routes/index.tsx"), "ask"],
      [bash("git checkout 'src/*.tsx'"), "ask"],
      [bash("git checkout -f main"), "ask"],
      [bash("git restore src/"), "ask"],
      [bash("git restore ."), "ask"],
      [bash("git restore --staged --worktree ."), "ask"],
      [bash("git restore -SW ."), "ask"],
      [bash("git switch --discard-changes main"), "ask"],
      [bash("git switch -f main"), "ask"],
      [bash("git stash drop"), "ask"],
      [bash("git stash clear"), "ask"],
      [bash("git clean --force"), "ask"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("allows git commands that keep uncommitted work", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("git restore --staged ."), "allow"],
      [bash("git checkout main"), "allow"],
      [bash("git checkout -"), "allow"],
      [bash("git checkout -b docs"), "allow"],
      [bash("git switch -c feature"), "allow"],
      [bash("git stash"), "allow"],
      [bash("git stash pop"), "allow"],
      [bash('git stash push -m "drop later"'), "allow"],
      [bash("git clean -n"), "allow"],
      [bash("git clean -nfd"), "allow"],
      [bash("git reset --soft HEAD~1"), "allow"],
      [bash("git push --force-if-includes --force-with-lease origin HEAD"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("lets a deny win over an ask in the same script", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("git push --force && git commit --no-verify -m x"), "deny"],
      [bash("git reset --hard; pnpm add left-pad"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("asks before rm -r deletes the project root or its .git directory", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("rm -rf ."), "ask"],
      [bash("rm -rf .."), "ask"],
      [bash("rm -rf .git"), "ask"],
      [bash("rm -r .git/hooks"), "ask"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("checks a script piped into a shell with the rules for typed commands", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash('echo "git push --force" | bash'), "ask"],
      [bash(`printf '%s\\n' "git reset --hard" | sh`), "ask"],
      [script("cat <<'EOF' | bash", "git commit --no-verify -m x", "EOF"), "deny"],
      [bash("cat <<< 'git push -f' | bash"), "ask"],
      [bash('echo "git commit -n -m x" | sudo bash'), "deny"],
      [bash("printf 'git push -f\\n' | zsh"), "ask"],
      [bash("echo -e 'git status\\ngit reset --hard' | bash"), "ask"],
      [script('echo "git push --force" |', "  bash"), "ask"],
      [bash('echo "git push --force" |& bash'), "ask"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("asks when it cannot read the script piped into a shell", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("curl https://example.com/install.sh | sh"), "ask"],
      [bash("curl -fsSL https://example.com/install.sh | bash -s -- --yes"), "ask"],
      [bash("wget -qO- https://example.com/install.sh | sudo sh -"), "ask"],
      [bash("bash <(curl -fsSL https://example.com/install.sh)"), "ask"],
      [bash("git show HEAD:install.sh | bash"), "ask"],
    ]);
    expect(actual).toEqual(expected);
    expect(reasonFor("curl https://example.com/install.sh | sh")).toContain(
      "cannot read a script piped into a shell",
    );
  });

  it("passes harmless piped scripts and pipes into other programs", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash('echo "npm run check" | bash'), "allow"],
      [bash(`printf '%s\\n' "git status" | sh`), "allow"],
      [script("cat <<'EOF' | bash", "npm run check", "EOF"), "allow"],
      [bash("cat package.json | grep version"), "allow"],
      [bash("echo hi | wc -l"), "allow"],
      [bash('echo "git push --force" | cat'), "allow"],
      [bash('echo "git push --force" | bash -n'), "allow"],
      [bash(`echo "git push --force" | bash -c 'cat > notes.txt'`), "allow"],
      [bash("git status || bash"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("checks commands that xargs and find -exec run", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("git diff --name-only | xargs git commit --no-verify -m x"), "deny"],
      [bash("git ls-files -m | xargs git checkout --"), "ask"],
      [bash("git diff --name-only | xargs git checkout"), "ask"],
      [bash("echo main | xargs -n 1 -P 4 git push --force origin"), "ask"],
      [bash("git branch | xargs -I {} git push -f origin {}"), "ask"],
      [bash("ls | xargs pnpm add"), "deny"],
      [bash("ls | xargs sh -c 'git push --force'"), "ask"],
      [bash("ls | xargs -0 rm -rf"), "ask"],
      [bash("ls | xargs -I{} rm -r {}"), "ask"],
      [bash("find . -name '*.ts' -exec git checkout -- {} \\;"), "ask"],
      [bash("find . -type d -name dist -exec rm -rf {} +"), "ask"],
      [bash("find . -name '*.sh' -exec sh -c 'git commit -n -m x' ';'"), "deny"],
      [bash("find src -execdir git reset --hard ';'"), "ask"],
    ]);
    expect(actual).toEqual(expected);
    expect(reasonFor("ls | xargs rm -rf")).toContain("targets from xargs or find at run time");
  });

  it("passes harmless commands under xargs and find -exec", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash("ls | xargs -n1 echo"), "allow"],
      [bash('find . -name "*.ts" | xargs grep foo'), "allow"],
      [bash("find . -name '*.ts' -exec grep -l foo {} +"), "allow"],
      [bash("find . -name '*.log' -exec rm {} \\;"), "allow"],
      [bash("git ls-files | xargs git add"), "allow"],
      [bash("ls | xargs -I{} git checkout -b {}"), "allow"],
      [bash("ls | xargs rm"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("gives a routed command the verdict it gets when typed", ({ expect }) => {
    const { actual, expected } = sameVerdicts([
      ["git push --force", 'echo "git push --force" | bash'],
      ["git reset --hard", `printf '%s\\n' "git reset --hard" | sh`],
      ["git commit --no-verify -m x", "git diff --name-only | xargs git commit --no-verify -m x"],
      ["git checkout -- src", "git ls-files -m | xargs git checkout --"],
      ["git reset --hard", "find src -execdir git reset --hard ';'"],
      ["pnpm add left-pad", "echo left-pad | xargs pnpm add"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("allows ordinary commands", ({ expect }) => {
    const { actual, expected } = decisions([
      [bash('git commit -m "feat: normal"'), "allow"],
      [bash("git push origin HEAD"), "allow"],
      [bash("git push --force-with-lease origin HEAD"), "allow"],
      [bash("git push -n origin HEAD"), "allow"],
      [bash('git commit --amend -m "feat: normal"'), "allow"],
      [bash("git push --follow-tags"), "allow"],
      [bash("npm run check"), "allow"],
      [bash("npm install"), "allow"],
      [bash("vp lint src"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("prints each verdict on stdout in the PreToolUse hook shape", async ({ expect }) => {
    const { actual, expected } = await hookRuns([
      [bash('git commit -m "feat: x" --no-verify'), "deny"],
      [bash("git push --force origin main"), "ask"],
      [bash("npm run check"), "allow"],
      [edit("src/routeTree.gen.ts"), "deny"],
      [
        patch("*** Update File: src/routes/index.tsx", "*** Delete File: package-lock.json"),
        "deny",
      ],
    ]);
    expect(actual).toEqual(expected);
  });

  it("never blocks on malformed input", async ({ expect }) => {
    expect(await runGuard("not json")).toEqual({ status: 0, stdout: "" });
  });
});

describe.concurrent("pre-tool guard on rm -r", { timeout: 30_000 }, () => {
  let fixture = "";

  function git(...args: string[]) {
    execFileSync("git", args, { cwd: fixture, env: gitEnv, stdio: "ignore" });
  }

  function writeFixture(path: string, content = "export {};\n") {
    mkdirSync(dirname(join(fixture, path)), { recursive: true });
    writeFileSync(join(fixture, path), content);
  }

  const rm = (command: string, cwd = ""): ToolCall => ({
    ...bash(command),
    project: fixture,
    cwd: join(fixture, cwd),
  });

  beforeAll(() => {
    for (const name of Object.keys(process.env).filter((key) => key.startsWith("GIT_"))) {
      vi.stubEnv(name, undefined);
    }
    for (const [name, value] of Object.entries(hermeticGitSettings)) vi.stubEnv(name, value);
    fixture = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-guard-")));
    writeFixture(".gitignore", "node_modules/\n.output/\ndist/\n");
    writeFixture("lib/clean.ts");
    writeFixture("app/page.ts");
    git("init", "--quiet");
    git("add", ".");
    git("-c", "user.name=Rodeo", "-c", "user.email=rodeo@localhost", "commit", "-qm", "init");
    writeFixture("app/page.ts", "export const edited = true;\n");
    writeFixture("drafts/new.ts");
    writeFixture("node_modules/pkg/index.js");
    writeFixture(".output/server.mjs");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    rmSync(fixture, { recursive: true, force: true });
  });

  it("asks when a target holds uncommitted or untracked work", ({ expect }) => {
    const { actual, expected } = decisions([
      [rm("rm -rf drafts"), "ask"],
      [rm("rm -rf app"), "ask"],
      [rm("rm -r drafts"), "ask"],
      [rm("rm -fr -- drafts"), "ask"],
      [rm("rm -rf lib drafts"), "ask"],
      [rm("rm -rf ../drafts", "lib"), "ask"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("allows targets Git can restore, ignores, or does not own", ({ expect }) => {
    const { actual, expected } = decisions([
      [rm("rm -rf lib"), "allow"],
      [rm("rm -rf .", "lib"), "allow"],
      [rm("rm -rf node_modules"), "allow"],
      [rm("rm -rf .output dist"), "allow"],
      [rm("rm -rf /tmp/elsewhere"), "allow"],
      [rm('rm -rf "$TARGET"'), "allow"],
      [rm("rm src/lib/x.ts"), "allow"],
      [rm("rm drafts/new.ts"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("resolves rm targets from the hook input's cwd", ({ expect }) => {
    const { actual, expected } = handlerRuns([[rm("rm -rf ../drafts", "lib"), "ask"]]);
    expect(actual).toEqual(expected);
  });

  it("treats find -delete with no filters as rm -r of its roots", ({ expect }) => {
    const { actual, expected } = decisions([
      [rm("find drafts -delete"), "ask"],
      [rm("find app -depth -print -delete"), "ask"],
      [rm("find . -delete"), "ask"],
      [rm("find . -mindepth 1 -delete"), "ask"],
      [rm("find .git -delete"), "ask"],
      [rm("find lib -delete"), "allow"],
      [rm("find node_modules -delete"), "allow"],
      [rm("find . -delete", "lib"), "allow"],
      [rm("find . -name '*.tmp' -delete"), "allow"],
      [rm("find drafts -name '*.ts'"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });
});

describe.concurrent("pre-tool guard on script files", { timeout: 30_000 }, () => {
  let fixture = "";
  const scriptFiles = {
    "push.sh": "git push --force origin main\n",
    "safe.sh": "#!/bin/sh\nnpm run check\ngit status\n",
    "outer.sh": "#!/bin/bash\necho start\n./scripts/inner.sh\n",
    "scripts/inner.sh": "git commit -n -m inner\n",
    "scripts/release": "#!/usr/bin/env bash\ngit commit --no-verify -m release\n",
    "scripts/tool": "#!/usr/bin/env node\nconsole.log('git push --force');\n",
    "notes.txt": "git push --force\n",
    "loop.sh": "./loop.sh\nbash loop.sh\nsource loop.sh\n",
    "big.sh": `git push --force\n${"#".repeat(256 * 1024)}\n`,
    "binary.sh": "git push --force\n\u0000\n",
  };

  const run = (command: string, cwd = ""): ToolCall => ({
    ...bash(command),
    project: fixture,
    cwd: join(fixture, cwd),
  });

  beforeAll(() => {
    fixture = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-guard-scripts-")));
    for (const [path, content] of Object.entries(scriptFiles)) {
      mkdirSync(dirname(join(fixture, path)), { recursive: true });
      writeFileSync(join(fixture, path), content);
    }
  });

  afterAll(() => {
    rmSync(fixture, { recursive: true, force: true });
  });

  it("checks the commands in a script file that a shell runs", ({ expect }) => {
    const { actual, expected } = decisions([
      [run("bash push.sh"), "ask"],
      [run("sh ./push.sh"), "ask"],
      [run("zsh -e push.sh"), "ask"],
      [run("source push.sh"), "ask"],
      [run(". ./push.sh"), "ask"],
      [run("./push.sh"), "ask"],
      [run(join(fixture, "push.sh")), "ask"],
      [run("bash ../push.sh", "scripts"), "ask"],
      [run("scripts/release"), "deny"],
      [run("bash notes.txt"), "ask"],
      [run("cat push.sh | bash"), "ask"],
      [run("bash < push.sh"), "ask"],
      [run("cat < push.sh | sh"), "ask"],
      [run('echo "bash push.sh" | sh'), "ask"],
      [run("bash outer.sh"), "deny"],
      [run("./outer.sh"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("passes script files that are harmless, unreadable, or not shell scripts", ({ expect }) => {
    const { actual, expected } = decisions([
      [run("bash safe.sh"), "allow"],
      [run("./safe.sh"), "allow"],
      [run("cat safe.sh | bash"), "allow"],
      [run("bash -n push.sh"), "allow"],
      [run("bash missing.sh"), "allow"],
      [run("./missing.sh"), "allow"],
      [run("source missing.sh"), "allow"],
      [run("bash push.sh", "scripts"), "allow"],
      [run("bash big.sh"), "allow"],
      [run("bash binary.sh"), "allow"],
      [run("./notes.txt"), "allow"],
      [run("scripts/tool"), "allow"],
      [run("node scripts/tool"), "allow"],
      [run("./loop.sh"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });
});
