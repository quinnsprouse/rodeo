import { expect, test } from "@playwright/test";

import { axeViolations } from "./helpers";

for (const theme of ["light", "dark"] as const) {
  test(`the home page has no WCAG violations in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((stored) => localStorage.setItem("rodeo-theme", stored), theme);
    // why: Axe samples colors mid-animation, so reduced motion renders the settled page.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();

    expect(await axeViolations(page)).toEqual([]);
  });
}

test("the not-found page has no WCAG violations", async ({ page }) => {
  await page.goto("/definitely-missing");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});
