import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

function firstSnippet(page: Page) {
  return {
    command: page.getByRole("code").first(),
    copy: page.getByRole("button", { name: "Copy to clipboard" }).first(),
  };
}

function recordCopiedText(page: Page) {
  return page.addInitScript(() => {
    document.addEventListener("copy", () => {
      document.documentElement.dataset.copied = String(window.getSelection());
    });
  });
}

test.describe(() => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("the copy button puts the command shown beside it on the clipboard", async ({ page }) => {
    await page.goto("/");
    const { command, copy } = firstSnippet(page);
    const shown = await command.textContent();

    await copy.click();
    await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shown);
  });
});

test("copy falls back to the selection when the clipboard API is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });
  await recordCopiedText(page);
  await page.goto("/");
  const { command, copy } = firstSnippet(page);

  await copy.click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-copied",
    String(await command.textContent()),
  );
});

test("copy explains the manual path when no copy method works", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    Object.defineProperty(document, "execCommand", { configurable: true, value: () => false });
  });
  await page.goto("/");
  const { command, copy } = firstSnippet(page);

  await copy.click();
  await expect(
    page.getByText("Couldn't copy. Select and copy the command manually."),
  ).toBeVisible();
  expect(await page.evaluate(() => String(window.getSelection()))).toBe(
    await command.textContent(),
  );
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
  const { command, copy } = firstSnippet(page);

  await copy.click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-copied",
    String(await command.textContent()),
  );
});
