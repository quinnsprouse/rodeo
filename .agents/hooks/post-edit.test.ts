import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it } from "vite-plus/test";

const hook = join(dirname(fileURLToPath(import.meta.url)), "post-edit.mjs");

let fixtures = "";
const projectDir = () => join(fixtures, "no-dependencies");

function runPostEdit(filePath: string) {
  return new Promise<string>((resolvePromise, reject) => {
    const child = spawn(process.execPath, [hook], {
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir() },
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
    child.stdin.end(
      JSON.stringify({
        hook_event_name: "PostToolUse",
        tool_name: "Edit",
        tool_input: { file_path: filePath },
      }),
    );
  });
}

function objectField(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
}

async function additionalContext(filePath: string) {
  const output: unknown = JSON.parse(await runPostEdit(filePath));
  return objectField(objectField(output, "hookSpecificOutput"), "additionalContext");
}

beforeAll(() => {
  fixtures = mkdtempSync(join(tmpdir(), "rodeo-post-edit-"));
  mkdirSync(join(projectDir(), "src"), { recursive: true });
  writeFileSync(join(projectDir(), "src", "probe.ts"), "export const probe = 1;\n");
  writeFileSync(join(fixtures, "outside.ts"), "export const outside = 1;\n");
});

afterAll(() => {
  rmSync(fixtures, { recursive: true, force: true });
});

describe.concurrent("post-edit feedback in a checkout without dependencies", () => {
  it("says to install dependencies in one line", async ({ expect }) => {
    expect(await additionalContext(join(projectDir(), "src", "probe.ts"))).toBe(
      "Post-edit feedback could not run: dependencies are not installed. Run `npm ci`.",
    );
  });

  it("stays quiet about files outside the project", async ({ expect }) => {
    expect(await runPostEdit(join(fixtures, "outside.ts"))).toBe("");
  });
});
