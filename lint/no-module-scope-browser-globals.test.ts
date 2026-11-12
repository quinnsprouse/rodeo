import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";

const { probe, rulesHit } = ruleProbes();

describe("no-module-scope-browser-globals", () => {
  const moduleScopeReads = probe(`
const saved = localStorage.getItem("x");
const width = window.innerWidth;
const ua = navigator.userAgent;
export { saved, width, ua };`);
  it("reports browser globals read at module scope", () => {
    expect(rulesHit(moduleScopeReads)).toEqual([
      "no-module-scope-browser-globals",
      "no-module-scope-browser-globals",
      "no-module-scope-browser-globals",
    ]);
  });

  const guardedReads = probe(`
const isBrowser = typeof window !== "undefined";
export function read() { return localStorage.getItem("x"); }
export const handler = () => document.title;
export function shadow(document: string) { return document; }
export const config = { window: 1, location: "/" };
export { isBrowser };`);
  it("allows typeof guards, function bodies, and shadowed names", () => {
    expect(rulesHit(guardedReads)).toEqual([]);
  });
});
