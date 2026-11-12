import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";

const { probe, rulesHit } = ruleProbes();

describe("server-fn-requires-validator", () => {
  const unvalidated = probe(`
import { createServerFn } from "@tanstack/react-start";
export const a = createServerFn({ method: "POST" }).handler(({ data }) => data);
export const b = createServerFn().handler((ctx) => ctx.data);`);
  it("reports handlers that read data without a validator", () => {
    expect(rulesHit(unvalidated)).toEqual([
      "server-fn-requires-validator",
      "server-fn-requires-validator",
    ]);
  });

  const validated = probe(`
import { createServerFn } from "@tanstack/react-start";
export const a = createServerFn({ method: "POST" }).validator((d: unknown) => d).handler(({ data }) => data);
export const b = createServerFn({ method: "POST" }).inputValidator((d: unknown) => d).handler(({ data }) => data);
export const c = createServerFn({ method: "GET" }).handler(() => "ok");
export const d = createServerFn({ method: "GET" }).handler(({ context }) => context);`);
  it("allows validated handlers and handlers that ignore input", () => {
    expect(rulesHit(validated)).toEqual([]);
  });
});
