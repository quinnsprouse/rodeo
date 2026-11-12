import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";

const { lint, probe, rulesHit } = ruleProbes();

describe("no-disable-directives", () => {
  const directives = probe(`/* oxlint-disable */
// oxlint-disable-next-line no-restricted-imports
const a = 1;
/* eslint-disable */
const b = 2; // oxlint-disable-line
export { a, b };`);
  it("reports every directive at the top of the file so no directive can hide itself", () => {
    const hits = lint(directives);
    expect(hits.map((hit) => hit.line)).toEqual([1, 1, 1, 1]);
    expect(hits.map((hit) => hit.message)).toEqual([
      expect.stringMatching(
        /Line 1 has an inline lint suppression \(oxlint-disable\).+lint\/exceptions\.ts/,
      ),
      expect.stringContaining("Line 2 has an inline lint suppression (oxlint-disable-next-line)"),
      expect.stringContaining("Line 4 has an inline lint suppression (eslint-disable)"),
      expect.stringContaining("Line 5 has an inline lint suppression (oxlint-disable-line)"),
    ]);
  });

  const lintMention = probe(
    `// why: Disabled features are listed in the docs.\nexport const a = 1;`,
    "scripts/probe.ts",
  );
  it("ignores ordinary comments that mention linting", () => {
    expect(rulesHit(lintMention)).toEqual([]);
  });
});
