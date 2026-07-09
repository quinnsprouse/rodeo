import { describe, expect, it } from "vite-plus/test";

import { createSiteHead, normalizeSiteUrl } from "./site";

describe("site identity", () => {
  it("omits origin-dependent tags when no public URL is configured", () => {
    const head = createSiteHead("/docs?ignored=true", "");

    expect(head.links).not.toContainEqual(expect.objectContaining({ rel: "canonical" }));
    expect(head.meta).not.toContainEqual(expect.objectContaining({ property: "og:url" }));
    expect(head.meta).not.toContainEqual(expect.objectContaining({ property: "og:image" }));
  });

  it("creates normalized route-aware canonical and social URLs", () => {
    const head = createSiteHead("/docs?ignored=true", "https://example.com/path/");

    expect(head.links).toContainEqual({ rel: "canonical", href: "https://example.com/docs" });
    expect(head.meta).toContainEqual({ property: "og:url", content: "https://example.com/docs" });
    expect(head.meta).toContainEqual({
      property: "og:image",
      content: "https://example.com/og-image.png",
    });
  });

  it("rejects non-http public URLs", () => {
    expect(() => normalizeSiteUrl("file:///tmp/rodeo")).toThrow(
      "VITE_APP_URL must use http or https.",
    );
  });
});
