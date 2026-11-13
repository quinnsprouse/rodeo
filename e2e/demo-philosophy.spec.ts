import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { structuredData } from "./helpers";

function hiddenText(figures: Locator) {
  return figures.evaluateAll((elements) =>
    elements.map((figure) => {
      const hidden: string[] = [];
      const walker = document.createTreeWalker(figure, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const shown = node.parentElement?.checkVisibility({
          opacityProperty: true,
          visibilityProperty: true,
        });
        if (node.textContent?.trim() && !shown) hidden.push(node.textContent.trim());
      }
      return hidden;
    }),
  );
}

async function hiddenCounts(figures: Locator) {
  return (await hiddenText(figures)).map((hidden) => hidden.length);
}

async function everyFigureHoldsText(page: Page) {
  const counts = await hiddenCounts(page.getByRole("figure"));
  return counts.length > 0 && counts.every((count) => count > 0);
}

async function textHiddenInAnyFigure(page: Page) {
  return (await hiddenText(page.getByRole("figure"))).flat();
}

const often = { intervals: [100] };
const settled = { ...often, timeout: 10_000 };

async function hasStarted(figure: Locator, held: number) {
  const [hidden = held] = await hiddenCounts(figure);
  const moving = await figure.evaluate(
    (element) => element.getAnimations({ subtree: true }).length,
  );
  return hidden < held || moving > 0;
}

async function readEachFigure(figures: Locator[], heldBefore: number[]): Promise<void> {
  const [figure, ...rest] = figures;
  const [held = 0, ...restHeld] = heldBefore;
  if (!figure) return;
  await figure.scrollIntoViewIfNeeded();
  await expect
    .poll(() => hasStarted(figure, held), {
      ...often,
      message: "A figure starts to play once the reader reaches it",
    })
    .toBe(true);
  await readEachFigure(rest, restHeld);
}

test("philosophy figures show their final state when the reader prefers reduced motion", async ({
  page,
}) => {
  await page.goto("/philosophy");
  await expect.poll(() => everyFigureHoldsText(page), often).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => textHiddenInAnyFigure(page), settled).toEqual([]);
});

test("each philosophy figure waits for the reader, then plays to a final state that shows all its text", async ({
  page,
}) => {
  await page.goto("/philosophy");
  await expect.poll(() => everyFigureHoldsText(page), often).toBe(true);
  const held = await hiddenCounts(page.getByRole("figure"));

  await readEachFigure(await page.getByRole("figure").all(), held);
  await expect.poll(() => textHiddenInAnyFigure(page), settled).toEqual([]);
});

function noteWhenTheFirstFigureMoves() {
  document.addEventListener("transitionrun", ({ target }) => {
    const firstFigure = document.querySelector("figure");
    if (target instanceof Node && firstFigure?.contains(target)) {
      document.documentElement.dataset.firstFigure = "moved";
    }
  });
}

test("a figure already on screen when the page loads still plays, and the next one waits for the reader", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1500 });
  await page.addInitScript(noteWhenTheFirstFigureMoves);
  await page.goto("/philosophy");
  const onScreen = page.getByRole("figure").first();
  const belowThePlayLine = page.getByRole("figure").nth(1);

  await expect(onScreen).toBeInViewport();
  await expect(page.locator("html")).toHaveAttribute("data-first-figure", "moved");
  await expect.poll(() => hiddenCounts(onScreen), settled).toEqual([0]);
  await expect.poll(() => hiddenCounts(belowThePlayLine), often).not.toEqual([0]);
});

test.describe("server-rendered figures", () => {
  test.use({ javaScriptEnabled: false });

  test("show their final state without JavaScript", async ({ page }) => {
    await page.goto("/philosophy");
    await expect(page.getByRole("figure").first()).toBeVisible();
    expect(await textHiddenInAnyFigure(page)).toEqual([]);
  });
});

test("philosophy contents follow the reader to the last section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: "Philosophy", exact: true }).first().click();
  const contents = page.getByRole("navigation", { name: "Contents" });

  await expect(
    contents.getByRole("link", { name: "Teaching through the codebase" }),
  ).toHaveAttribute("aria-current", "location");
  await contents.getByRole("link", { name: "Acknowledgements" }).click();
  await expect(contents.getByRole("link", { name: "Acknowledgements" })).toHaveAttribute(
    "aria-current",
    "location",
  );
});

test("the philosophy page is listed in the sitemap", async ({ page, request }) => {
  await page.goto("/philosophy");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");

  expect(await (await request.get("/sitemap.xml")).text()).toContain(`<loc>${canonical}</loc>`);
});

test("the philosophy page describes itself as an article by its author", async ({ page }) => {
  await page.goto("/philosophy");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  const published = await page.locator("article time").getAttribute("datetime");
  const creator = String(
    await page.locator('meta[name="twitter:creator"]').getAttribute("content"),
  );

  expect(await structuredData(page)).toMatchObject([
    {
      "@type": "Article",
      url: canonical,
      datePublished: published,
      author: { sameAs: expect.arrayContaining([`https://x.com/${creator.slice(1)}`]) },
    },
  ]);
});

test("the old /rationale URL redirects permanently to /philosophy", async ({ request }) => {
  const page = await request.get("/rationale", { maxRedirects: 0 });
  expect(page.status()).toBe(308);
  expect(page.headers().location).toBe("/philosophy");

  const markdown = await request.get("/rationale.md", { maxRedirects: 0 });
  expect(markdown.status()).toBe(308);
  expect(markdown.headers().location).toBe("/philosophy.md");
});

test("the /rationale redirects keep the query string and the security headers", async ({
  request,
}) => {
  const page = await request.get("/rationale?ref=x", { maxRedirects: 0 });
  expect(page.headers().location).toBe("/philosophy?ref=x");
  expect(page.headers()["x-content-type-options"]).toBe("nosniff");

  const markdown = await request.get("/rationale.md?ref=x", { maxRedirects: 0 });
  expect(markdown.headers().location).toBe("/philosophy.md?ref=x");
  expect(markdown.headers()["x-content-type-options"]).toBe("nosniff");
});
