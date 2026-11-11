import type { Page } from "@playwright/test";

import { appOrigin as origin } from "./environment";
import { expect, test } from "./fixtures";
import { structuredData } from "./helpers";

function chip(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

test("swap chips show the next example when clicked", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await chip(page, "edit").click();
  await expect(chip(page, "commit")).toBeVisible();
  await chip(page, "commit").click();
  await expect(chip(page, "push")).toBeVisible();
  await chip(page, "push").click();
  await expect(chip(page, "edit")).toBeVisible();
  await chip(page, "stray comments").click();
  await expect(chip(page, "dead code")).toBeVisible();
  await chip(page, "Claude Code").click();
  await expect(chip(page, "Codex")).toBeVisible();
});

test("swap chips play on their own when motion is allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await expect(chip(page, "commit")).toBeVisible();
});

test("the scroll hint leads past the header and then gets out of the way", async ({ page }) => {
  await page.goto("/");
  const hint = page.getByRole("link", { name: "Scroll to how Rodeo works" });

  await hint.click();
  await expect(
    page.getByRole("heading", { name: "Start with code you want the agent to copy." }),
  ).toBeInViewport();
  await expect(hint).toBeHidden();
});

test("reduced motion keeps the swap chips on their first example", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();

  await page.clock.fastForward(6000);
  await expect(chip(page, "edit")).toBeVisible();
});

test("motion responds when the system preference changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(chip(page, "edit")).toBeVisible();

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(chip(page, "commit")).toBeVisible();
});

test.describe("server-rendered introduction", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the introduction without JavaScript", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "rodeo" })).toBeVisible();
    await expect(page.getByText(/^Checks every/)).toBeVisible();
    await expect(page.getByRole("code").first()).toHaveText(/\S/);
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

test("the home page names its repository and keeps its links in the Markdown", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const repository = await page.getByRole("link", { name: "GitHub" }).first().getAttribute("href");
  expect(await structuredData(page)).toMatchObject({
    "@graph": expect.arrayContaining([
      expect.objectContaining({ "@type": "SoftwareSourceCode", codeRepository: repository }),
    ]),
  });

  const markdownUrl = await page
    .locator('link[rel="alternate"][type="text/markdown"]')
    .getAttribute("href");
  const markdown = await (await request.get(new URL(String(markdownUrl)).pathname)).text();
  const philosophy = page.getByRole("main").getByRole("link", { name: "Read the philosophy" });
  const philosophyUrl = new URL(String(await philosophy.getAttribute("href")), origin).href;
  expect(markdown).toContain(`[Read the philosophy](${philosophyUrl})`);
});
