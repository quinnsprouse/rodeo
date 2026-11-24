import { appUnitTestReason } from "#tooling/project";

import { type PolicyTopic, type Probe, type RejectedProbe } from "./probe";

const rejected: RejectedProbe[] = [
  {
    name: "conditionals inside tests",
    rule: "vitest(no-conditional-in-test)",
    source: `import { expect, it } from "vite-plus/test";
it("parses", () => {
const value = Number("1");
if (value > 0) expect(value).toBe(1);
});`,
  },
  {
    name: "duplicate test titles",
    rule: "vitest(no-identical-title)",
    source: `import { expect, it } from "vite-plus/test";
it("parses", () => { expect(Number("1")).toBe(1); });
it("parses", () => { expect(Number("2")).toBe(2); });`,
  },
  {
    name: "a fixed sleep in a test",
    rule: "landmines(no-fixed-sleep)",
    file: "fixed-sleep.test.ts",
    source: `import { expect, it } from "vite-plus/test";
it("waits for the write", async () => {
  await new Promise((resolve) => { setTimeout(resolve, 2000); });
  expect(Number("1")).toBe(1);
});`,
  },
  {
    name: "a module mock replacing what the test depends on",
    rule: "landmines(no-test-doubles)",
    file: "module-mock.test.ts",
    source: `import { readFileSync } from "node:fs";
import { expect, it, vi } from "vite-plus/test";
vi.mock("node:fs");
it("reads the file", () => { expect(readFileSync("a")).toBeUndefined(); });`,
  },
  {
    name: "browser tests that retry",
    rule: "landmines(no-flake-masking)",
    layer: "e2e",
    file: "retries.spec.ts",
    source: `import { expect, test } from "../fixtures";
test.describe.configure({ retries: 2 });
test("loads the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Rodeo");
});`,
  },
  {
    name: "an assertion that runs only in a catch block",
    rule: "landmines(no-conditional-expect)",
    file: "catch-expect.test.ts",
    source: `import { it } from "vite-plus/test";
it("rejects bad JSON", ({ expect }) => {
  try {
    JSON.parse("{}");
  } catch (error) {
    expect(error).toBeInstanceOf(SyntaxError);
  }
});`,
  },
  {
    name: "an upper bound on how long the code took",
    rule: "landmines(no-elapsed-time-bound)",
    file: "elapsed-bound.test.ts",
    source: `import { expect, it } from "vite-plus/test";
it("parses quickly", () => {
  const start = Date.now();
  JSON.parse("{}");
  expect(Date.now() - start).toBeLessThan(50);
});`,
  },
  {
    name: "polling a spy until it was called",
    rule: "landmines(no-unsignaled-poll)",
    file: "spy-poll.test.ts",
    source: `import { expect, it, vi } from "vite-plus/test";
it("calls the listener", async () => {
  const listener = vi.fn<() => void>();
  listener();
  await vi.waitFor(() => { expect(listener).toHaveBeenCalled(); });
});`,
  },
  {
    name: "a timeout signal shared by a whole test file",
    rule: "landmines(no-shared-signal)",
    file: "shared-signal.test.ts",
    source: `import { expect, it } from "vite-plus/test";
const deadline = AbortSignal.timeout(5000);
it("is not aborted yet", () => { expect(deadline.aborted).toBe(false); });`,
  },
  {
    name: "a test changing an imported object",
    rule: "landmines(no-imported-mutation)",
    file: "imported-mutation.test.ts",
    source: `import { env } from "node:process";
import { expect, it } from "vite-plus/test";
it("reads the flag", () => {
  env.RODEO_PROBE = "1";
  expect(env.RODEO_PROBE).toBe("1");
});`,
  },
  {
    name: "a module only a test imports, loaded inside the test",
    rule: "landmines(no-cold-import-in-test)",
    file: "cold-import.test.ts",
    source: `import { expect, it } from "vite-plus/test";
it("joins a path", async () => {
  const { join } = await import("node:path");
  expect(join("a", "b")).toBe("a/b");
});`,
  },
  {
    name: "an expected value chosen by branching on the case",
    rule: "landmines(no-parameter-branch)",
    file: "parameter-branch.test.ts",
    source: `import { expect, it } from "vite-plus/test";
it.each([1, 2])("names %i", (value) => {
  expect(value === 1 ? "one" : "other").toBe(String(value) === "1" ? "one" : "other");
});`,
  },
  {
    name: "browser tests that wait a fixed time",
    rule: "landmines(no-fixed-sleep)",
    layer: "e2e",
    file: "timed-wait.spec.ts",
    source: `import { expect, test } from "../fixtures";
test("loads the home page", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500);
  await expect(page).toHaveTitle("Rodeo");
});`,
  },
  {
    name: "browser tests that wait for network idle",
    rule: "landmines(no-fixed-sleep)",
    layer: "e2e",
    file: "network-idle.spec.ts",
    source: `import { expect, test } from "../fixtures";
test("loads the home page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page).toHaveTitle("Rodeo");
});`,
  },
  {
    name: "a fixed wait called through a computed name",
    rule: "playwright(no-wait-for-timeout)",
    layer: "e2e",
    file: "computed-wait.spec.ts",
    source: `import { expect, test } from "../fixtures";
test("loads the home page", async ({ page }) => {
  await page.goto("/");
  await page["waitForTimeout"](500);
  await expect(page).toHaveTitle("Rodeo");
});`,
  },
  {
    name: "network idle written as a template string",
    rule: "playwright(no-networkidle)",
    layer: "e2e",
    file: "template-idle.spec.ts",
    source: `import { expect, test } from "../fixtures";
test("loads the home page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState(\`networkidle\`);
  await expect(page).toHaveTitle("Rodeo");
});`,
  },
  {
    name: "browser tests marked slow",
    rule: "playwright(no-slowed-test)",
    layer: "e2e",
    file: "slowed.spec.ts",
    source: `import { expect, test } from "../fixtures";
test("loads the home page", async ({ page }) => {
  test.slow();
  await page.goto("/");
  await expect(page).toHaveTitle("Rodeo");
});`,
  },
  {
    name: "browser tests importing test and expect from @playwright/test",
    rule: "eslint(no-restricted-imports)",
    layer: "e2e",
    file: "base-test.ts",
    source: `import { expect, test } from "@playwright/test";
test("loads the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Rodeo");
});`,
  },
  {
    name: "unit tests in app code",
    rule: "eslint(no-restricted-imports)",
    help: appUnitTestReason,
    layer: "src/lib",
    source: `import { expect, it } from "vite-plus/test";
it("adds", () => { expect(1 + 1).toBe(2); });`,
  },
];

const allowed: Probe[] = [
  {
    name: "a guardrail test that runs the real tool in each test",
    file: "real-process.test.ts",
    source: `import { execFileSync } from "node:child_process";
import { expect, it } from "vite-plus/test";
it("adds two numbers", () => {
  const printed = execFileSync(process.execPath, ["-p", "1 + 1"], { encoding: "utf8" });
  expect(printed.trim()).toBe("2");
});`,
  },
  {
    name: "a browser test stubbing a browser API to reach an error the browser controls",
    layer: "e2e",
    file: "browser-stub.spec.ts",
    source: `import type { Page } from "@playwright/test";
export async function withoutClipboard(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });
}`,
  },
];

export const testProbes: PolicyTopic = { rejected, allowed };
