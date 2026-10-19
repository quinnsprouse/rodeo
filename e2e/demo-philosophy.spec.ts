import { expect, test, type Locator, type Page } from "@playwright/test";

import { axeViolations, origin, structuredData, trackBrowserErrors } from "./helpers";

const lastToAppear = [
  { figure: "catch", text: "caught in the pull request" },
  { figure: "token bars", text: "reading docs" },
  { figure: "upkeep chart", text: "a year in" },
  { figure: "rename", text: "isAdmin" },
];

function finalLine(page: Page, text: string) {
  return page.getByText(text, { exact: true }).first();
}

function shownOpacity(line: Locator) {
  return line.evaluate((element) => {
    let opacity = 1;
    for (let node: Element | null = element; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    return opacity;
  });
}

function finalOpacities(page: Page) {
  return Promise.all(lastToAppear.map(({ text }) => shownOpacity(finalLine(page, text))));
}

test("philosophy figures show their final state with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/philosophy");
  await expect.poll(() => finalOpacities(page)).toEqual(lastToAppear.map(() => 1));
});

for (const { figure, text } of lastToAppear) {
  test(`the ${figure} figure plays when scrolled to and settles on its final state`, async ({
    page,
  }) => {
    await page.goto("/philosophy");
    const line = finalLine(page, text);

    await expect.poll(() => shownOpacity(line)).toBe(0);
    await line.scrollIntoViewIfNeeded();
    await expect.poll(() => shownOpacity(line), { timeout: 8000 }).toBe(1);
  });
}

test.describe("server-rendered figures", () => {
  test.use({ javaScriptEnabled: false });

  test("show their final state without JavaScript", async ({ page }) => {
    await page.goto("/philosophy");
    await expect.poll(() => finalOpacities(page)).toEqual(lastToAppear.map(() => 1));
  });
});

test("philosophy contents follow the reader to the last section", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "Philosophy", exact: true }).first().click();
  const contents = page.getByRole("navigation", { name: "Contents" });

  await expect(
    contents.getByRole("link", { name: "Teaching through the codebase" }),
  ).toHaveAttribute("aria-current", "location");
  await contents.getByRole("link", { name: "Acknowledgements" }).click();
  await expect(contents.getByRole("link", { name: "Acknowledgements" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  expect(browserErrors).toHaveLength(0);
});

test("the philosophy page is listed for crawlers and agents", async ({ request }) => {
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    `<loc>${origin}/philosophy</loc>`,
  );
  expect(await (await request.get("/llms.txt")).text()).toContain(`(${origin}/philosophy.md)`);
});

test("agents can read the philosophy page as Markdown", async ({ page, request }) => {
  const negotiated = await request.get("/philosophy", { headers: { accept: "text/markdown" } });
  expect(negotiated.headers()["content-type"]).toContain("text/markdown");
  expect(await negotiated.text()).toMatch(/^# Rodeo Philosophy/);

  await page.goto("/philosophy");
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
    "href",
    `${origin}/philosophy.md`,
  );
});

test("the philosophy page describes itself as an article by its author", async ({ page }) => {
  await page.goto("/philosophy");
  expect(await structuredData(page)).toMatchObject({
    "@type": "Article",
    url: `${origin}/philosophy`,
    datePublished: "2026-10-17",
    author: { sameAs: expect.arrayContaining(["https://x.com/QuinnSprouse"]) },
  });
  await expect(page.locator("article time")).toHaveAttribute("datetime", "2026-10-17");
});

test("the philosophy page names its canonical URL and share image", async ({ page }) => {
  await page.goto("/philosophy?utm_source=newsletter");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${origin}/philosophy`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${origin}/og-rationale.png`,
  );
});

test("the philosophy page paints its card color behind the browser chrome", async ({ page }) => {
  await page.goto("/philosophy");

  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(250, 250, 250)");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#fafafa");
});

test("the old /rationale URL redirects permanently to /philosophy", async ({ request }) => {
  const page = await request.get("/rationale", { maxRedirects: 0 });
  expect(page.status()).toBe(308);
  expect(page.headers().location).toBe("/philosophy");

  const markdown = await request.get("/rationale.md", { maxRedirects: 0 });
  expect(markdown.status()).toBe(308);
  expect(markdown.headers().location).toBe("/philosophy.md");
});

for (const theme of ["light", "dark"] as const) {
  test(`the philosophy page has no WCAG violations in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((stored) => localStorage.setItem("rodeo-theme", stored), theme);
    // why: Axe samples colors mid-animation, so reduced motion renders the settled page.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/philosophy");
    await expect(page.getByRole("heading", { name: "Rodeo Philosophy" })).toBeVisible();

    expect(await axeViolations(page)).toEqual([]);
  });
}
