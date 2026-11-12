import { describe, it } from "vite-plus/test";

import { bash, guardGitFixture, guardProject } from "./guard-harness";

const { decisions } = guardProject();
const { rm } = guardGitFixture();

describe.concurrent("uncommitted work rules", { timeout: 30_000 }, () => {
  it("asks before git commands that discard uncommitted work", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("git reset --hard HEAD~1"), "ask"],
      [bash("git checkout -- ."), "ask"],
      [bash("git clean -fd"), "ask"],
      [bash("git checkout ."), "ask"],
      [bash("git checkout -- src/routes/index.tsx"), "ask"],
      [bash("git checkout HEAD -- src"), "ask"],
      [bash("git checkout src/routes/__root.tsx"), "ask"],
      [bash("git -C src checkout routes/__root.tsx"), "ask"],
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

  it("allows git commands that keep uncommitted work", async ({ expect }) => {
    const { actual, expected } = await decisions([
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
    ]);
    expect(actual).toEqual(expected);
  });

  it("resolves git -C through symlinks before it looks for a checkout path", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [rm("git -C nested-alias checkout ../page.ts"), "ask"],
      [rm("git -C nested-alias checkout ../missing.ts"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });
});
