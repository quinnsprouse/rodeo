import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";

import {
  appUnitTestReason,
  docReason,
  ignoredDirectories,
  isAllowedDoc,
  isAppUnitTest,
  isMarkdown,
  scratchDirectory,
} from "#tooling/project";

import { ignoredByGit, repoRoot } from "./harness";

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
});
