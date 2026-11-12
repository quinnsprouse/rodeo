import { join } from "node:path";

import { describe, it } from "vite-plus/test";

import { bash, guardGitFixture, guardProject } from "./guard-harness";

const { decisions } = guardProject();
const { fixtureLink, rm, rmFromLink } = guardGitFixture();

describe.concurrent("file delete rules", { timeout: 30_000 }, () => {
  it("asks before rm -r deletes the project root or its .git directory", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("rm -rf ."), "ask"],
      [bash("rm -rf .."), "ask"],
      [bash("rm -rf .git"), "ask"],
      [bash("rm -r .git/hooks"), "ask"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("asks when a target holds uncommitted or untracked work", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [rm("rm -rf drafts"), "ask"],
      [rm("rm -rf app"), "ask"],
      [rm("rm -r drafts"), "ask"],
      [rm("rm -fr -- drafts"), "ask"],
      [rm("rm -rf lib drafts"), "ask"],
      [rm("rm -rf ../drafts", "lib"), "ask"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("allows targets Git can restore, ignores, or does not own", async ({ expect }) => {
    const { actual, expected } = await decisions([
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

  it("resolves rm targets from the hook input's cwd", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [rm("rm -rf ../drafts", "lib"), "ask"],
      [rm("rm -rf drafts", "lib"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("compares targets and the hook input's cwd by where they reach through symlinks", async ({
    expect,
  }) => {
    const { actual, expected } = await decisions([
      [rmFromLink("rm -rf ."), "ask"],
      [rmFromLink("rm -rf drafts"), "ask"],
      [rmFromLink("rm -rf ../drafts", "lib"), "ask"],
      [rmFromLink("find drafts -delete"), "ask"],
      [rm(`rm -rf ${join(fixtureLink(), "drafts")}`), "ask"],
      [rm(`rm -rf ${fixtureLink()}`), "ask"],
      [rmFromLink("rm -rf lib"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("treats find -delete with no filters as rm -r of its roots", async ({ expect }) => {
    const { actual, expected } = await decisions([
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
