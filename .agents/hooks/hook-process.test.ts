import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import * as z from "zod/mini";

import { hermeticGitEnv } from "#tooling/git-env";
import { run } from "#tooling/run";

import { postEditFeedback } from "./post-edit.mjs";
import { event as guardHookEvent } from "./pre-tool-guard.mjs";
import { stopCheck } from "./stop-check.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const gitEnv = hermeticGitEnv();

type Decision = "allow" | "ask" | "deny";

let fixtures = "";
const project = () => join(fixtures, "project");
const hook = (name: string) => join(project(), ".agents", "hooks", `${name}.mjs`);

function copyHooks(root: string) {
  for (const path of [join(".agents", "hooks"), "scripts", "package.json"]) {
    cpSync(join(repoRoot, path), join(root, path), {
      recursive: true,
      filter: (source) => !source.endsWith(".test.ts"),
    });
  }
}

function git(...args: string[]) {
  execFileSync("git", ["-c", "user.name=Rodeo Test", "-c", "user.email=test@localhost", ...args], {
    cwd: project(),
    env: gitEnv,
    stdio: "ignore",
  });
}

async function runHook(name: string, input: unknown) {
  const { status, stdout } = await run(process.execPath, [hook(name)], {
    env: gitEnv,
    input: typeof input === "string" ? input : JSON.stringify(input),
  });
  return {
    status,
    printed: stdout
      .split("\n")
      .slice(0, -1)
      .map((line): unknown => JSON.parse(line)),
  };
}

function guardEvent(toolName: string, toolInput: Record<string, string>) {
  return { hook_event_name: guardHookEvent, tool_name: toolName, tool_input: toolInput };
}

const bash = (command: string) => guardEvent("Bash", { command });

const guardOutput = z.object({
  hookSpecificOutput: z.object({
    hookEventName: z.literal("PreToolUse"),
    permissionDecision: z.enum(["ask", "deny"]),
    permissionDecisionReason: z.string().check(z.minLength(1)),
  }),
});

async function guardDecisions(input: unknown) {
  const { status, printed } = await runHook("pre-tool-guard", input);
  return {
    status,
    decisions: printed.map((line) => guardOutput.parse(line).hookSpecificOutput.permissionDecision),
  };
}

function printedDecisions(decision: Decision) {
  return { status: 0, decisions: decision === "allow" ? [] : [decision] };
}

function editEvent(filePath: string) {
  return { hook_event_name: "PostToolUse", tool_name: "Edit", tool_input: { file_path: filePath } };
}

const stopEvent = { hook_event_name: "Stop", stop_hook_active: false };

beforeAll(() => {
  fixtures = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-hook-process-")));
  mkdirSync(join(project(), "src"), { recursive: true });
  writeFileSync(join(project(), "README.md"), "# Fixture\n");
  git("init", "--quiet", "--initial-branch=main");
  git("add", "README.md");
  git("commit", "--quiet", "-m", "chore: fixture baseline");
  copyHooks(project());
  writeFileSync(join(project(), "src", "probe.ts"), "export const probe = 1;\n");
  writeFileSync(join(fixtures, "outside.ts"), "export const outside = 1;\n");
});

afterAll(() => {
  rmSync(fixtures, { recursive: true, force: true });
});

describe.concurrent("hooks run as processes from a copy in a fixture", { timeout: 30_000 }, () => {
  it("the pre-tool guard prints each verdict on stdout in the PreToolUse shape", async () => {
    const cases: [unknown, Decision][] = [
      [bash('git commit -m "feat: x" --no-verify'), "deny"],
      [bash("git push --force origin main"), "ask"],
      [bash("npm run check"), "allow"],
    ];
    const runs = await Promise.all(cases.map(([input]) => guardDecisions(input)));
    expect(runs).toEqual(cases.map(([, decision]) => printedDecisions(decision)));
  });

  it("the pre-tool guard never blocks on malformed input", async () => {
    expect(await runHook("pre-tool-guard", "not json")).toEqual({ status: 0, printed: [] });
  });

  it("post-edit prints its feedback for project files and stays quiet about other files", async () => {
    const inside = editEvent(join(project(), "src", "probe.ts"));
    const outside = editEvent(join(fixtures, "outside.ts"));
    expect(await runHook("post-edit", inside)).toEqual({
      status: 0,
      printed: [await postEditFeedback(inside, { root: project() })],
    });
    expect(await runHook("post-edit", outside)).toEqual({ status: 0, printed: [] });
  });

  it("the stop check prints its verdict on stdout", async () => {
    const verdict = await stopCheck(stopEvent, { root: project() });
    expect(verdict).toHaveProperty("decision", "block");
    expect(await runHook("stop-check", stopEvent)).toEqual({ status: 0, printed: [verdict] });
  });
});
