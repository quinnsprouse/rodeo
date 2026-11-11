import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join, matchesGlob } from "node:path";

import { describe, expect, it } from "vite-plus/test";
import { versions } from "vite-plus/versions";
import * as z from "zod/mini";

import {
  appUnitTestReason,
  docReason,
  generatedGlobs,
  ignoredDirectories,
  isAllowedDoc,
  isAppUnitTest,
  isGeneratedPath,
  isMarkdown,
  scratchDirectory,
} from "#tooling/project";
import { run } from "#tooling/run";

import { ignoredByGit, repoRoot, withSandbox } from "./harness";

const ignored = new Set(ignoredDirectories);

function filesGitWouldCommit() {
  const listing = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: repoRoot, encoding: "utf8" },
  );
  return listing.status === 0 ? listing.stdout.split("\0").filter((file) => file !== "") : null;
}

function filesOnDisk(directory = ""): string[] {
  return readdirSync(join(repoRoot, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = directory === "" ? entry.name : `${directory}/${entry.name}`;
    if (!entry.isDirectory()) return [path];
    return ignored.has(entry.name) ? [] : filesOnDisk(path);
  });
}

const files = filesGitWouldCommit() ?? filesOnDisk();
const misplacedDocs = files.filter((file) => isMarkdown(file) && !isAllowedDoc(file));
const appUnitTests = files.filter((file) => isAppUnitTest(file));
const scratchNote = `${scratchDirectory}/plan.md`;

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

describe("Repository layout", () => {
  it("keeps Markdown where the doc policy allows it", () => {
    expect(misplacedDocs, `Move or delete each file listed here. ${docReason}`).toEqual([]);
  });

  it("keeps unit tests out of app code", () => {
    expect(appUnitTests, `Delete each test listed here. ${appUnitTestReason}`).toEqual([]);
  });

  it("keeps the scratch directory, where the doc policy sends notes, out of Git", async () => {
    expect(isAllowedDoc(scratchNote)).toBe(true);
    expect(await ignoredByGit([scratchNote])).toEqual([scratchNote]);
  });

  it("names the same generated files by path and by glob", () => {
    expect(files.filter((file) => isGeneratedPath(file))).toEqual(
      files.filter((file) => generatedGlobs.some((glob) => matchesGlob(file, glob))),
    );
  });
});

describe("The toolchain check", () => {
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
