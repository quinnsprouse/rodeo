import { appUnitTestReason } from "#tooling/project";

import { type PolicyTopic, type RejectedProbe } from "./probe";

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

export const testProbes: PolicyTopic = { rejected };
