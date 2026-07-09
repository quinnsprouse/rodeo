import { describe, expect, it } from "vite-plus/test";

import { resolveStarterStatus, validateStarterStatusInput } from "./starter-status";

describe("starter status", () => {
  it("returns the ready contract", () => {
    expect(resolveStarterStatus({ fail: false })).toEqual({
      state: "ready",
      message: "Route loader and server function are connected.",
    });
  });

  it("surfaces the requested server failure", () => {
    expect(() => resolveStarterStatus({ fail: true })).toThrow(
      "The starter server function failed as requested.",
    );
  });

  it("preserves valid server-function input", () => {
    expect(validateStarterStatusInput({ fail: false })).toEqual({ fail: false });
  });
});
