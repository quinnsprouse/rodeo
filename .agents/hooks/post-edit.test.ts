import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, it } from "vite-plus/test";

import { event, postEditFeedback } from "./post-edit.mjs";

let projectDir = "";

beforeAll(() => {
  projectDir = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-post-edit-")));
  mkdirSync(join(projectDir, "src"), { recursive: true });
  writeFileSync(join(projectDir, "src", "probe.ts"), "export const probe = 1;\n");
});

afterAll(() => {
  rmSync(projectDir, { recursive: true, force: true });
});

describe("post-edit feedback in a checkout without dependencies", () => {
  it("says to install dependencies in one line", async ({ expect }) => {
    const feedback = await postEditFeedback(
      {
        hook_event_name: event,
        tool_name: "Edit",
        tool_input: { file_path: join(projectDir, "src", "probe.ts") },
      },
      { root: projectDir },
    );
    expect(feedback).toEqual({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext:
          "Post-edit feedback could not run: dependencies are not installed. Run `npm ci`.",
      },
    });
  });
});
