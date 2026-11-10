import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

import {
  appUnitTestReason,
  docReason,
  isAllowedDoc,
  isAppUnitTest,
  isMarkdown,
} from "#tooling/project";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const listing = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
  cwd: repoRoot,
  encoding: "utf8",
});
const isGitRepository = listing.status === 0;
const files = isGitRepository ? listing.stdout.split("\0").filter((file) => file !== "") : [];

const misplacedDocs = files.filter((file) => isMarkdown(file) && !isAllowedDoc(file));
const appUnitTests = files.filter((file) => isAppUnitTest(file));

describe.skipIf(!isGitRepository)("Repository layout", () => {
  it("keeps Markdown in docs/agents, gui, the root docs, and agent config", () => {
    expect(misplacedDocs, `Move or delete each file listed here. ${docReason}`).toEqual([]);
  });

  it("keeps unit tests out of src", () => {
    expect(appUnitTests, `Delete each test listed here. ${appUnitTestReason}`).toEqual([]);
  });
});
