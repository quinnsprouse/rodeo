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

  const rewrittenSeeds = probe(`
import { useState } from "react";
export function A({ count = 0 }: { count?: number }) { const [v] = useState(count); return v; }
export function B({ count }: { count: number }) { const [v] = useState(() => count); return v; }
export function C(props: { count: number }) { const { count } = props; const [v] = useState(count); return v; }
export function D({ count: initialCount }: { count: number }) { const [v] = useState(initialCount); return v; }
export function E(props: { count?: number }) { const [v] = useState(() => { return props.count ?? 0; }); return v; }`);
  it("reports a prop with a default, a lazy initializer, a fallback, and props destructured in the body or renamed", () => {
    expect(lint(rewrittenSeeds).map((hit) => hit.message.split("`")[1])).toEqual([
      "count",
      "count",
      "count",
      "count",
      "count",
    ]);
  });

  const seededFromDefaults = probe(`
import { useState } from "react";
export function A({ defaultValue, initialCount }: { defaultValue: number; initialCount: number }) {
  const [v] = useState(defaultValue);
  const [c] = useState(initialCount);
  const [n] = useState(0);
  return v + c + n;
}
export function B({ initialCount: count = 0 }: { initialCount?: number }) {
  const [c] = useState(() => count);
  const [d] = useState(() => Date.now());
  return c + d;
}`);
  it("allows default*/initial* props and unrelated initializers", () => {
    expect(rulesHit(seededFromDefaults)).toEqual([]);
  });
});
