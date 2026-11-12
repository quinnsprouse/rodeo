import { appOrigin } from "./environment";
import { expect, notFoundResponse, test } from "./fixtures";
import { axeViolations } from "./helpers";

test.use({ expectedBrowserErrors: [notFoundResponse] });

test("unknown routes return a real 404 inside the application shell", async ({ page }) => {
  const response = await page.goto("/definitely-missing");

  expect(response?.status()).toBe(404);
  const title = await page.title();
  expect(title).not.toBe("");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back home" })).toBeVisible();
});

test("the not-found page has no WCAG violations", async ({ page }) => {
  await page.goto("/definitely-missing");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

test("a missing page claims no canonical URL but still shares the site image", async ({ page }) => {
  await page.goto("/definitely-missing");

  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  const image = new URL(
    String(await page.locator('meta[property="og:image"]').getAttribute("content")),
  );
  expect(image.origin).toBe(appOrigin);
  await expect(await page.request.get(image.pathname)).toBeOK();
});
