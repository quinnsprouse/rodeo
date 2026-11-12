import { describe, it } from "vite-plus/test";

import { bash, guardProject } from "./guard-harness";

const { decisions, reasonFor } = guardProject();

describe.concurrent("simple command resolution", { timeout: 30_000 }, () => {
  it("reads assignments made through env and declarations", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("env HUSKY=0 git commit -m x"), "deny"],
      [bash("export HUSKY=0"), "deny"],
      [bash("export VITE_GIT_HOOKS=0 && git push"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("checks commands that xargs and find -exec run", async ({ expect }) => {
    const { actual, expected } = await decisions([
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
    expect(await reasonFor("ls | xargs rm -rf")).toContain(
      "targets from xargs or find at run time",
    );
  });

  it("passes harmless commands under xargs and find -exec", async ({ expect }) => {
    const { actual, expected } = await decisions([
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
});
