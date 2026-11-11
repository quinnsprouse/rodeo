import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { brightness, chromePaintedBackground, pageColors } from "./helpers";

async function changeSystemScheme(page: Page, colorScheme: "light" | "dark") {
  const listener = await page.evaluateHandle((query) => {
    const change = new Promise<void>((resolve) => {
      matchMedia(query).addEventListener("change", () => resolve(), { once: true });
    });
    return { change };
  }, `(prefers-color-scheme: ${colorScheme})`);
  await page.emulateMedia({ colorScheme });
  await listener.evaluate(({ change }) => change);
}

async function backgroundChangesFrom(page: Page, before: string) {
  await expect.poll(async () => (await pageColors(page)).background).not.toBe(before);
  return chromePaintedBackground(page);
}

test("a first visit follows the system theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const dark = await chromePaintedBackground(page);

  await changeSystemScheme(page, "light");
  const light = await backgroundChangesFrom(page, dark);
  expect(brightness(light), "The light theme is brighter than the dark theme").toBeGreaterThan(
    brightness(dark),
  );
});

test("the theme toggle repaints the page and the browser chrome, and a reload keeps it", async ({
  page,
}) => {
  await page.goto("/");
  const system = await chromePaintedBackground(page);

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  const chosen = await backgroundChangesFrom(page, system);
  expect(brightness(chosen)).toBeLessThan(brightness(system));

  await page.reload();
  expect(await chromePaintedBackground(page)).toBe(chosen);
});

test("a chosen theme overrides the system theme, after a reload and a system change", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const system = await chromePaintedBackground(page);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  const chosen = await backgroundChangesFrom(page, system);

  await page.reload();
  expect(await chromePaintedBackground(page)).toBe(chosen);
  await changeSystemScheme(page, "light");
  await changeSystemScheme(page, "dark");
  expect(await chromePaintedBackground(page)).toBe(chosen);
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});
