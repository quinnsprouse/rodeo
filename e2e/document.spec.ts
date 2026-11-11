import { expect, test } from "./fixtures";

test("hashed assets ship compressed and cached for a year", async ({ page, request }) => {
  await page.goto("/");
  const stylesheets = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links: HTMLLinkElement[]) => links.map((link) => link.href));
  const scripts = await page
    .locator('script[type="module"][src]')
    .evaluateAll((elements: HTMLScriptElement[]) => elements.map((script) => script.src));
  expect(stylesheets, "The page loads a stylesheet").not.toEqual([]);
  expect(scripts, "The page loads a module script").not.toEqual([]);

  const responses = await Promise.all(
    [...stylesheets, ...scripts].map(async (asset) => {
      const response = await request.get(asset, { headers: { "accept-encoding": "br, gzip" } });
      const headers = response.headers();
      return {
        asset,
        encoding: headers["content-encoding"],
        caching: headers["cache-control"],
      };
    }),
  );

  expect(responses).toEqual(
    [...stylesheets, ...scripts].map((asset) => ({
      asset,
      encoding: "br",
      caching: "public, max-age=31536000, immutable",
    })),
  );
});
