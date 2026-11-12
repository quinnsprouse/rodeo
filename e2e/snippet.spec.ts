import type { Page } from "@playwright/test";

import { copyFallbacks, copyState, snippetAround, withCopyFallback } from "./copy-command";
import { expect, test } from "./fixtures";

function kitSnippet(page: Page) {
  return snippetAround(page.getByRole("status").last());
}

test.describe(() => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("the copy button puts the command shown beside it on the clipboard", async ({ page }) => {
    await page.goto("/");
    const { command, copy } = kitSnippet(page);
    const shown = await command.textContent();

    await copy.click();
    await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shown);
  });
});

for (const fallback of copyFallbacks) {
  test(`the copy button ${fallback.title}`, async ({ page }) => {
    await withCopyFallback(page, fallback);
    await page.goto("/");
    const snippet = kitSnippet(page);
    const shown = String(await snippet.command.textContent());

    await snippet.copy.click();
    await expect.poll(() => copyState(snippet)).toEqual(fallback.outcome(shown));
  });
}
