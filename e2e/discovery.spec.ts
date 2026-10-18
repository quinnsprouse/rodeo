import { expect, test, type Page } from "@playwright/test";

const origin = "https://rodeo.example";

async function structuredData(page: Page): Promise<unknown> {
  return JSON.parse(String(await page.locator('script[type="application/ld+json"]').textContent()));
}

test("robots.txt points crawlers at a sitemap of every page", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
  const pages = await sitemap.text();
  expect(pages).toContain(`<loc>${origin}/</loc>`);
  expect(pages).toContain(`<loc>${origin}/rationale</loc>`);
});

test("llms.txt links every page as Markdown and the agent rules", async ({ request }) => {
  const response = await request.get("/llms.txt");
  const index = await response.text();

  expect(index).toMatch(/^# Rodeo\n/);
  expect(index).toContain(`(${origin}/index.md)`);
  expect(index).toContain(`(${origin}/rationale.md)`);
  expect(index).toContain("/main/AGENTS.md)");
});

test("agents can read each page as Markdown", async ({ page, request }) => {
  const negotiated = await request.get("/rationale", { headers: { accept: "text/markdown" } });
  expect(negotiated.status()).toBe(200);
  expect(negotiated.headers()["content-type"]).toContain("text/markdown");
  expect(negotiated.headers().vary).toContain("accept");
  const article = await negotiated.text();
  expect(article).toMatch(/^# Rodeo Philosophy/);
  expect(article).toContain(`(${origin}/rationale#footnotes)`);

  const home = await request.get("/index.md");
  expect(await home.text()).toMatch(/^# rodeo: A free React starter for Claude Code and Codex\./);

  const browser = await request.get("/rationale", {
    headers: { accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
  });
  expect(browser.headers()["content-type"]).toContain("text/html");

  await page.goto("/rationale");
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
    "href",
    `${origin}/rationale.md`,
  );
});

test("each page describes itself with structured data", async ({ page }) => {
  await page.goto("/");
  expect(await structuredData(page)).toMatchObject({
    "@graph": expect.arrayContaining([
      expect.objectContaining({
        "@type": "SoftwareSourceCode",
        codeRepository: "https://github.com/quinnsprouse/rodeo",
      }),
    ]),
  });

  await page.goto("/rationale");
  expect(await structuredData(page)).toMatchObject({
    "@type": "Article",
    url: `${origin}/rationale`,
    datePublished: "2026-10-17",
  });
  await expect(page.locator("article time")).toHaveAttribute("datetime", "2026-10-17");
});

test("a trailing slash redirects permanently to the page", async ({ request }) => {
  const response = await request.get("/rationale/?ref=x", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/rationale?ref=x");
});

test("older browsers and crawlers find the icon at /favicon.ico", async ({ request }) => {
  const response = await request.get("/favicon.ico");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/(x-icon|vnd\.microsoft\.icon)$/);
});
