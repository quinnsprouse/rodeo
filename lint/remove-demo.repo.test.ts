import { describe, expect, it } from "vite-plus/test";

import { preflightProblems } from "#tooling/demo-removal";

describe("scripts/remove-demo.mjs", () => {
  it("finds every path and reference it removes, so removing the demo would succeed", () => {
    expect(preflightProblems()).toEqual([]);
  });
});
