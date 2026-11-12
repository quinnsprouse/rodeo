import { cpSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";
import { versions } from "vite-plus/versions";
import * as z from "zod/mini";

import { run } from "#tooling/run";

import { repoRoot, withSandbox } from "./harness";

const manifest = z
  .looseObject({
    devDependencies: z.record(z.string(), z.string()),
    overrides: z.looseObject({ vite: z.string() }),
  })
  .parse(JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")));
const toolchainCheck = join("scripts", "check-toolchain.mjs");
const sandboxes = withSandbox();

type Pins = Record<string, string>;

async function checkToolchainWith(devDependencies: Pins, overrides: Pins) {
  const root = sandboxes.temporary("rodeo-toolchain-");
  mkdirSync(join(root, "scripts"));
  cpSync(join(repoRoot, toolchainCheck), join(root, toolchainCheck));
  symlinkSync(join(repoRoot, "node_modules"), join(root, "node_modules"), "dir");
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      ...manifest,
      devDependencies: { ...manifest.devDependencies, ...devDependencies },
      overrides: { ...manifest.overrides, ...overrides },
    }),
  );
  const { status, stderr } = await run(process.execPath, [join(root, toolchainCheck)], {
    cwd: root,
  });
  const named = Object.keys(versions).filter((tool) =>
    stderr.includes(`devDependencies.${tool}: `),
  );
  return { status, named };
}

describe("The toolchain check", { timeout: 30_000 }, () => {
  it("names each tool Vite+ ships that package.json installs, unless an override pins the version Vite+ ships", async () => {
    const tools = Object.keys(versions);
    const installedAtShippedVersion = { rolldown: versions.rolldown };
    const pinnedAsShipped = { vite: manifest.overrides.vite, oxlint: versions.oxlint };
    const pinnedElsewhere = { oxfmt: "1.0.0" };
    expect(
      await checkToolchainWith(
        {
          ...Object.fromEntries(tools.map((tool) => [tool, "*"])),
          ...installedAtShippedVersion,
          ...pinnedAsShipped,
          ...pinnedElsewhere,
        },
        { ...pinnedAsShipped, ...pinnedElsewhere },
      ),
    ).toEqual({ status: 1, named: tools.filter((tool) => !Object.hasOwn(pinnedAsShipped, tool)) });
  });
});
