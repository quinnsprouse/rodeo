import { expect, test, type Page } from "@playwright/test";

const installCommand = "npx degit quinnsprouse/rodeo my-app";

function trackBrowserErrors(page: Page) {
  const browserErrors: Error[] = [];
  page.on("pageerror", (error) => {
    browserErrors.push(error);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(new Error(message.text()));
    }
  });
  return browserErrors;
}

test("home page renders and copy flow works", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.goto("/");

  await expect(page.getByRole("img", { name: "Rodeo" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.fonts.check('128px "Yellowtail"')))
    .toBe(true);
  await expect(page.getByLabel("agents.")).toBeVisible();
  await expect(page.getByRole("link", { name: /github/i })).toBeVisible();
  await expect(page.getByText(installCommand)).toBeVisible();
  await expect(page.getByText("Route loader and server function are connected.")).toBeVisible();

  const copyButton = page.getByRole("button", { name: "Copy to clipboard" });
  await copyButton.click();
  await expect(copyButton).toBeVisible();
  expect(browserErrors).toHaveLength(0);
});

test("full-stack example handles and recovers from server errors", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.goto("/");

  await page.getByRole("link", { name: "Preview the error path" }).click();
  await expect(page.getByRole("heading", { name: "Handled server error" })).toBeVisible();
  await expect(page.getByText("The starter server function failed as requested.")).toBeVisible();

  await page.getByRole("link", { name: "Return to ready state" }).click();
  await expect(page.getByText("Route loader and server function are connected.")).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
  expect(browserErrors).toHaveLength(0);
});

test("home page fits on mobile", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("img", { name: "Rodeo" })).toBeVisible();
  await expect(page.getByText(installCommand)).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toHaveLength(0);
});

test("reduced motion shows content immediately", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /built for/i })).toBeVisible();
  await expect(page.getByText(installCommand)).toBeVisible();
  expect(browserErrors).toHaveLength(0);
});

test("unknown routes return a real 404 inside the application shell", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  const response = await page.goto("/definitely-missing");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Rodeo — Wrangle Your AI Agents");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back home" })).toBeVisible();
  expect(
    browserErrors.filter(
      (error) => !error.message.includes("server responded with a status of 404"),
    ),
  ).toHaveLength(0);
});

test("production route errors hide internals and offer recovery", async ({ page }) => {
  const response = await page.goto("/?demo=crash");

  expect(response?.status()).toBe(500);
  await expect(page).toHaveTitle("Rodeo — Wrangle Your AI Agents");
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  await expect(
    page.getByText("The application hit an unexpected error.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("The starter server function failed as requested.", { exact: false }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.getByRole("link", { name: "Back home" }).click();
  await expect(page.getByText("Route loader and server function are connected.")).toBeVisible();
});
