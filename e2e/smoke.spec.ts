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

  await expect(page.getByRole("heading", { level: 1, name: "rodeo" })).toBeVisible();
  await expect(page.getByText("Checks every")).toBeVisible();
  await expect(page.getByRole("link", { name: /github/i }).first()).toBeVisible();
  await expect(page.getByText(installCommand).first()).toBeVisible();

  const copyButton = page.getByRole("button", { name: "Copy to clipboard" }).first();
  await copyButton.click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(installCommand);
  expect(browserErrors).toHaveLength(0);
});

test("copy explains the manual path when the clipboard API is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Copy to clipboard" }).first().click();
  await expect(
    page.getByText("Couldn't copy. Select and copy the command manually."),
  ).toBeVisible();
});

test("copy reports denied clipboard access and succeeds on retry", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
    });
  });
  await page.goto("/");
  const copyButton = page.getByRole("button", { name: "Copy to clipboard" }).first();

  await copyButton.click();
  await expect(
    page.getByText("Couldn't copy. Select and copy the command manually."),
  ).toBeVisible();

  await page.evaluate(() => Reflect.deleteProperty(navigator.clipboard, "writeText"));
  await copyButton.click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(installCommand);
});

async function swapChip(page: Page, current: string, next: string) {
  await page.getByRole("button", { name: current, exact: true }).click();
  await expect(page.getByRole("button", { name: next, exact: true })).toBeVisible();
}

test("swap chips show the next example when clicked", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await swapChip(page, "edit", "commit");
  await swapChip(page, "commit", "push");
  await swapChip(page, "push", "edit");
  await swapChip(page, "stray comments", "dead code");
  await swapChip(page, "Claude Code", "Codex");
  expect(browserErrors).toHaveLength(0);
});

test("swap chips play on their own when motion is allowed", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "commit", exact: true })).toBeVisible();
  expect(browserErrors).toHaveLength(0);
});

test("full-stack example handles and recovers from server errors", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.goto("/example");

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

  await expect(page.getByRole("heading", { level: 1, name: "rodeo" })).toBeVisible();
  await expect(page.getByText(installCommand).first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toHaveLength(0);
});

test("theme starts light and remembers a switch to dark", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const root = page.locator("html");

  await expect(root).not.toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(root).toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(root).toHaveClass(/\bdark\b/);
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  expect(browserErrors).toHaveLength(0);
});

test("philosophy contents follow the reader to the last section", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "Philosophy", exact: true }).click();
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

test("the scroll hint leads past the header and then gets out of the way", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.goto("/");
  const hint = page.getByRole("link", { name: "Scroll to how Rodeo works" });

  await hint.click();
  await expect(
    page.getByRole("heading", { name: "Fix it in the codebase, not the prompt." }),
  ).toBeInViewport();
  await expect(hint).toBeHidden();
  expect(browserErrors).toHaveLength(0);
});

test("reduced motion shows content immediately", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "rodeo" })).toBeVisible();
  await expect(page.getByText(installCommand).first()).toBeVisible();
  await page.clock.fastForward(6000);
  await expect(page.getByRole("button", { name: "edit", exact: true })).toBeVisible();
  expect(browserErrors).toHaveLength(0);
});

test("motion responds when the system preference changes", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "edit", exact: true })).toBeVisible();

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.getByRole("button", { name: "commit", exact: true })).toBeVisible();
  expect(browserErrors).toHaveLength(0);
});

test.describe("server-rendered introduction", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the introduction without JavaScript", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "rodeo" })).toBeVisible();
    await expect(page.getByText("Checks every")).toBeVisible();
    await expect(page.getByText(installCommand).first()).toBeVisible();
    await expect(page.getByText("Format, lint, and types pass")).toBeVisible();
  });
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
  const response = await page.goto("/example?demo=crash");

  expect(response?.status()).toBe(500);
  await expect(page).toHaveTitle("Full-stack example — Rodeo");
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  await expect(
    page.getByText("The application hit an unexpected error.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("The starter server function failed as requested.", { exact: false }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.getByRole("link", { name: "Back home" }).click();
  await expect(page.getByText(installCommand).first()).toBeVisible();
});
