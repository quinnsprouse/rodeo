import { expect, test, type Page } from "@playwright/test";

import { origin, structuredData, trackBrowserErrors } from "./helpers";

const installCommand = "npx degit quinnsprouse/rodeo my-app";

test("the install command copies to the clipboard", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "rodeo" })).toBeVisible();
  await expect(page.getByText(/^Checks every/)).toBeVisible();
  await expect(page.getByRole("link", { name: /github/i }).first()).toBeVisible();
  await expect(page.getByText(installCommand).first()).toBeVisible();

  const copyButton = page.getByRole("button", { name: "Copy to clipboard" }).first();
  await copyButton.click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(installCommand);
  expect(browserErrors).toHaveLength(0);
});

function recordCopiedText(page: Page) {
  return page.addInitScript(() => {
    document.addEventListener("copy", () => {
      document.documentElement.dataset.copied = String(window.getSelection());
    });
  });
}

test("copy falls back to the selection when the clipboard API is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });
  await recordCopiedText(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Copy to clipboard" }).first().click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-copied", installCommand);
});

test("copy explains the manual path when no copy method works", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    Object.defineProperty(document, "execCommand", { configurable: true, value: () => false });
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Copy to clipboard" }).first().click();
  await expect(
    page.getByText("Couldn't copy. Select and copy the command manually."),
  ).toBeVisible();
  expect(await page.evaluate(() => String(window.getSelection()))).toBe(installCommand);
});

test("copy falls back when clipboard access is denied", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
    });
  });
  await recordCopiedText(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Copy to clipboard" }).first().click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-copied", installCommand);
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

test("a theme switch overrides the system theme and is remembered", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const root = page.locator("html");

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(root).not.toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(root).not.toHaveClass(/\bdark\b/);
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
  await expect(root).not.toHaveClass(/\bdark\b/);
  expect(browserErrors).toHaveLength(0);
});

test("the scroll hint leads past the header and then gets out of the way", async ({ page }) => {
  const browserErrors = trackBrowserErrors(page);
  await page.goto("/");
  const hint = page.getByRole("link", { name: "Scroll to how Rodeo works" });

  await hint.click();
  await expect(
    page.getByRole("heading", { name: "Start with code you want the agent to copy." }),
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
    await expect(page.getByText(/^Checks every/)).toBeVisible();
    await expect(page.getByText(installCommand).first()).toBeVisible();
    await expect(page.getByText("Format, lint, and types pass")).toBeVisible();
  });
});

test("the checks demo shows what Rodeo catches at each stage", async ({ page }) => {
  await page.goto("/");
  const stages = page.getByRole("tablist", { name: "When Rodeo checks" });

  await expect(stages.getByRole("tab", { name: "Every edit" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("process.env in browser code")).toBeVisible();

  await stages.getByRole("tab", { name: "Every push" }).click();
  await expect(page.getByText("Unused export: formatPrice")).toBeVisible();
  await expect(page.getByText("process.env in browser code")).toBeHidden();

  await stages.getByRole("tab", { name: "Every pull request" }).press("Enter");
  await expect(page.getByText("CI: Cannot find module './prices.server'")).toBeVisible();
});

test("switching checks stages keeps the page where the reader left it", async ({ page }) => {
  await page.goto("/");
  const stages = page.getByRole("tablist", { name: "When Rodeo checks" });
  await stages.evaluate((list) => list.scrollIntoView({ block: "center", behavior: "instant" }));
  const scrollBefore = await page.evaluate(() => window.scrollY);

  await stages.getByRole("tab", { name: "Every push" }).click();
  await expect(page.getByText("Unused export: formatPrice")).toBeVisible();

  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
});

test("the theme toggle switches the browser chrome and remembers it", async ({ page }) => {
  await page.goto("/");
  const browserChrome = page.locator('meta[name="theme-color"]');

  await expect(browserChrome).toHaveAttribute("content", "#ffffff");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(browserChrome).toHaveAttribute("content", "#000000");

  await page.reload();
  await expect(browserChrome).toHaveAttribute("content", "#000000");
});

test("the home page describes Rodeo with structured data and Markdown", async ({
  page,
  request,
}) => {
  await page.goto("/");
  expect(await structuredData(page)).toMatchObject({
    "@graph": expect.arrayContaining([
      expect.objectContaining({
        "@type": "SoftwareSourceCode",
        codeRepository: "https://github.com/quinnsprouse/rodeo",
      }),
    ]),
  });

  const home = await (await request.get("/index.md")).text();
  expect(home).toMatch(/^# rodeo: A free React starter for Claude Code and Codex\./);
  expect(home).toContain(`[Read the philosophy](${origin}/philosophy)`);
});
