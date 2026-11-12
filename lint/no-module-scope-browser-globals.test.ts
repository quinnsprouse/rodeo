import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";

const { lint, probe, rulesHit } = ruleProbes();

describe("no-module-scope-browser-globals", () => {
  const moduleScopeReads = probe(`
const saved = localStorage.getItem("x");
const width = window.innerWidth;
const ua = navigator.userAgent;
export { saved, width, ua };`);
  it("reports browser globals read at module scope under the project's env", () => {
    expect(rulesHit(moduleScopeReads)).toEqual([
      "no-module-scope-browser-globals",
      "no-module-scope-browser-globals",
      "no-module-scope-browser-globals",
    ]);
  });

  const rewrittenReads = probe(
    `
export const title = globalThis.document.title;
export const width = (() => window.innerWidth)();
export const dark = matchMedia("(prefers-color-scheme: dark)").matches;
export class Viewport { static width = self.innerWidth; }`,
    "src/lib/probe.ts",
  );
  it("reports reads through globalThis, an immediately invoked function, and a static field", () => {
    expect(lint(rewrittenReads).map((hit) => hit.message.split("`")[1])).toEqual([
      "globalThis.document",
      "window",
      "matchMedia",
      "self",
    ]);
  });

  const guardedReads = probe(`
const isBrowser = typeof window !== "undefined";
const hasDocument = typeof globalThis.document !== "undefined";
export function read() { return localStorage.getItem("x"); }
export const handler = () => document.title;
export function shadow(document: string) { return document; }
export const config = { window: 1, location: "/" };
const history: string[] = [];
export const visits = history.length;
export class Viewport { width = window.innerWidth; }
export type Win = typeof window;
export const saved = typeof window === "undefined" ? null : localStorage.getItem("x");
export const lang = typeof navigator !== "undefined" && navigator.language;
if (typeof document !== "undefined") document.title = "x";
export { isBrowser, hasDocument };`);
  it("allows reads behind a typeof guard, in functions and instance fields, and of declared names", () => {
    expect(rulesHit(guardedReads)).toEqual([]);
  });
});
