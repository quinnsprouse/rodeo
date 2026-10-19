import { expect, test } from "@playwright/test";

import { trackBrowserErrors } from "./helpers";

test("the home page renders without errors", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.locator("main")).toBeVisible();
  expect(browserErrors).toHaveLength(0);
});

test("the home page fits on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("a first visit follows the system theme", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const root = page.locator("html");

  await expect(root).toHaveClass(/\bdark\b/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(root).not.toHaveClass(/\bdark\b/);
  expect(browserErrors).toHaveLength(0);
});

test("unknown routes return a real 404 inside the application shell", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  const response = await page.goto("/definitely-missing");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Rodeo — React starter for Claude Code and Codex");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back home" })).toBeVisible();
  expect(
    browserErrors.filter(
      (error) => !error.message.includes("server responded with a status of 404"),
    ),
  ).toHaveLength(0);
});
