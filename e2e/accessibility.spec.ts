import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// jsx-a11y reads source code. Axe checks the rendered page, including color contrast in both
// themes, landmarks, and the accessible names in the final DOM.
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
    // Reduced motion renders the settled page, so axe never samples a half-faded element.
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

test("responses carry the baseline security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
});
