import { join } from "node:path";

import { describe, it } from "vite-plus/test";

import { guardGitFixture, guardProject, patch, type ToolCall } from "./guard-harness";

const { decisions, edit, projectFile, projectLink } = guardProject();
const { worktree, write: writeInFixture } = guardGitFixture();
const inWorktree = (file: string) => writeInFixture(join(worktree(), file));

describe.concurrent("edit rules", { timeout: 30_000 }, () => {
  it("denies unit tests in app code", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [edit("src/lib/format.test.ts"), "deny"],
      [edit("src/components/ui/snippet.spec.tsx"), "deny"],
      [patch("*** Add File: src/routes/index.test.tsx"), "deny"],
      [edit("e2e/checkout.spec.ts"), "allow"],
      [edit("lint/policy.test.ts"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("denies new Markdown docs outside docs/agents and agent config", async ({ expect }) => {
    const write = (file: string): ToolCall => ({
      toolName: "Write",
      toolInput: { file_path: projectFile(file) },
    });
    const { actual, expected } = await decisions([
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

  it("denies edits to generated and tool-owned files", async ({ expect }) => {
    const { actual, expected } = await decisions([
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

  it("allows edits to source, tracked hooks, and files outside the project", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [edit("src/routes/index.tsx"), "allow"],
      [edit(".vite-hooks/pre-commit"), "allow"],
      [{ toolName: "Write", toolInput: { file_path: "/tmp/elsewhere/notes.md" } }, "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("compares each edited path by the file it reaches through symlinks", async ({ expect }) => {
    const linked = (toolName: string, file: string): ToolCall => ({
      toolName,
      toolInput: { file_path: join(projectLink(), file) },
    });
    const { actual, expected } = await decisions([
      [linked("Edit", "package-lock.json"), "deny"],
      [linked("Edit", "src/routeTree.gen.ts"), "deny"],
      [linked("Write", "PLAN.md"), "deny"],
      [edit("source-alias/routeTree.gen.ts"), "deny"],
      [patch("*** Add File: source-alias/lib/format.test.ts"), "deny"],
      [linked("Edit", "src/routes/index.tsx"), "allow"],
      [edit("outside-alias/package-lock.json"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("denies Codex patches that touch generated or tool-owned files", async ({ expect }) => {
    const { actual, expected } = await decisions([
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

  it("denies writes under node_modules and .output when they are symlinks", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [edit("node_modules/pkg/index.js"), "deny"],
      [patch("*** Add File: node_modules/pkg/patched.js"), "deny"],
      [inWorktree("node_modules/pkg/index.js"), "deny"],
      [inWorktree(".output/server/index.mjs"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("judges an edit in a worktree nested in the project by its path in that worktree", async ({
    expect,
  }) => {
    const { actual, expected } = await decisions([
      [inWorktree("src/routeTree.gen.ts"), "deny"],
      [inWorktree("src/lib/format.test.ts"), "deny"],
      [inWorktree("docs/notes.md"), "deny"],
      [inWorktree("package-lock.json"), "deny"],
      [writeInFixture(join(worktree(), "src/lib/format.test.ts"), worktree()), "deny"],
      [inWorktree("src/routes/index.tsx"), "allow"],
      [inWorktree("lib/clean.ts"), "allow"],
      [inWorktree(".scratch/plan.md"), "allow"],
      [inWorktree("README.md"), "allow"],
      [writeInFixture(".claude/notes.md"), "allow"],
      [writeInFixture("lib/new.ts"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });
});
