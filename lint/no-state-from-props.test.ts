import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";

const { lint, probe, rulesHit } = ruleProbes();

describe("no-state-from-props", () => {
  const seededFromProps = probe(`
import { useState } from "react";
export function A({ value }: { value: number }) { const [v] = useState(value); return v; }
export function B(props: { count: number }) { const [c] = useState(props.count); return c; }`);
  it("reports state seeded from a destructured or dotted prop", () => {
    const hits = lint(seededFromProps);

    expect(hits.map((hit) => hit.rule)).toEqual(["no-state-from-props", "no-state-from-props"]);
    expect(hits.map((hit) => hit.message)).toEqual(
      Array<unknown>(2).fill(expect.stringContaining("Props named default*/initial* are exempt")),
    );
  });

  const seededFromDefaults = probe(`
import { useState } from "react";
export function A({ defaultValue, initialCount }: { defaultValue: number; initialCount: number }) {
  const [v] = useState(defaultValue);
  const [c] = useState(initialCount);
  const [n] = useState(0);
  return v + c + n;
}`);
  it("allows default*/initial* props and unrelated initializers", () => {
    expect(rulesHit(seededFromDefaults)).toEqual([]);
  });
});
