import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";
import type { RodeoRuleName } from "./rodeo-rules";

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

  const rewrittenReads = probe(`
import { createServerFn } from "@tanstack/react-start";
export const a = createServerFn({ method: "POST" }).handler(async (ctx) => { const { data } = ctx; return String(data); });
export const b = createServerFn({ method: "POST" }).handler((ctx) => ctx["data"]);
export const c = createServerFn({ method: "POST" }).handler(function (ctx) { const { data: input } = ctx; return input; });
const readInput = ({ data }: { data: unknown }) => data;
export const d = createServerFn({ method: "POST" }).handler(readInput);
function readContext(ctx: { data: unknown }) { return ctx.data; }
export const e = createServerFn({ method: "POST" }).handler(readContext);`);
  it("reports data taken by destructuring in the body, a computed key, or a named handler", () => {
    expect(rulesHit(rewrittenReads)).toEqual(
      Array<RodeoRuleName>(5).fill("server-fn-requires-validator"),
    );
  });

  const validated = probe(`
import { createServerFn } from "@tanstack/react-start";
export const a = createServerFn({ method: "POST" }).validator((d: unknown) => d).handler(({ data }) => data);
export const b = createServerFn({ method: "POST" }).inputValidator((d: unknown) => d).handler(({ data }) => data);
export const c = createServerFn({ method: "GET" }).handler(() => "ok");
export const d = createServerFn({ method: "GET" }).handler(({ context }) => context);
export const e = createServerFn({ method: "GET" }).handler((ctx) => { const { context } = ctx; return context; });
const health = () => "ok";
export const f = createServerFn({ method: "GET" }).handler(health);`);
  it("allows validated handlers and handlers that ignore input", () => {
    expect(rulesHit(validated)).toEqual([]);
  });
});
