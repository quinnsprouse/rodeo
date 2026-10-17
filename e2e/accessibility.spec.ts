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

for (const colorScheme of ["light", "dark"] as const) {
  test(`home page has no WCAG violations in the ${colorScheme} theme`, async ({ page }) => {
    // why: Axe samples colors mid-animation, so reduced motion renders the settled page.
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByText("Route loader and server function are connected.")).toBeVisible();

    expect(await axeViolations(page)).toEqual([]);
  });
}

test("not-found and error pages have no WCAG violations", async ({ page }) => {
  await page.goto("/definitely-missing");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);

  await page.goto("/?demo=crash");
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});
