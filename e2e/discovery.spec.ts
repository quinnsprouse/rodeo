import { appOrigin as origin } from "./environment";
import { expect, test } from "./fixtures";

test("robots.txt points crawlers at the sitemap", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
});

test("llms.txt is titled with the site name and links the agent rules", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const siteName = await page.locator('meta[property="og:site_name"]').getAttribute("content");
  const index = await (await request.get("/llms.txt")).text();

  expect(index.split("\n")[0]).toBe(`# ${siteName}`);
  expect(index).toMatch(/\]\(\S+\/AGENTS\.md\)/);
});

test("the page URL serves Markdown to agents and HTML to browsers", async ({ request }) => {
  const negotiated = await request.get("/", { headers: { accept: "text/markdown" } });
  expect(negotiated.status()).toBe(200);
  expect(negotiated.headers()["content-type"]).toContain("text/markdown");
  expect(negotiated.headers().vary).toContain("accept");

  const browser = await request.get("/", {
    headers: { accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
  });
  expect(browser.headers()["content-type"]).toContain("text/html");
});

test("shared links credit the author's X handle", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="twitter:creator"]')).toHaveAttribute(
    "content",
    /^@\w{1,15}$/,
  );
});

test("a trailing slash redirects permanently to the page", async ({ request }) => {
  const response = await request.get("/definitely-missing/?ref=x", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/definitely-missing?ref=x");
});

test("a redirect's Markdown twin redirects to the twin of its target", async ({ request }) => {
  const response = await request.get("/definitely-missing/.md?ref=x", { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/definitely-missing.md?ref=x");
});

test("older browsers and crawlers find the icon at /favicon.ico", async ({ request }) => {
  const response = await request.get("/favicon.ico");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/(x-icon|vnd\.microsoft\.icon)$/);
});
