import { expect, test } from "@playwright/test";

import { origin } from "./helpers";

test("robots.txt points crawlers at a sitemap of every page", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
  expect(await sitemap.text()).toContain(`<loc>${origin}/</loc>`);
});

test("llms.txt links every page as Markdown and the agent rules", async ({ request }) => {
  const index = await (await request.get("/llms.txt")).text();

  expect(index).toMatch(/^# Rodeo\n/);
  expect(index).toContain(`(${origin}/index.md)`);
  expect(index).toContain("/main/AGENTS.md)");
});

test("agents can read each page as Markdown", async ({ page, request }) => {
  const negotiated = await request.get("/", { headers: { accept: "text/markdown" } });
  expect(negotiated.status()).toBe(200);
  expect(negotiated.headers()["content-type"]).toContain("text/markdown");
  expect(negotiated.headers().vary).toContain("accept");

  const markdown = await request.get("/index.md");
  expect(markdown.status()).toBe(200);
  expect(markdown.headers()["content-type"]).toContain("text/markdown");

  const browser = await request.get("/", {
    headers: { accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
  });
  expect(browser.headers()["content-type"]).toContain("text/html");

  await page.goto("/");
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
    "href",
    `${origin}/index.md`,
  );
});

test("shared links credit the author on X", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="twitter:creator"]')).toHaveAttribute(
    "content",
    "@QuinnSprouse",
  );
});

test("a trailing slash redirects permanently to the page", async ({ request }) => {
  const response = await request.get("/definitely-missing/?ref=x", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/definitely-missing?ref=x");
});

test("older browsers and crawlers find the icon at /favicon.ico", async ({ request }) => {
  const response = await request.get("/favicon.ico");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/(x-icon|vnd\.microsoft\.icon)$/);
});
