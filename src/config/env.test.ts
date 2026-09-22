import { describe, expect, it } from "vite-plus/test";

import { parseClientEnv } from "./env";

describe("client environment", () => {
  it("treats a blank public URL as unset", () => {
    expect(parseClientEnv({ VITE_APP_URL: " " })).toEqual({});
  });

  it("reduces the public URL to its origin", () => {
    expect(parseClientEnv({ VITE_APP_URL: "https://example.com/path/" })).toEqual({
      VITE_APP_URL: "https://example.com",
    });
  });

  it("names the variable when a value is invalid", () => {
    expect(() => parseClientEnv({ VITE_APP_URL: "file:///tmp/rodeo" })).toThrow(/VITE_APP_URL/);
  });
});
