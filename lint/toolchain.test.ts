import { cpSync, mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
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
type Overrides = Record<string, string | Pins>;

function installWithOxlint(root: string, version: string) {
  const installed = join(repoRoot, "node_modules");
  const modules = join(root, "node_modules");
  mkdirSync(join(modules, "oxlint"), { recursive: true });
  writeFileSync(join(modules, "oxlint", "package.json"), JSON.stringify({ version }));
  for (const name of readdirSync(installed).filter((entry) => entry !== "oxlint")) {
    symlinkSync(join(installed, name), join(modules, name));
  }
}

async function checkToolchainWith(
  devDependencies: Pins,
  overrides: Overrides,
  installedOxlint: string = versions.oxlint,
) {
  const root = sandboxes.temporary("rodeo-toolchain-");
  mkdirSync(join(root, "scripts"));
  cpSync(join(repoRoot, toolchainCheck), join(root, toolchainCheck));
  installWithOxlint(root, installedOxlint);
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

  it("fails when the vite override pins a core other than the one Vite+ depends on", async () => {
    const driftedCore = `${manifest.overrides.vite}1`;
    expect(await checkToolchainWith({}, { vite: driftedCore })).toMatchObject({ status: 1 });
    expect(await checkToolchainWith({}, {})).toMatchObject({ status: 0 });
  });

  it("fails when a lint plugin is pinned to an Oxlint other than the one Vite+ ships", async () => {
    expect(await checkToolchainWith({}, { outtrue: { oxlint: "1.0.0" } })).toMatchObject({
      status: 1,
    });
    expect(await checkToolchainWith({}, { outtrue: { oxlint: versions.oxlint } })).toMatchObject({
      status: 0,
    });
  });

  it("fails when the Oxlint at the top of node_modules is not the one Vite+ ships", async () => {
    expect(await checkToolchainWith({}, {}, "1.81.0")).toMatchObject({ status: 1 });
  });
});
