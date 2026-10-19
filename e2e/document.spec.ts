import { expect, test } from "@playwright/test";

import { origin } from "./helpers";

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

test("browser chrome follows the stored theme", async ({ page }) => {
  await page.goto("/");
  const browserChrome = page.locator('meta[name="theme-color"]');
  await expect(browserChrome).toHaveAttribute("content", "#ffffff");

  await page.evaluate(() => localStorage.setItem("rodeo-theme", "dark"));
  await page.reload();
  await expect(browserChrome).toHaveAttribute("content", "#000000");
});

test("each page names its own canonical URL from the configured origin", async ({ page }) => {
  await page.goto("/?utm_source=newsletter");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}/`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${origin}/`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${origin}/og-home.png`,
  );
});

test("a missing page claims no canonical URL", async ({ page }) => {
  await page.goto("/definitely-missing");

  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${origin}/og-home.png`,
  );
});
