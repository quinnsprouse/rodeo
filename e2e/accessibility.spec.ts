import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function axeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  return results.violations.map(({ id, help, nodes }) => ({
    id,
    help,
    targets: nodes.map((node) => node.target.join(" ")),
  }));
}

for (const theme of ["light", "dark"] as const) {
  test(`home page has no WCAG violations in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((stored) => localStorage.setItem("rodeo-theme", stored), theme);
    // why: Axe samples colors mid-animation, so reduced motion renders the settled page.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "rodeo" })).toBeVisible();

    expect(await axeViolations(page)).toEqual([]);
  });
}

test("philosophy page has no WCAG violations", async ({ page }) => {
  await page.goto("/rationale");
  await expect(page.getByRole("heading", { name: "Rodeo Philosophy" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

test("the not-found page has no WCAG violations", async ({ page }) => {
  await page.goto("/definitely-missing");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});
