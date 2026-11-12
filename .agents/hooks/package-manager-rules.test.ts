import { describe, it } from "vite-plus/test";

import { bash, guardProject } from "./guard-harness";

const { decisions } = guardProject();

describe.concurrent("package manager rules", { timeout: 30_000 }, () => {
  it("denies foreign package managers and one-off tool downloads", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("pnpm add left-pad"), "deny"],
      [bash("yarn install"), "deny"],
      [bash("npx oxlint src"), "deny"],
      [bash("npx oxlint@1.2.3 src"), "deny"],
      [bash("npx -y prettier --check ."), "deny"],
      [bash("bun install"), "deny"],
      [bash("yarn --silent add left-pad"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("allows tools the project does not pin and package manager queries", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("npx tsx scripts/setup.mjs"), "allow"],
      [bash("pnpm --version"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });
});
