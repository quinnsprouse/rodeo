import { describe, it } from "vite-plus/test";

import { bash, guardProject } from "./guard-harness";

const { decisions, reasonFor } = guardProject();

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

  it("denies every other pnpm, yarn, bun, pnpx, and bunx invocation", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("yarn"), "deny"],
      [bash("echo hi && yarn"), "deny"],
      [bash("yarn upgrade"), "deny"],
      [bash("pnpm up"), "deny"],
      [bash("pnpm update"), "deny"],
      [bash("pnpm --filter web add left-pad"), "deny"],
      [bash("pnpm -C pkg add left-pad"), "deny"],
      [bash("pnpm dlx oxlint"), "deny"],
      [bash("pnpm exec vitest"), "deny"],
      [bash("pnpm run build"), "deny"],
      [bash("pnpx eslint ."), "deny"],
      [bash("bunx eslint ."), "deny"],
      [bash("bunx --bun vite"), "deny"],
      [bash("bun test"), "deny"],
      [bash("pnpm help add"), "deny"],
      [bash("npx pnpm install"), "deny"],
      [bash("npx yarn@4 add left-pad"), "deny"],
    ]);
    expect(actual).toEqual(expected);
  });

  it("names npm in the reason it denies another package manager", async ({ expect }) => {
    expect(await reasonFor("pnpm dlx oxlint")).toMatch(/npm-only.*npm install/);
  });

  it("allows tools the project does not pin and package manager queries", async ({ expect }) => {
    const { actual, expected } = await decisions([
      [bash("npx tsx scripts/setup.mjs"), "allow"],
      [bash("pnpm --version"), "allow"],
      [bash("yarn --help"), "allow"],
      [bash("bun -v"), "allow"],
      [bash("pnpm help"), "allow"],
    ]);
    expect(actual).toEqual(expected);
  });
});
