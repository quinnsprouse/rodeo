import { describe, expect, it } from "vite-plus/test";

import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("handles falsy values", () => {
    const isHidden = false;
    expect(cn("base", isHidden && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});
