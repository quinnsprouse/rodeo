import { describe, expect, it } from "vite-plus/test";

import { run } from "#tooling/run";

import { repoRoot } from "./harness";

describe("scripts/remove-demo.mjs", () => {
  it("finds every path and reference it removes, so removing the demo would succeed", async () => {
    const check = await run(process.execPath, ["scripts/remove-demo.mjs", "--check"], {
      cwd: repoRoot,
    });

    expect({ status: check.status, output: check.output }).toEqual({ status: 0, output: "" });
  });
});
