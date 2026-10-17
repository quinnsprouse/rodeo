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

test("browser chrome follows the chosen theme", async ({ page }) => {
  await page.goto("/");
  const browserChrome = page.locator('meta[name="theme-color"]');

  await expect(browserChrome).toHaveAttribute("content", "#ffffff");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(browserChrome).toHaveAttribute("content", "#000000");

  await page.reload();
  await expect(browserChrome).toHaveAttribute("content", "#000000");
});

test("the philosophy page paints its card color behind the browser chrome", async ({ page }) => {
  await page.goto("/rationale");

  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(250, 250, 250)");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#fafafa");
});

test("each page names its own canonical URL from the configured origin", async ({ page }) => {
  await page.goto("/example?demo=error");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://rodeo.example/example",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://rodeo.example/example",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://rodeo.example/og-home.png",
  );
});

test("a missing page claims no canonical URL", async ({ page }) => {
  await page.goto("/definitely-missing");

  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://rodeo.example/og-home.png",
  );
});
