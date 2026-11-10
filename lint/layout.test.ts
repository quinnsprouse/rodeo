import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

type PathTest = (path: string) => boolean;
type DocPolicy = {
  isMarkdown: PathTest;
  isAllowedDoc: PathTest;
  isAppUnitTest: PathTest;
  docReason: string;
  appUnitTestReason: string;
};

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const policyPath = join(repoRoot, ".agents", "hooks", "doc-policy.mjs");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPathTest(value: unknown): value is PathTest {
  return typeof value === "function";
}

function docPolicy(policyModule: unknown): DocPolicy {
  if (!isRecord(policyModule)) throw new Error(`${policyPath} did not load as a module`);
  const { isMarkdown, isAllowedDoc, isAppUnitTest, docReason, appUnitTestReason } = policyModule;
  if (
    isPathTest(isMarkdown) &&
    isPathTest(isAllowedDoc) &&
    isPathTest(isAppUnitTest) &&
    typeof docReason === "string" &&
    typeof appUnitTestReason === "string"
  ) {
    return { isMarkdown, isAllowedDoc, isAppUnitTest, docReason, appUnitTestReason };
  }
  throw new Error(`${policyPath} no longer exports the doc and unit test policy`);
}

const policyModule: unknown = await import(policyPath);
const policy = docPolicy(policyModule);

const listing = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
  cwd: repoRoot,
  encoding: "utf8",
});
const isGitRepository = listing.status === 0;
const files = isGitRepository ? listing.stdout.split("\0").filter((file) => file !== "") : [];

const misplacedDocs = files.filter((file) => policy.isMarkdown(file) && !policy.isAllowedDoc(file));
const appUnitTests = files.filter((file) => policy.isAppUnitTest(file));

describe.skipIf(!isGitRepository)("Repository layout", () => {
  it("keeps Markdown in docs/agents, gui, the root docs, and agent config", () => {
    expect(misplacedDocs, `Move or delete each file listed here. ${policy.docReason}`).toEqual([]);
  });

  it("keeps unit tests out of src", () => {
    expect(appUnitTests, `Delete each test listed here. ${policy.appUnitTestReason}`).toEqual([]);
  });
});
