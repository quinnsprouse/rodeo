import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";
import type { RodeoRuleName } from "./rodeo-rules";

const { probe, rulesHit } = ruleProbes();

describe("no-window-navigation", () => {
  const hardNavigations = probe(`
export function go() {
  window.location.href = "/a";
  location.href = "/b";
  window.location = "/c" as unknown as Location;
  window.location.assign("/d");
  location.replace("/e");
}`);
  it("reports hard navigations", () => {
    expect(rulesHit(hardNavigations)).toEqual(Array<RodeoRuleName>(5).fill("no-window-navigation"));
  });

  const locationRead = probe(`export const path = () => window.location.pathname;`);
  it("allows reading location", () => {
    expect(rulesHit(locationRead)).toEqual([]);
  });
});
