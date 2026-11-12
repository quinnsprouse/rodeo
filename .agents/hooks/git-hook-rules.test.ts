import { describe, it } from "vite-plus/test";

import { bash, guardProject } from "./guard-harness";

const { decisions } = guardProject();

describe.concurrent("Git hook and history rules", { timeout: 30_000 }, () => {
  it("denies hook bypasses", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash('git commit -m "feat: x" --no-verify'), "deny"],
      [bash("git commit -n -m x"), "deny"],
      [bash('git commit -nm "feat: x"'), "deny"],
      [bash("git push --no-verify origin HEAD"), "deny"],
      [bash('git -c core.hooksPath=/dev/null commit -m "feat: x"'), "deny"],
      [bash("git config core.hooksPath .nowhere"), "deny"],
      [bash('HUSKY=0 git commit -m "feat: x"'), "deny"],
      [bash("VITE_GIT_HOOKS=0 git push"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("denies hook bypasses behind abbreviations, flag clusters, and config forms", async ({
    expect,
  }) => {
    const { actual, expected } = await decisions([
      [bash("git merge --no-verify"), "deny"],
      [bash("git commit --no-verif -m x"), "deny"],
      [bash("husky=0 git commit -m x"), "deny"],
      [bash("git config --unset core.hooksPath"), "deny"],
      [bash("git config --global --add core.hooksPath x"), "deny"],
      [bash("git config set core.hooksPath x"), "deny"],
      [bash("git config unset core.hooksPath"), "deny"],
      [bash('git commit -anm "x"'), "deny"],
      [bash('git -c "core.hooksPath=/dev/null" commit -m x'), "deny"],
      [bash("git -c core.hookspath=x push"), "deny"],
      [bash("GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=x git commit -m x"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("reads commit messages, config reads, and quoted arguments as data", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("git config --get core.hooksPath"), "allow"],
      [bash("git config get core.hooksPath"), "allow"],
      [bash("git config core.hooksPath"), "allow"],
      [bash('grep -rn "core.hooksPath" scripts'), "allow"],
      [bash('git commit -m "docs(hooks): explain why -n is blocked"'), "allow"],
      [bash('git commit -m "feat: add push -f guard"'), "allow"],
      [bash('git commit -m "-n is a dry run"'), "allow"],
      [bash('git commit -am "feat: x"'), "allow"],
      [bash("git commit -uno -m x"), "allow"],
      [bash("git -c color.ui=never commit -m x"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("asks before a force push, and allows one guarded by a lease", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("git push --force origin main"), "ask"],
      [bash("git push -f"), "ask"],
      [bash("git push origin +main"), "ask"],
      [bash("git push -uf origin main"), "ask"],
      [bash("git push --force-if-includes --force-with-lease origin HEAD"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });
});
