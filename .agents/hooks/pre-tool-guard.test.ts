import { describe, it } from "vite-plus/test";

import { bash, guardProject } from "./guard-harness";

const { decisions, sameVerdicts } = guardProject();

describe.concurrent("pre-tool guard", { timeout: 30_000 }, () => {
  it("checks every command in a script, and lets a deny win over an ask", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("echo ok && git commit -n -m x"), "deny"],
      [bash("git push --force && git commit --no-verify -m x"), "deny"],
      [bash("git reset --hard; pnpm add left-pad"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("gives a routed command the verdict it gets when typed", async ({ expect }) => {
    const { actual, expected } = await sameVerdicts([
      ["git push --force", 'echo "git push --force" | bash'],
      ["git reset --hard", `printf '%s\\n' "git reset --hard" | sh`],
      ["git commit --no-verify -m x", "git diff --name-only | xargs git commit --no-verify -m x"],
      ["git checkout -- src", "git ls-files -m | xargs git checkout --"],
      ["git reset --hard", "find src -execdir git reset --hard ';'"],
      ["pnpm add left-pad", "echo left-pad | xargs pnpm add"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("allows ordinary commands", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash('git commit -m "feat: normal"'), "allow"],
      [bash("git push origin HEAD"), "allow"],
      [bash("git push --force-with-lease origin HEAD"), "allow"],
      [bash("git push -n origin HEAD"), "allow"],
      [bash('git commit --amend -m "feat: normal"'), "allow"],
      [bash("git push --follow-tags"), "allow"],
      [bash("npm run check"), "allow"],
      [bash("npm install"), "allow"],
      [bash("vp lint src"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });
});
