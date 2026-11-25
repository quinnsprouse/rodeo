import type { Page } from "@playwright/test";

import { copyFallbacks, copyState, snippetHolding, withCopyFallback } from "./copy-command";
import { appOrigin as origin } from "./environment";
import { expect, test } from "./fixtures";
import { structuredData } from "./helpers";
import { callTool, openWithWebMcp } from "./web-mcp";

function chip(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

function installCommand(page: Page) {
  return snippetHolding(page.getByRole("code").first());
}

test.describe(() => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("the install command in the header copies to the clipboard", async ({ page }) => {
    await page.goto("/");
    const { command, copy, status } = installCommand(page);
    const shown = await command.textContent();

    await copy.click();
    await expect(status).toHaveText("Copied to clipboard.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shown);
  });
});

for (const fallback of copyFallbacks) {
  test(`the install command in the header ${fallback.title}`, async ({ page }) => {
    await withCopyFallback(page, fallback);
    await page.goto("/");
    const snippet = installCommand(page);
    const shown = String(await snippet.command.textContent());

    await snippet.copy.click();
    await expect
      .poll(() => copyState(snippet))
      .toEqual(fallback.outcome(shown, "Copy the install command"));
  });
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

  test("shows the four Lighthouse scores without JavaScript", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("term")).toHaveText([
      "Performance",
      "Accessibility",
      "Best practices",
      "SEO",
    ]);
    await expect(page.getByRole("definition")).toHaveText(["100", "100", "100", "100"]);

    const drawn = await page.getByRole("definition").evaluateAll((gauges) =>
      gauges.map((gauge) => {
        const count = gauge.querySelector("span[aria-hidden]");
        const arc = gauge.querySelector("path:last-of-type");
        return {
          count: getComputedStyle(gauge).getPropertyValue("--gauge-count"),
          counter: count && getComputedStyle(count).counterReset,
          digits: count && getComputedStyle(count, "::after").content,
          arcOffset: arc && Number.parseFloat(getComputedStyle(arc).strokeDashoffset),
          arcOpacity: arc && getComputedStyle(arc).opacity,
        };
      }),
    );
    expect(drawn).toEqual(
      Array.from({ length: 4 }, () => ({
        count: "100",
        counter: "gauge 100",
        digits: "counter(gauge)",
        arcOffset: 0,
        arcOpacity: "1",
      })),
    );
  });

  test("marks only the current checks stage before the tab indicator is placed", async ({
    page,
  }) => {
    await page.goto("/");
    const stages = page.getByRole("tablist", { name: "When Rodeo checks" });
    const background = (name: string) =>
      stages.getByRole("tab", { name }).evaluate((tab) => getComputedStyle(tab).backgroundColor);

    await expect(stages.locator('[data-slot="tabs-indicator"]')).toBeHidden();
    expect(await background("Every edit")).not.toBe(await background("Every push"));
    expect(await background("Every push")).toBe(await background("Every pull request"));
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

test("a browser agent presses a hero chip by its name through WebMCP", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openWithWebMcp(page, "/");
  await expect
    .poll(() => callTool(page, "snapshot", {}))
    .toEqual(
      expect.arrayContaining([
        expect.objectContaining({ component: "button", label: "edit", actions: ["press"] }),
      ]),
    );

  expect(await callTool(page, "act", { steps: [{ ref: "edit", action: "press" }] })).toMatchObject({
    ok: true,
  });
  await expect(chip(page, "commit")).toBeVisible();
});

test("a browser agent reads the checks stages and switches one by name through WebMCP", async ({
  page,
}) => {
  await openWithWebMcp(page, "/");

  await expect
    .poll(() => callTool(page, "snapshot", {}))
    .toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "tabs",
          label: "When Rodeo checks",
          value: "edit",
          actions: ["setValue"],
          items: [
            { value: "edit", label: "Every edit" },
            { value: "push", label: "Every push" },
            { value: "pull-request", label: "Every pull request" },
          ],
        }),
      ]),
    );

  expect(
    await callTool(page, "act", {
      steps: [{ ref: "When Rodeo checks", action: "setValue", args: ["Every pull request"] }],
    }),
  ).toMatchObject({ ok: true });
  await expect(page.getByText("CI: Cannot find module './prices.server'")).toBeVisible();
});

test("a browser agent can use each control the homepage says it sees, by the name shown", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openWithWebMcp(page, "/");
  const shown = page.getByRole("table").locator("tbody tr");
  const rows = () =>
    shown.evaluateAll((all) =>
      all.map((row) => Array.from(row.children, (cell) => cell.textContent)),
    );

  expect(await rows()).toEqual([
    ["button", "Switch to dark theme", "press"],
    ["tabs", "When Rodeo checks", "setValue"],
    ["button", "Copy the install command", "press"],
  ]);
  await expect
    .poll(() => callTool(page, "snapshot", {}))
    .toEqual(
      expect.arrayContaining([
        expect.objectContaining({ component: "button", label: "Switch to dark theme" }),
        expect.objectContaining({ component: "tabs", label: "When Rodeo checks" }),
        expect.objectContaining({ component: "button", label: "Copy the install command" }),
      ]),
    );

  expect(
    await callTool(page, "act", {
      steps: [
        { ref: "Copy the install command", action: "press" },
        { ref: "When Rodeo checks", action: "setValue", args: ["Every push"] },
        { ref: "Switch to dark theme", action: "press" },
      ],
    }),
  ).toMatchObject({ ok: true });
  await expect(page.getByText("Unused export: formatPrice")).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  expect((await rows())[0]).toEqual(["button", "Switch to light theme", "press"]);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await installCommand(page).command.textContent(),
  );
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
  expect(await structuredData(page)).toMatchObject([
    {
      "@graph": expect.arrayContaining([
        expect.objectContaining({ "@type": "SoftwareSourceCode", codeRepository: repository }),
      ]),
    },
  ]);

  const markdownUrl = await page
    .locator('link[rel="alternate"][type="text/markdown"]')
    .getAttribute("href");
  const markdown = await (await request.get(new URL(String(markdownUrl)).pathname)).text();
  const philosophy = page.getByRole("main").getByRole("link", { name: "Read the philosophy" });
  const philosophyUrl = new URL(String(await philosophy.getAttribute("href")), origin).href;
  expect(markdown).toContain(`[Read the philosophy](${philosophyUrl})`);
});
