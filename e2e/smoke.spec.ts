import { expect, test, type Page } from "@playwright/test";

const installCommand = "npx degit quinnsprouse/rodeo my-app";

function trackPageErrors(page: Page) {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error);
  });
  return pageErrors;
}

test("home page renders and copy flow works", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await page.goto("/");

  await expect(page.getByRole("img", { name: /rodeo/i })).toBeVisible();
  await expect(page.getByLabel("agents.")).toBeVisible();
  await expect(page.getByRole("link", { name: /github/i })).toBeVisible();
  await expect(page.getByText(installCommand)).toBeVisible();

  const copyButton = page.getByRole("button", { name: "Copy to clipboard" });
  await copyButton.click();
  await expect(copyButton).toBeVisible();
  expect(pageErrors).toHaveLength(0);
});

test("home page fits on mobile", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("img", { name: /rodeo/i })).toBeVisible();
  await expect(page.getByText(installCommand)).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(pageErrors).toHaveLength(0);
});

test("reduced motion shows content immediately", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /built for/i })).toBeVisible();
  await expect(page.getByText(installCommand)).toBeVisible();
  expect(pageErrors).toHaveLength(0);
});
