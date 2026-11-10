import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it } from "vite-plus/test";

import { run } from "#tooling/run";

import { event, postEditFeedback } from "./post-edit.mjs";

const hook = join(dirname(fileURLToPath(import.meta.url)), "post-edit.mjs");

let fixtures = "";
const projectDir = () => join(fixtures, "no-dependencies");

function editEvent(filePath: string) {
  return { hook_event_name: event, tool_name: "Edit", tool_input: { file_path: filePath } };
}

beforeAll(() => {
  fixtures = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-post-edit-")));
  mkdirSync(join(projectDir(), "src"), { recursive: true });
  writeFileSync(join(projectDir(), "src", "probe.ts"), "export const probe = 1;\n");
  writeFileSync(join(fixtures, "outside.ts"), "export const outside = 1;\n");
});

afterAll(() => {
  rmSync(fixtures, { recursive: true, force: true });
});

describe.concurrent("post-edit feedback in a checkout without dependencies", () => {
  it("says to install dependencies in one line", async ({ expect }) => {
    const feedback = await postEditFeedback(editEvent(join(projectDir(), "src", "probe.ts")), {
      root: projectDir(),
    });
    expect(feedback).toEqual({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext:
          "Post-edit feedback could not run: dependencies are not installed. Run `npm ci`.",
      },
    });
  });

  it("stays quiet about files outside the project", async ({ expect }) => {
    const result = await run(process.execPath, [hook], {
      input: JSON.stringify(editEvent(join(fixtures, "outside.ts"))),
    });
    expect({ status: result.status, stdout: result.stdout }).toEqual({ status: 0, stdout: "" });
  });
});
