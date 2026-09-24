import { expect, test } from "@playwright/test";

test("hashed assets ship compressed and cached for a year", async ({ page, request }) => {
  await page.goto("/");
  const assets = [
    await page.locator('link[rel="stylesheet"]').evaluate((link: HTMLLinkElement) => link.href),
    await page
      .locator('script[type="module"][src]')
      .evaluate((script: HTMLScriptElement) => script.src),
  ];

  const responses = await Promise.all(
    assets.map((asset) => request.get(asset, { headers: { "accept-encoding": "br, gzip" } })),
  );

  for (const response of responses) {
    expect(response.headers()["content-encoding"]).toBe("br");
    expect(response.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  }
});

test("browser chrome follows each color scheme", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]'),
  ).toHaveAttribute("content", "#ffffff");
  await expect(
    page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]'),
  ).toHaveAttribute("content", "#0a0a0a");
});
