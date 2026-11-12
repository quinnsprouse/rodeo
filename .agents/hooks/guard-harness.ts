import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterAll, beforeAll, vi } from "vite-plus/test";

import { hermeticGitEnv, hermeticGitSettings } from "#tooling/git-env";

import { preToolDecision } from "./pre-tool-guard.mjs";

type Decision = "allow" | "ask" | "deny";
type ToolInput = Record<string, string>;
export type ToolCall = {
  toolName: string;
  toolInput: ToolInput;
  project?: string;
  cwd?: string;
};

export const bash = (command: string): ToolCall => ({ toolName: "Bash", toolInput: { command } });
export const script = (...lines: string[]) => bash(lines.join("\n"));
export const patch = (...headers: string[]): ToolCall => ({
  toolName: "apply_patch",
  toolInput: { command: ["*** Begin Patch", ...headers, "*** End Patch"].join("\n") },
});

function hookEvent({ toolName, toolInput, cwd }: ToolCall) {
  const event = { hook_event_name: "PreToolUse", tool_name: toolName, tool_input: toolInput };
  return cwd === undefined ? event : { ...event, cwd };
}

function label(call: ToolCall) {
  return call.cwd === undefined ? call.toolInput : { ...call.toolInput, cwd: call.cwd };
}

export function guardProject() {
  let project = "";
  let outside = "";
  const projectLink = () => `${project}-link`;
  const projectFile = (file: string) => join(project, file);

  beforeAll(() => {
    project = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-guard-project-")));
    mkdirSync(join(project, "src", "routes"), { recursive: true });
    writeFileSync(join(project, "src", "routes", "__root.tsx"), "export {};\n");
    outside = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-guard-outside-")));
    symlinkSync(project, projectLink(), "dir");
    symlinkSync(join(project, "src"), join(project, "source-alias"), "dir");
    symlinkSync(outside, join(project, "outside-alias"), "dir");
    mkdirSync(join(outside, "modules"));
    symlinkSync(join(outside, "modules"), join(project, "node_modules"), "dir");
  });

  afterAll(() => {
    rmSync(projectLink(), { force: true });
    rmSync(project, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });

  async function verdict(call: ToolCall) {
    const output = await preToolDecision(hookEvent(call), { root: call.project ?? project });
    return output === null
      ? { decision: "allow", reason: "" }
      : {
          decision: output.hookSpecificOutput.permissionDecision,
          reason: output.hookSpecificOutput.permissionDecisionReason,
        };
  }

  return {
    projectFile,
    projectLink,
    edit: (file: string): ToolCall => ({
      toolName: "Edit",
      toolInput: { file_path: projectFile(file) },
    }),
    reasonFor: async (command: string) => (await verdict(bash(command))).reason,
    reasons: async (calls: ToolCall[]) =>
      Promise.all(calls.map(async (call) => (await verdict(call)).reason)),
    decisions: async (cases: [ToolCall, Decision][]) => ({
      actual: await Promise.all(
        cases.map(async ([call]) => [label(call), (await verdict(call)).decision]),
      ),
      expected: cases.map(([call, decision]) => [label(call), decision]),
    }),
    sameVerdicts: async (pairs: [typed: string, routed: string][]) => ({
      actual: await Promise.all(
        pairs.map(async ([, routed]) => [routed, await verdict(bash(routed))]),
      ),
      expected: await Promise.all(
        pairs.map(async ([typed, routed]) => [routed, await verdict(bash(typed))]),
      ),
    }),
  };
}

export function guardGitFixture() {
  const gitEnv = hermeticGitEnv();
  let fixture = "";
  const fixtureLink = () => `${fixture}-link`;
  const outside = () => `${fixture}-outside`;
  const worktree = () => join(fixture, ".claude", "worktrees", "feat");

  function git(...args: string[]) {
    execFileSync("git", args, { cwd: fixture, env: gitEnv, stdio: "ignore" });
  }

  function writeFixture(path: string, content = "export {};\n") {
    mkdirSync(dirname(join(fixture, path)), { recursive: true });
    writeFileSync(join(fixture, path), content);
  }

  beforeAll(() => {
    for (const name of Object.keys(process.env).filter((key) => key.startsWith("GIT_"))) {
      vi.stubEnv(name, undefined);
    }
    for (const [name, value] of Object.entries(hermeticGitSettings)) vi.stubEnv(name, value);
    fixture = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-guard-")));
    writeFixture(".gitignore", "node_modules/\n.output/\ndist/\n");
    writeFixture("lib/clean.ts");
    writeFixture("app/page.ts");
    writeFixture("app/routes/root.ts");
    git("init", "--quiet");
    git("add", ".");
    git("-c", "user.name=Rodeo", "-c", "user.email=rodeo@localhost", "commit", "-qm", "init");
    writeFixture("app/page.ts", "export const edited = true;\n");
    writeFixture("app/routes/root.ts", "export const edited = true;\n");
    writeFixture("dist/index.js");
    mkdirSync(join(outside(), "modules"), { recursive: true });
    mkdirSync(join(outside(), "output"));
    git("worktree", "add", "--quiet", worktree());
    symlinkSync(join(outside(), "modules"), join(worktree(), "node_modules"), "dir");
    symlinkSync(join(outside(), "output"), join(worktree(), ".output"), "dir");
    writeFixture("drafts/new.ts");
    writeFixture("node_modules/pkg/index.js");
    writeFixture(".output/server.mjs");
    mkdirSync(join(fixture, "app", "nested"));
    symlinkSync(join(fixture, "app", "nested"), join(fixture, "nested-alias"), "dir");
    symlinkSync(fixture, fixtureLink(), "dir");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    rmSync(fixtureLink(), { force: true });
    rmSync(outside(), { recursive: true, force: true });
    rmSync(fixture, { recursive: true, force: true });
  });

  return {
    fixture: () => fixture,
    fixtureLink,
    outside,
    worktree,
    write: (path: string, project = fixture): ToolCall => ({
      toolName: "Write",
      toolInput: { file_path: path.startsWith("/") ? path : join(fixture, path) },
      project,
    }),
    rm: (command: string, cwd = ""): ToolCall => ({
      ...bash(command),
      project: fixture,
      cwd: join(fixture, cwd),
    }),
    rmFromLink: (command: string, cwd = ""): ToolCall => ({
      ...bash(command),
      project: fixture,
      cwd: join(fixtureLink(), cwd),
    }),
  };
}
