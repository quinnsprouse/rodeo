import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";
import type { RodeoRuleName } from "./rodeo-rules";

const { lint, probe, rulesHit } = ruleProbes();

describe("no-import-meta-env", () => {
  const envReads = probe(`export const a = import.meta.env.VITE_APP_URL;
export const b = import.meta.env["VITE_KEY"];
export const { VITE_X } = import.meta.env;
export const c = import.meta["env"].VITE_KEY;
const { env } = import.meta;
export const d = env;`);
  it("reports VITE_* reads and whole-object reads", () => {
    const hits = lint(envReads);

    expect(hits.map((hit) => hit.rule)).toEqual(Array<RodeoRuleName>(5).fill("no-import-meta-env"));
    expect(hits.map((hit) => hit.message)).toEqual(
      Array<unknown>(5).fill(
        expect.stringContaining("Vite's built-in flags (DEV, PROD, SSR, MODE, BASE_URL)"),
      ),
    );
  });

  const rewrittenReads = probe(`const meta = import.meta;
export const a = meta.env.VITE_APP_URL;
export const { DEV, VITE_KEY } = import.meta.env;
const {
  env: { VITE_X },
} = import.meta;
export { VITE_X };`);
  it("reports reads through an alias of import.meta and destructuring that mixes in VITE_* keys", () => {
    expect(rulesHit(rewrittenReads)).toEqual(Array<RodeoRuleName>(3).fill("no-import-meta-env"));
  });

  const builtInFlags = probe(`export const moduleUrl = import.meta.url;
export const flags = [
  import.meta.env.DEV,
  import.meta.env.PROD,
  import.meta.env.SSR,
  import.meta.env.MODE,
  import.meta.env.BASE_URL,
];
export const { DEV, MODE } = import.meta.env;
const {
  env: { PROD },
} = import.meta;
const meta = import.meta;
export const viaAlias = [meta.url, meta.env.SSR, PROD];`);
  it("allows Vite's built-in flags, read directly, destructured, or through an alias", () => {
    expect(rulesHit(builtInFlags)).toEqual([]);
  });
});
