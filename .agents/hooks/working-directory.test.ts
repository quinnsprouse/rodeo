import { basename, join } from "node:path";

import { describe, it } from "vite-plus/test";

import { guardGitFixture, guardProject } from "./guard-harness";
import { unknownDirectory } from "./working-directory.mjs";

const { decisions, reasons } = guardProject();
const { fixture, outside, rm } = guardGitFixture();

const deletesProject = /project root/;

describe.concurrent("working directory", { timeout: 30_000 }, () => {
  it("follows cd and pushd to judge the commands after them", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [rm(`cd .. && rm -rf ${basename(fixture())}`), "ask"],
      [rm("cd app && rm -rf routes"), "ask"],
      [rm("cd app && git checkout routes"), "ask"],
      [rm("cd app/routes && rm -rf ../../drafts"), "ask"],
      [rm("pushd app && rm -rf routes"), "ask"],
      [rm("cd dist && rm -rf ."), "allow"],
      [rm("cd node_modules/pkg && rm -rf ."), "allow"],
      [rm(`cd ${outside()} && rm -rf .`), "allow"],
      [rm("cd dist; rm -rf ./*"), "allow"],
      [rm("cd lib && cd .. && rm -rf drafts"), "ask"],
      [rm("cd -- dist && find . -delete"), "allow"],
      [rm("cd app && bash -c 'rm -rf routes'"), "ask"],
      [rm("cd app && echo $(rm -rf routes)"), "ask"],
      [rm("cd app && git checkout main"), "allow"],
      [rm("pushd lib && popd && rm -rf drafts"), "ask"],
      [rm("pushd drafts && popd && rm -rf lib"), "allow"],
      [rm("{ cd dist; rm -rf .; }"), "allow"],
      [rm("eval 'cd dist' && rm -rf ."), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("keeps a cd in a subshell, a pipeline stage, or the background to that command", async ({
    expect,
  }) => {
    const { actual, expected } = await decisions([
      [rm("(cd dist && rm -rf .)"), "allow"],
      [rm("(cd dist && rm -rf .) && rm -rf ."), "ask"],
      [rm("(cd lib; (cd ../dist); rm -rf ../drafts)"), "ask"],
      [rm("cd dist | cat; rm -rf ."), "ask"],
      [rm("echo | cd dist; rm -rf ."), "ask"],
      [rm("cd dist & rm -rf ."), "ask"],
      [rm("bash -c 'cd dist' && rm -rf ."), "ask"],
      [rm("echo $(cd dist) && rm -rf ."), "ask"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("asks before a relative delete or discard in a directory it cannot know", async ({
    expect,
  }) => {
    const unknown = [
      'cd "$TARGET" && rm -rf build',
      "cd $(git rev-parse --show-toplevel) && rm -rf drafts",
      "cd `dirname x` && find . -delete",
      "cd - && rm -rf lib",
      "popd && rm -rf lib",
      "cd missing; rm -rf .",
      "cd $TARGET && git checkout main",
    ];
    const { actual, expected } = await decisions([
      ...unknown.map((command): [ReturnType<typeof rm>, "ask"] => [rm(command), "ask"]),
      [rm(`cd "$TARGET" && rm -rf ${join(outside(), "x")}`), "allow"],
      [rm('cd "$TARGET" && rm -rf "$OTHER"'), "allow"],
      [rm(`cd "$TARGET" && cd ${join(fixture(), "dist")} && rm -rf .`), "allow"],
      [rm('cd "$TARGET" && git checkout -'), "allow"],
      [rm('cd "$TARGET" && git status'), "allow"],
    ]);
    expect(actual).toEqual(expected);
    expect(await reasons(unknown.map((command) => rm(command)))).toEqual(
      unknown.map(() => unknownDirectory.reason),
    );
  });

  it("gives a delete the reason for the directory it reaches", async ({ expect }) => {
    const [parent, dist] = await reasons([
      rm(`cd .. && rm -rf ${basename(fixture())}`),
      rm("cd dist && rm -rf ."),
    ]);
    expect(parent).toMatch(deletesProject);
    expect(dist).toBe("");
  });
});
